const { getPool } = require("../db");
const { buildCustomerSchema } = require("../services/schemaService");

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const match = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!match) {
    return value;
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

async function createCustomer(req, res) {
  try {
    const { customerName, dob, email, phone, location } = req.body;

    if (!customerName) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const pool = getPool();
    const { tableName, columns } = await buildCustomerSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Customers table was not found." });
    }

    const nameColumn = columns.get("customerName");
    const dobColumn = columns.get("dob");
    const emailColumn = columns.get("email");
    const phoneColumn = columns.get("phone");
    const locationColumn = columns.get("location");

    if (!nameColumn || !dobColumn || !emailColumn || !phoneColumn || !locationColumn) {
      return res.status(500).json({ error: "Customers table schema is not compatible with the backend." });
    }

    await pool.execute(
      `
      INSERT INTO ${tableName}
      (
        ${nameColumn},
        ${dobColumn},
        ${emailColumn},
        ${phoneColumn},
        ${locationColumn}
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [customerName, normalizeDate(dob), email, phone, location]
    );

    return res.status(201).json({ message: "Customer created successfully" });
  } catch (error) {
    console.error("Create customer error:", error);
    return res.status(500).json({ error: "Failed to create customer" });
  }
}

async function getCustomers(req, res) {
  try {
    const pool = getPool();
    const { tableName, columns } = await buildCustomerSchema(pool);

    if (!tableName) {
      return res.status(200).json([]);
    }

    const nameColumn = columns.get("customerName");
    const dobColumn = columns.get("dob");
    const emailColumn = columns.get("email");
    const phoneColumn = columns.get("phone");
    const locationColumn = columns.get("location");

    const [customers] = await pool.execute(
      `
      SELECT
        id,
        ${nameColumn} AS customer_name,
        ${dobColumn} AS dob,
        ${emailColumn} AS email,
        ${phoneColumn} AS phone,
        ${locationColumn} AS location
      FROM ${tableName}
      ORDER BY id DESC
      `
    );

    return res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
}

async function getAllCustomers(req, res) {
  try {
    const pool = getPool();
    const { tableName, columns } = await buildCustomerSchema(pool);

    if (!tableName) {
      return res.status(200).json([]);
    }

    const nameColumn = columns.get("customerName");

    const [customers] = await pool.execute(
      `
      SELECT
        id,
        ${nameColumn} AS customer_name
      FROM ${tableName}
      ORDER BY ${nameColumn}
      `
    );

    return res.status(200).json(customers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
}

async function getDashboardStats(req, res) {
  try {
    const pool = getPool();
    const { tableName: customerTable } = await buildCustomerSchema(pool);
    const { tableName: productTable } = await buildProductSchema(pool);

    const [[customerCount]] = customerTable
      ? await pool.execute(`SELECT COUNT(*) AS totalCustomers FROM ${customerTable}`)
      : [{ totalCustomers: 0 }];

    const [[productCount]] = productTable
      ? await pool.execute(`SELECT COUNT(*) AS totalProducts FROM ${productTable}`)
      : [{ totalProducts: 0 }];

    const [[quantityCount]] = productTable
      ? await pool.execute(`SELECT IFNULL(SUM(product_quantity), 0) AS totalQuantity FROM ${productTable}`)
      : [{ totalQuantity: 0 }];

    const [[inventoryValue]] = productTable
      ? await pool.execute(`SELECT IFNULL(SUM(product_price * product_quantity), 0) AS totalValue FROM ${productTable}`)
      : [{ totalValue: 0 }];

    res.json({
      totalCustomers: customerCount.totalCustomers || 0,
      totalProducts: productCount.totalProducts || 0,
      totalQuantity: quantityCount.totalQuantity || 0,
      totalValue: inventoryValue.totalValue || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}

async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { tableName } = await buildCustomerSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Customers table was not found." });
    }

    await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete customer" });
  }
}

async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { customerName, dob, email, phone, location } = req.body;

    const pool = getPool();
    const { tableName, columns } = await buildCustomerSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Customers table was not found." });
    }

    const nameColumn = columns.get("customerName");
    const dobColumn = columns.get("dob");
    const emailColumn = columns.get("email");
    const phoneColumn = columns.get("phone");
    const locationColumn = columns.get("location");

    await pool.execute(
      `
      UPDATE ${tableName}
      SET
        ${nameColumn} = ?,
        ${dobColumn} = ?,
        ${emailColumn} = ?,
        ${phoneColumn} = ?,
        ${locationColumn} = ?
      WHERE id = ?
      `,
      [customerName, normalizeDate(dob), email, phone, location, id]
    );

    return res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update customer" });
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
