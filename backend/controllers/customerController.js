const { getPool } = require("../db");

async function createCustomer(req, res) {
  try {
    const {
      customerName,
      dob,
      email,
      phone,
      location,
    } = req.body;

    const pool = getPool();

    await pool.execute(
      `
      INSERT INTO customers
      (
        customer_name,
        dob,
        email,
        phone,
        location
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        customerName,
        dob,
        email,
        phone,
        location,
      ]
    );

    return res.status(201).json({
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create customer",
    });
  }
}

async function getCustomers(req, res) {
  try {
    const pool = getPool();

    const [customers] = await pool.execute(
      `
      SELECT *
      FROM customers
      ORDER BY id DESC
      `
    );

    return res.status(200).json(customers);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
}

async function getAllCustomers(
  req,
  res
) {
  try {
    const pool = getPool();

    const [customers] =
      await pool.execute(
        `
        SELECT
          id,
          customer_name
        FROM customers
        ORDER BY customer_name
        `
      );

    return res.status(200).json(
      customers
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to fetch customers",
    });
  }
}

async function getDashboardStats(req, res) {
  try {
    const pool = getPool();

    const [[customerCount]] =
      await pool.execute(`
        SELECT COUNT(*) AS totalCustomers
        FROM customers
      `);

    const [[productCount]] =
      await pool.execute(`
        SELECT COUNT(*) AS totalProducts
        FROM products
      `);

    const [[quantityCount]] =
      await pool.execute(`
        SELECT
          IFNULL(
            SUM(product_quantity),
            0
          ) AS totalQuantity
        FROM products
      `);

    const [[inventoryValue]] =
      await pool.execute(`
        SELECT
          IFNULL(
            SUM(
              product_price *
              product_quantity
            ),
            0
          ) AS totalValue
        FROM products
      `);

    res.json({
      totalCustomers:
        customerCount.totalCustomers,

      totalProducts:
        productCount.totalProducts,

      totalQuantity:
        quantityCount.totalQuantity,

      totalValue:
        inventoryValue.totalValue,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Failed to fetch dashboard stats",
    });
  }
}

async function deleteCustomer(
  req,
  res
) {
  try {
    const { id } = req.params;

    const pool = getPool();

    await pool.execute(
      `
      DELETE FROM customers
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message:
        "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to delete customer",
    });
  }
}

async function updateCustomer(
  req,
  res
) {
  try {
    const { id } = req.params;

    const {
      customerName,
      dob,
      email,
      phone,
      location,
    } = req.body;

    const pool = getPool();

    await pool.execute(
      `
      UPDATE customers
      SET
        customer_name = ?,
        dob = ?,
        email = ?,
        phone = ?,
        location = ?
      WHERE id = ?
      `,
      [
        customerName,
        dob,
        email,
        phone,
        location,
        id,
      ]
    );

    return res.status(200).json({
      message:
        "Customer updated successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Failed to update customer",
    });
  }
}

module.exports = {
  createCustomer,
  getCustomers,
  getAllCustomers,
  getDashboardStats,
  deleteCustomer,
  updateCustomer,
};