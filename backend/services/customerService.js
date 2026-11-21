const { getPool } = require("../db");

// Every function takes the signed-in user's id and only touches that user's customers.

// Maps API field names to database columns. Only these columns can be written.
const CUSTOMER_COLUMNS = {
  customerName: "customer_name",
  dob: "dob",
  email: "email",
  phone: "phone",
  location: "location",
};

const SELECT_FIELDS = "id, customer_name, dob, email, phone, location";

async function listCustomers(userId) {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers WHERE user_id = ? ORDER BY id DESC`,
    [userId]
  );
  return rows;
}

async function listCustomerNames(userId) {
  const [rows] = await getPool().execute(
    "SELECT id, customer_name FROM customers WHERE user_id = ? ORDER BY customer_name",
    [userId]
  );
  return rows;
}

async function getCustomerById(userId, id) {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

// Returns every matching customer (case-insensitive), so callers can detect duplicates.
async function findCustomersByName(userId, name) {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers
     WHERE user_id = ? AND LOWER(customer_name) = LOWER(?)
     ORDER BY id`,
    [userId, name.trim()]
  );
  return rows;
}

async function createCustomer(userId, data) {
  const [result] = await getPool().execute(
    `INSERT INTO customers (user_id, customer_name, dob, email, phone, location)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, data.customerName, data.dob, data.email, data.phone, data.location]
  );
  return result.insertId;
}

// Updates only the fields present in `data`.
// Returns false when the customer does not exist or belongs to someone else.
async function updateCustomer(userId, id, data) {
  const assignments = [];
  const values = [];

  for (const [field, column] of Object.entries(CUSTOMER_COLUMNS)) {
    if (data[field] !== undefined) {
      assignments.push(`${column} = ?`);
      values.push(data[field]);
    }
  }

  if (assignments.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const [result] = await getPool().execute(
    `UPDATE customers SET ${assignments.join(", ")} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );
  return result.affectedRows > 0;
}

// Deleting a customer also deletes their products (ON DELETE CASCADE).
async function deleteCustomer(userId, id) {
  const [result] = await getPool().execute(
    "DELETE FROM customers WHERE id = ? AND user_id = ?",
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listCustomers,
  listCustomerNames,
  getCustomerById,
  findCustomersByName,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
