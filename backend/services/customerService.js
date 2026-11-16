const { getPool } = require("../db");

// Maps API field names to database columns. Only these columns can be written.
const CUSTOMER_COLUMNS = {
  customerName: "customer_name",
  dob: "dob",
  email: "email",
  phone: "phone",
  location: "location",
};

const SELECT_FIELDS = "id, customer_name, dob, email, phone, location";

async function listCustomers() {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers ORDER BY id DESC`
  );
  return rows;
}

async function listCustomerNames() {
  const [rows] = await getPool().execute(
    "SELECT id, customer_name FROM customers ORDER BY customer_name"
  );
  return rows;
}

async function getCustomerById(id) {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Returns every customer with this name (case-insensitive), so callers can detect duplicates.
async function findCustomersByName(name) {
  const [rows] = await getPool().execute(
    `SELECT ${SELECT_FIELDS} FROM customers WHERE LOWER(customer_name) = LOWER(?) ORDER BY id`,
    [name.trim()]
  );
  return rows;
}

async function createCustomer(data) {
  const [result] = await getPool().execute(
    `INSERT INTO customers (customer_name, dob, email, phone, location)
     VALUES (?, ?, ?, ?, ?)`,
    [data.customerName, data.dob, data.email, data.phone, data.location]
  );
  return result.insertId;
}

// Updates only the fields present in `data`. Returns false when the customer does not exist.
async function updateCustomer(id, data) {
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
    `UPDATE customers SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows > 0;
}

// Deleting a customer also deletes their products (ON DELETE CASCADE).
async function deleteCustomer(id) {
  const [result] = await getPool().execute("DELETE FROM customers WHERE id = ?", [id]);
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
