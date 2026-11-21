const { getPool } = require("../db");
const { likePattern, buildOrderAndLimit } = require("../utils/listQuery");

// Products have no owner column; they belong to the owner of their customer.
// Every query joins customers and filters on customers.user_id.

// Maps API field names to database columns. Only these columns can be written.
const PRODUCT_COLUMNS = {
  productName: "product_name",
  productPrice: "product_price",
  productQuantity: "product_quantity",
  customerId: "customer_id",
};

const SELECT_WITH_CUSTOMER = `
  SELECT
    p.id,
    p.product_name,
    p.product_price,
    p.product_quantity,
    p.customer_id,
    c.customer_name
  FROM products p
  JOIN customers c ON c.id = p.customer_id
  WHERE c.user_id = ?
`;

// DECIMAL columns come back from mysql2 as strings; return numbers to the client.
function toProduct(row) {
  return { ...row, product_price: Number(row.product_price) };
}

async function listProducts(userId) {
  const [rows] = await getPool().execute(`${SELECT_WITH_CUSTOMER} ORDER BY p.id DESC`, [userId]);
  return rows.map(toProduct);
}

const PRODUCT_SORT_COLUMNS = {
  id: "p.id",
  product_name: "p.product_name",
  product_price: "p.product_price",
  product_quantity: "p.product_quantity",
  customer_id: "p.customer_id",
  customer_name: "c.customer_name",
};

// One page of products, optionally filtered by a search on product or customer name.
async function searchProducts(userId, options) {
  let searchSql = "";
  const params = [userId];

  if (options.search) {
    searchSql = "AND (p.product_name LIKE ? OR c.customer_name LIKE ?)";
    const pattern = likePattern(options.search);
    params.push(pattern, pattern);
  }

  const pool = getPool();
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM products p JOIN customers c ON c.id = p.customer_id
     WHERE c.user_id = ? ${searchSql}`,
    params
  );
  const [rows] = await pool.execute(
    `${SELECT_WITH_CUSTOMER} ${searchSql}
     ${buildOrderAndLimit(options, PRODUCT_SORT_COLUMNS, "id")}`,
    params
  );

  return {
    items: rows.map(toProduct),
    total: Number(total),
    page: options.page,
    pageSize: options.pageSize,
  };
}

async function getProductById(userId, id) {
  const [rows] = await getPool().execute(`${SELECT_WITH_CUSTOMER} AND p.id = ? LIMIT 1`, [
    userId,
    id,
  ]);
  return rows[0] ? toProduct(rows[0]) : null;
}

// Returns every matching product (case-insensitive), so callers can detect duplicates.
async function findProductsByName(userId, name) {
  const [rows] = await getPool().execute(
    `${SELECT_WITH_CUSTOMER} AND LOWER(p.product_name) = LOWER(?) ORDER BY p.id`,
    [userId, name.trim()]
  );
  return rows.map(toProduct);
}

// Inserts only when the customer belongs to the user (checked in the same statement).
// Returns the new id, or null when the customer is missing or not the user's.
async function createProduct(userId, data) {
  const [result] = await getPool().execute(
    `INSERT INTO products (product_name, product_price, product_quantity, customer_id)
     SELECT ?, ?, ?, c.id FROM customers c WHERE c.id = ? AND c.user_id = ?`,
    [data.productName, data.productPrice, data.productQuantity, data.customerId, userId]
  );
  return result.affectedRows > 0 ? result.insertId : null;
}

// Updates only the fields present in `data`.
// Returns false when the product is missing or not the user's. When `data.customerId`
// is given, the new customer must also belong to the user.
async function updateProduct(userId, id, data) {
  const assignments = [];
  const values = [];

  for (const [field, column] of Object.entries(PRODUCT_COLUMNS)) {
    if (data[field] !== undefined) {
      assignments.push(`p.${column} = ?`);
      values.push(data[field]);
    }
  }

  if (assignments.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  let newCustomerCheck = "";
  const checkValues = [];
  if (data.customerId !== undefined) {
    newCustomerCheck = "AND EXISTS (SELECT 1 FROM customers nc WHERE nc.id = ? AND nc.user_id = ?)";
    checkValues.push(data.customerId, userId);
  }

  const [result] = await getPool().execute(
    `UPDATE products p
     JOIN customers c ON c.id = p.customer_id
     SET ${assignments.join(", ")}
     WHERE p.id = ? AND c.user_id = ? ${newCustomerCheck}`,
    [...values, id, userId, ...checkValues]
  );
  return result.affectedRows > 0;
}

async function deleteProduct(userId, id) {
  const [result] = await getPool().execute(
    `DELETE p FROM products p
     JOIN customers c ON c.id = p.customer_id
     WHERE p.id = ? AND c.user_id = ?`,
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listProducts,
  searchProducts,
  getProductById,
  findProductsByName,
  createProduct,
  updateProduct,
  deleteProduct,
};
