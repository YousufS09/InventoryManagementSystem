// AI assistant conversation flows against the real database, with the Groq calls replaced
// by predictable stand-ins so the tests need no API key and cost nothing.
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const { createUserRow, cleanup, getPool } = require("./helpers");
const { initDB } = require("../db");

// Replace the AI service before the controller loads it.
let nextIntent = null;
const aiPath = require.resolve(path.join(__dirname, "..", "services", "aiService"));
require.cache[aiPath] = {
  id: aiPath,
  filename: aiPath,
  loaded: true,
  exports: {
    analyzeUserMessage: async () => nextIntent,
    generateFollowUpQuestion: async (workflow, field) => `ASK:${field}`,
    generateSuccessMessage: async (action) => `CREATED:${action}`,
    generateResponse: async () => "RESPONSE",
    generateConversationalResponse: async () => "CHAT",
    generateVoiceAudio: async () => Buffer.from(""),
  },
};

const { chatWithAssistant } = require("../controllers/assistantController");

let userA;
let userB;

test.before(async () => {
  await initDB();
  userA = await createUserRow("assistant-a");
  userB = await createUserRow("assistant-b");
});

test.after(async () => {
  await cleanup();
});

// Sends one chat message as `userId` and returns the JSON the controller produced.
async function send(content, intent, userId = userA) {
  nextIntent = intent;
  let output;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      output = { status: this.statusCode, ...body };
      return this;
    },
  };
  await chatWithAssistant(
    { user: { id: userId }, body: { sessionId: "test", messages: [{ role: "user", content }] } },
    res
  );
  return output;
}

// Only looks at the test user's rows, so real data with the same names is never touched.
async function customerRow(name, userId = userA) {
  const [[row]] = await getPool().query(
    "SELECT * FROM customers WHERE customer_name = ? AND user_id = ? ORDER BY id LIMIT 1",
    [name, userId]
  );
  return row;
}

test("create customer: keeps given fields, validates answers, saves", async () => {
  let r = await send("create", {
    intent: "create_customer",
    customerName: "Asha",
    dob: "9 March 2005",
    email: "asha@example.com",
  });
  assert.equal(r.reply, "ASK:phone");

  r = await send("abc", null);
  assert.match(r.reply, /Phone must be/);

  r = await send("+91 98765 43210", null);
  assert.equal(r.reply, "ASK:location");

  r = await send("Chennai", null);
  assert.equal(r.reply, "CREATED:create_customer");

  const row = await customerRow("Asha");
  assert.equal(row.dob, "2005-03-09");
  assert.equal(row.user_id, userA);
});

test("create product: price in words is rejected, quantity 0 is allowed", async () => {
  let r = await send("create", { intent: "create_product", productName: "Kettle", customerName: "Asha" });
  assert.equal(r.reply, "ASK:productPrice");

  r = await send("fifty", null);
  assert.match(r.reply, /Price must be a number/);

  r = await send("1,500 rupees", null);
  assert.equal(r.reply, "ASK:productQuantity");

  r = await send("0", null);
  assert.equal(r.reply, "CREATED:create_product");
});

test("update several fields with confirmation buttons", async () => {
  let r = await send("update", {
    intent: "update_customer",
    customerName: "Asha",
    email: "new@example.com",
    location: "Madurai",
  });
  assert.equal(r.actions.length, 2);

  r = await send("__ACTION__:confirm_update", null);
  assert.match(r.reply, /was updated/);

  const row = await customerRow("Asha");
  assert.equal(row.email, "new@example.com");
  assert.equal(row.location, "Madurai");
  assert.equal(row.phone, "+91 98765 43210");

  r = await send("__ACTION__:confirm_update", null);
  assert.match(r.reply, /expired or was already handled/);
});

test("move a product to another customer", async () => {
  await send("create", {
    intent: "create_customer",
    customerName: "Ravi",
    dob: "2000-01-01",
    email: "ravi@example.com",
    phone: "1234567",
    location: "Delhi",
  });

  let r = await send("move", { intent: "update_product", productName: "Kettle", productNewCustomer: "Ravi" });
  assert.match(r.reply, /customer to "Ravi"/);

  r = await send("__ACTION__:confirm_update", null);
  assert.match(r.reply, /was updated/);

  const ravi = await customerRow("Ravi");
  const [[product]] = await getPool().query(
    `SELECT p.customer_id FROM products p JOIN customers c ON c.id = p.customer_id
     WHERE p.product_name = 'Kettle' AND c.user_id = ?`,
    [userA]
  );
  assert.equal(product.customer_id, ravi.id);
});

test("duplicate names ask for an ID; cancel works", async () => {
  await getPool().query(
    "INSERT INTO customers (user_id, customer_name, dob, email, phone, location) VALUES (?, 'Asha', '2000-01-01', 'x@y.com', '1234567', 'X')",
    [userA]
  );

  let r = await send("delete", { intent: "delete_customer", customerName: "Asha" });
  assert.match(r.reply, /There are 2 customers named "Asha"/);

  const asha = await customerRow("Asha");
  r = await send("delete", { intent: "delete_customer", customerName: `#${asha.id}` });
  assert.match(r.reply, /products linked/);

  r = await send("__ACTION__:cancel_delete", null);
  assert.match(r.reply, /nothing was deleted/);

  r = await send("cancel", null);
  assert.match(r.reply, /nothing in progress/);
});

test("conversation state is stored per user in the database", async () => {
  let r = await send("create", { intent: "create_customer", customerName: "Bea" }, userB);
  assert.equal(r.reply, "ASK:dob");

  const [rows] = await getPool().query("SELECT user_id FROM assistant_sessions WHERE user_id = ?", [userB]);
  assert.equal(rows.length, 1);

  // User A's next message is unaffected by user B's open flow.
  r = await send("hello", { intent: "general_question" }, userA);
  assert.equal(r.reply, "CHAT");

  await send("cancel", null, userB);
});

test("one user cannot reach another user's records through the assistant", async () => {
  const asha = await customerRow("Asha");

  let r = await send("delete", { intent: "delete_customer", customerName: `#${asha.id}` }, userB);
  assert.match(r.reply, /couldn't find a customer with ID/);

  r = await send("delete", { intent: "delete_customer", customerName: "Asha" }, userB);
  assert.match(r.reply, /couldn't find a customer named/);
});
