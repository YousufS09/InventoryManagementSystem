const { getPool } = require("../db");

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
  LEFT JOIN customers c ON c.id = p.customer_id
`;

// DECIMAL columns come back from mysql2 as strings; return numbers to the client.
function toProduct(row) {
  return { ...row, product_price: Number(row.product_price) };
}

async function listProducts() {
  const [rows] = await getPool().execute(`${SELECT_WITH_CUSTOMER} ORDER BY p.id DESC`);
  return rows.map(toProduct);
}

async function getProductById(id) {
  const [rows] = await getPool().execute(`${SELECT_WITH_CUSTOMER} WHERE p.id = ? LIMIT 1`, [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

// Returns every product with this name (case-insensitive), so callers can detect duplicates.
async function findProductsByName(name) {
  const [rows] = await getPool().execute(
    `${SELECT_WITH_CUSTOMER} WHERE LOWER(p.product_name) = LOWER(?) ORDER BY p.id`,
    [name.trim()]
  );
  return rows.map(toProduct);
}

async function createProduct(data) {
  const [result] = await getPool().execute(
    `INSERT INTO products (product_name, product_price, product_quantity, customer_id)
     VALUES (?, ?, ?, ?)`,
    [data.productName, data.productPrice, data.productQuantity, data.customerId]
  );
  return result.insertId;
}

// Updates only the fields present in `data`. Returns false when the product does not exist.
async function updateProduct(id, data) {
  const assignments = [];
  const values = [];

  for (const [field, column] of Object.entries(PRODUCT_COLUMNS)) {
    if (data[field] !== undefined) {
      assignments.push(`${column} = ?`);
      values.push(data[field]);
    }
  }

  if (assignments.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  const [result] = await getPool().execute(
    `UPDATE products SET ${assignments.join(", ")} WHERE id = ?`,
    [...values, id]
  );
  return result.affectedRows > 0;
}

async function deleteProduct(id) {
  const [result] = await getPool().execute("DELETE FROM products WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listProducts,
  getProductById,
  findProductsByName,
  createProduct,
  updateProduct,
  deleteProduct,
};
