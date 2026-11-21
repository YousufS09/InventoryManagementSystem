// HTTP tests against the real app and MySQL: auth, validation, CRUD, per-user isolation,
// search/sort/pagination and dashboard stats.
const test = require("node:test");
const assert = require("node:assert/strict");

const { startServer, createClient, signedInClient, cleanup } = require("./helpers");

let server;
let baseUrl;

test.before(async () => {
  ({ server, baseUrl } = await startServer());
});

test.after(async () => {
  await cleanup(server);
});

const customer = (overrides = {}) => ({
  customerName: "Test Customer",
  dob: "2001-02-03",
  email: "customer@example.com",
  phone: "9876543210",
  location: "Chennai",
  ...overrides,
});

test("data routes require authentication", async () => {
  const anonymous = createClient(baseUrl);
  for (const path of ["/api/customers", "/api/products", "/api/dashboard/stats"]) {
    assert.equal((await anonymous("GET", path)).status, 401, path);
  }
  const chat = await anonymous("POST", "/api/assistant/chat", {
    sessionId: "x",
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(chat.status, 401);
});

test("signup validates input and signs the user in", async () => {
  const anonymous = createClient(baseUrl);
  assert.equal(
    (await anonymous("POST", "/api/auth/signup", { username: "x", email: "bad", password: "Passw0rd1" })).status,
    400
  );
  assert.equal((await anonymous("POST", "/api/auth/signup", "{not json")).status, 400);

  const { request, email } = await signedInClient(baseUrl, "signup");
  const profile = await request("GET", "/api/auth/profile");
  assert.equal(profile.status, 200);
  assert.equal(profile.data.user.email, email);

  const duplicate = await createClient(baseUrl)("POST", "/api/auth/signup", {
    username: "again",
    email,
    password: "Passw0rd123",
  });
  assert.equal(duplicate.status, 409);

  await request("POST", "/api/auth/logout");
  assert.equal((await request("GET", "/api/auth/profile")).status, 401);
});

test("customer CRUD with partial updates and date handling", async () => {
  const { request } = await signedInClient(baseUrl, "crud");

  assert.equal((await request("POST", "/api/customers", customer({ dob: "31/02/2005" }))).status, 400);

  const created = await request("POST", "/api/customers", customer({ dob: "09/03/2005" }));
  assert.equal(created.status, 201);
  const id = created.data.id;

  assert.equal((await request("PUT", `/api/customers/${id}`, { location: "Madurai" })).status, 200);

  const list = await request("GET", "/api/customers");
  const row = list.data.items.find((item) => item.id === id);
  assert.equal(row.dob, "2005-03-09");
  assert.equal(row.location, "Madurai");
  assert.equal(row.email, "customer@example.com");

  assert.equal((await request("PUT", "/api/customers/abc", { location: "X" })).status, 400);
  assert.equal((await request("DELETE", "/api/customers/999999999")).status, 404);
});

test("products validate input and cascade when their customer is deleted", async () => {
  const { request } = await signedInClient(baseUrl, "products");
  const customerId = (await request("POST", "/api/customers", customer())).data.id;

  const base = { productName: "Widget", productPrice: "100.50", productQuantity: "5", customerId };
  assert.equal((await request("POST", "/api/products", { ...base, productPrice: "" })).status, 400);
  assert.equal((await request("POST", "/api/products", { ...base, customerId: "" })).status, 400);
  assert.equal((await request("POST", "/api/products", { ...base, customerId: 999999999 })).status, 400);

  const created = await request("POST", "/api/products", base);
  assert.equal(created.status, 201);

  const products = await request("GET", "/api/products");
  const product = products.data.items.find((item) => item.id === created.data.id);
  assert.equal(product.product_price, 100.5);
  assert.equal(product.customer_name, "Test Customer");

  assert.equal((await request("DELETE", `/api/customers/${customerId}`)).status, 200);
  const after = await request("GET", "/api/products");
  assert.equal(after.data.items.some((item) => item.id === created.data.id), false);
});

test("users only see and change their own data", async () => {
  const a = await signedInClient(baseUrl, "owner-a");
  const b = await signedInClient(baseUrl, "owner-b");

  assert.equal((await a.request("GET", "/api/customers")).data.total, 0, "new user starts empty");

  const aCustomer = (await a.request("POST", "/api/customers", customer())).data.id;
  const aProduct = (
    await a.request("POST", "/api/products", {
      productName: "A item",
      productPrice: 10,
      productQuantity: 3,
      customerId: aCustomer,
    })
  ).data.id;
  const bCustomer = (await b.request("POST", "/api/customers", customer())).data.id;

  assert.deepEqual(
    (await b.request("GET", "/api/customers")).data.items.map((item) => item.id),
    [bCustomer]
  );
  assert.equal((await b.request("GET", "/api/products")).data.total, 0);
  assert.equal(
    (await b.request("GET", "/api/customers/allCustomers")).data.some((item) => item.id === aCustomer),
    false
  );

  assert.equal((await b.request("PUT", `/api/customers/${aCustomer}`, { location: "X" })).status, 404);
  assert.equal((await b.request("DELETE", `/api/customers/${aCustomer}`)).status, 404);
  assert.equal((await b.request("PUT", `/api/products/${aProduct}`, { productQuantity: 1 })).status, 404);
  assert.equal((await b.request("DELETE", `/api/products/${aProduct}`)).status, 404);
  assert.equal(
    (
      await b.request("POST", "/api/products", {
        productName: "Sneaky",
        productPrice: 1,
        productQuantity: 1,
        customerId: aCustomer,
      })
    ).status,
    400
  );
  assert.equal((await a.request("PUT", `/api/products/${aProduct}`, { customerId: bCustomer })).status, 400);

  // Updating with an unchanged value still counts as success.
  assert.equal((await a.request("PUT", `/api/products/${aProduct}`, { productQuantity: 3 })).status, 200);

  const aStats = (await a.request("GET", "/api/dashboard/stats")).data;
  assert.equal(aStats.totalCustomers, 1);
  assert.equal(aStats.totalProducts, 1);
  assert.equal(aStats.totalValue, 30);
  assert.equal(aStats.lowStock.length, 1, "3 units is at or below the low-stock threshold");
  assert.equal(aStats.topProducts[0].stock_value, 30);

  const bStats = (await b.request("GET", "/api/dashboard/stats")).data;
  assert.equal(bStats.totalCustomers, 1);
  assert.equal(bStats.totalProducts, 0);
});

test("customer list supports search, sort and pagination", async () => {
  const { request } = await signedInClient(baseUrl, "paging");
  const names = ["Charlie", "alpha", "Bravo", "Delta 50%", "Echo"];
  for (const name of names) {
    await request("POST", "/api/customers", customer({ customerName: name }));
  }

  const page1 = await request("GET", "/api/customers?sort=customer_name&order=asc&page=1&pageSize=2");
  assert.equal(page1.data.total, 5);
  assert.deepEqual(page1.data.items.map((item) => item.customer_name), ["alpha", "Bravo"]);

  const page3 = await request("GET", "/api/customers?sort=customer_name&order=asc&page=3&pageSize=2");
  assert.deepEqual(page3.data.items.map((item) => item.customer_name), ["Echo"]);

  const search = await request("GET", "/api/customers?search=50%25");
  assert.deepEqual(search.data.items.map((item) => item.customer_name), ["Delta 50%"]);

  assert.equal((await request("GET", "/api/customers?pageSize=1000")).status, 400);
  // Unknown sort columns are ignored rather than reaching SQL.
  assert.equal((await request("GET", "/api/customers?sort=id;DROP%20TABLE%20customers")).status, 200);
});
