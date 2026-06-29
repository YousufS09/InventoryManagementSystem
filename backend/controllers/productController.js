const { getPool } = require("../db");

async function createProduct(req, res) {
  try {
    const {
      productName,
      productPrice,
      productQuantity,
      customerId,
    } = req.body;

    const pool = getPool();

    await pool.execute(
      `
      INSERT INTO products
      (
        product_name,
        product_price,
        product_quantity,
        customer_id
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        productName,
        productPrice,
        productQuantity,
        customerId,
      ]
    );

    return res.status(201).json({
      message:
        "Product created successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to create product",
    });
  }
}

async function getProducts(req, res) {
  try {
    const pool = getPool();

    const [products] =
      await pool.execute(`
        SELECT
          p.id,
          p.product_name,
          p.product_price,
          p.product_quantity,
          p.customer_id,
          c.customer_name
        FROM products p
        JOIN customers c
          ON p.customer_id = c.id
        ORDER BY p.id DESC
      `);

    return res.status(200).json(
      products
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to fetch products",
    });
  }
}

async function deleteProduct(
  req,
  res
) {
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

    return res.status(200).json({
      message:
        "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to delete product",
    });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const {
      productName,
      productPrice,
      productQuantity,
      customerId,
    } = req.body;

    const pool = getPool();

    await pool.execute(
      `
      UPDATE products
      SET
        product_name = ?,
        product_price = ?,
        product_quantity = ?,
        customer_id = ?
      WHERE id = ?
      `,
      [
        productName,
        productPrice,
        productQuantity,
        customerId,
        id,
      ]
    );

    return res.status(200).json({
      message:
        "Product updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to update product",
    });
  }
}

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};