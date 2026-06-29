const { getPool } = require("../db");
const { getProductColumns, getCustomerColumns } = require("../services/schemaService");

async function createProduct(req, res) {
  try {
    const { productName, productPrice, productQuantity, customerId } = req.body;
    const pool = getPool();
    const columns = await getProductColumns(pool);

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");

    if (!nameColumn || !priceColumn || !quantityColumn || !customerIdColumn) {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    await pool.execute(
      `
      INSERT INTO products
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
    const productColumns = await getProductColumns(pool);
    const customerColumns = await getCustomerColumns(pool);

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
      FROM products p
      JOIN customers c
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
    await pool.execute(
      `
      DELETE FROM products
      WHERE id = ?
      `,
      [id]
    );

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
    const columns = await getProductColumns(pool);

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");

    await pool.execute(
      `
      UPDATE products
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
