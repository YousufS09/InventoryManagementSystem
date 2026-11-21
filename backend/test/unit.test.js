// Pure-function tests. No database needed: `npm run test:unit`.
const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeDate, isPastOrToday } = require("../utils/dateUtils");
const { likePattern, buildOrderAndLimit } = require("../utils/listQuery");
const {
  validate,
  customerSchema,
  productSchema,
  signupSchema,
  listQuerySchema,
} = require("../utils/validation");

test("normalizeDate accepts common formats without time zone shifts", () => {
  assert.equal(normalizeDate("2005-03-09"), "2005-03-09");
  assert.equal(normalizeDate("09/03/2005"), "2005-03-09");
  assert.equal(normalizeDate("9-3-2005"), "2005-03-09");
  assert.equal(normalizeDate("9 March 2005"), "2005-03-09");
});

test("normalizeDate rejects impossible or junk dates", () => {
  assert.equal(normalizeDate("31/02/2005"), null);
  assert.equal(normalizeDate("2005-13-01"), null);
  assert.equal(normalizeDate("yesterday-ish"), null);
  assert.equal(normalizeDate(undefined), null);
});

test("isPastOrToday rejects future dates", () => {
  assert.equal(isPastOrToday("2000-01-01"), true);
  assert.equal(isPastOrToday("2999-01-01"), false);
});

test("customerSchema validates and normalizes input", () => {
  const ok = validate(customerSchema, {
    customerName: "  Raj  ",
    dob: "09/03/2005",
    email: "RAJ@Example.com",
    phone: "+91 98765 43210",
    location: "Chennai",
  });
  assert.equal(ok.error, undefined);
  assert.deepEqual(ok.data, {
    customerName: "Raj",
    dob: "2005-03-09",
    email: "raj@example.com",
    phone: "+91 98765 43210",
    location: "Chennai",
  });

  assert.match(validate(customerSchema, { ...ok.data, email: "nope" }).error, /Email/);
  assert.match(validate(customerSchema, { ...ok.data, phone: "abc" }).error, /Phone/);
  assert.match(validate(customerSchema, { ...ok.data, dob: "2999-01-01" }).error, /future/);
});

test("productSchema rejects empty, zero and negative numbers", () => {
  const base = { productName: "Laptop", productPrice: "100", productQuantity: "5", customerId: "3" };
  assert.deepEqual(validate(productSchema, base).data, {
    productName: "Laptop",
    productPrice: 100,
    productQuantity: 5,
    customerId: 3,
  });
  assert.match(validate(productSchema, { ...base, productPrice: "" }).error, /Price must be a number/);
  assert.match(validate(productSchema, { ...base, productPrice: "0" }).error, /greater than 0/);
  assert.match(validate(productSchema, { ...base, productQuantity: "1.5" }).error, /whole number/);
  assert.match(validate(productSchema, { ...base, customerId: "" }).error, /Customer is required/);
  assert.equal(validate(productSchema, { ...base, productQuantity: "0" }).error, undefined);
});

test("signupSchema enforces password rules", () => {
  const base = { username: "a", email: "a@b.com" };
  assert.match(validate(signupSchema, { ...base, password: "short1" }).error, /at least 8/);
  assert.match(validate(signupSchema, { ...base, password: "allletters" }).error, /number/);
  assert.equal(validate(signupSchema, { ...base, password: "Passw0rd123" }).error, undefined);
});

test("listQuerySchema applies defaults and limits", () => {
  assert.deepEqual(validate(listQuerySchema, {}).data, {
    search: "",
    order: "desc",
    page: 1,
    pageSize: 10,
  });
  assert.ok(validate(listQuerySchema, { pageSize: "500" }).error);
  assert.ok(validate(listQuerySchema, { order: "sideways" }).error);
});

test("likePattern escapes LIKE wildcards", () => {
  assert.equal(likePattern("50%_off"), "%50\\%\\_off%");
});

test("buildOrderAndLimit only uses allow-listed columns", () => {
  const columns = { id: "p.id", product_name: "p.product_name" };
  assert.equal(
    buildOrderAndLimit({ sort: "product_name", order: "asc", page: 3, pageSize: 10 }, columns, "id"),
    "ORDER BY p.product_name ASC, p.id ASC LIMIT 10 OFFSET 20"
  );
  // Unknown or malicious sort keys fall back to the default column.
  assert.equal(
    buildOrderAndLimit({ sort: "id; DROP TABLE x", order: "desc", page: 1, pageSize: 5 }, columns, "id"),
    "ORDER BY p.id DESC, p.id DESC LIMIT 5 OFFSET 0"
  );
});
