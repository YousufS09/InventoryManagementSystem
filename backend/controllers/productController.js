const { getPool } = require("../db");
const { buildProductSchema, buildCustomerSchema } = require("../services/schemaService");

async function createProduct(req, res) {
  try {
    const { productName, productPrice, productQuantity, customerId } = req.body;
    const pool = getPool();
    const { tableName, columns } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");

    if (!nameColumn || !priceColumn || !quantityColumn || !customerIdColumn) {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    await pool.execute(
      `
      INSERT INTO ${tableName}
      (
        ${nameColumn},
        ${priceColumn},
        ${quantityColumn},
        ${customerIdColumn}
      )
      VALUES (?, ?, ?, ?)
      `,
      [productName, productPrice, productQuantity, customerId]
    );

    return res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

async function getProducts(req, res) {
  try {
    const pool = getPool();
    const { tableName: productTable, columns: productColumns } = await buildProductSchema(pool);
    const { tableName: customerTable, columns: customerColumns } = await buildCustomerSchema(pool);

    if (!productTable || !customerTable) {
      return res.status(200).json([]);
    }

    const nameColumn = productColumns.get("productName");
    const priceColumn = productColumns.get("productPrice");
    const quantityColumn = productColumns.get("productQuantity");
    const customerIdColumn = productColumns.get("customerId");
    const customerNameColumn = customerColumns.get("customerName");

    const [products] = await pool.execute(
      `
      SELECT
        p.id,
        p.${nameColumn} AS product_name,
        p.${priceColumn} AS product_price,
        p.${quantityColumn} AS product_quantity,
        p.${customerIdColumn} AS customer_id,
        c.${customerNameColumn} AS customer_name
      FROM ${productTable} p
      JOIN ${customerTable} c
        ON p.${customerIdColumn} = c.id
      ORDER BY p.id DESC
      `
    );

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { tableName } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { productName, productPrice, productQuantity, customerId } = req.body;

    const pool = getPool();
    const { tableName, columns } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");

    await pool.execute(
      `
      UPDATE ${tableName}
      SET
        ${nameColumn} = ?,
        ${priceColumn} = ?,
        ${quantityColumn} = ?,
        ${customerIdColumn} = ?
      WHERE id = ?
      `,
      [productName, productPrice, productQuantity, customerId, id]
    );

    return res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
