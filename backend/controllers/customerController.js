const { getPool } = require("../db");
const {
  buildCustomerSchema,
  buildProductSchema,
  getColumnExpression,
  quoteIdentifier,
} = require("../services/schemaService");

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
      INSERT INTO ${quoteIdentifier(tableName)}
      (
        ${quoteIdentifier(nameColumn)},
        ${quoteIdentifier(dobColumn)},
        ${quoteIdentifier(emailColumn)},
        ${quoteIdentifier(phoneColumn)},
        ${quoteIdentifier(locationColumn)}
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
        ${getColumnExpression(nameColumn)} AS customer_name,
        ${getColumnExpression(dobColumn)} AS dob,
        ${getColumnExpression(emailColumn)} AS email,
        ${getColumnExpression(phoneColumn)} AS phone,
        ${getColumnExpression(locationColumn)} AS location
      FROM ${quoteIdentifier(tableName)}
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
        ${getColumnExpression(nameColumn)} AS customer_name
      FROM ${quoteIdentifier(tableName)}
      ORDER BY ${getColumnExpression(nameColumn)}
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
    const { tableName: productTable, columns: productColumns } = await buildProductSchema(pool);

    const quantityColumn = productColumns.get("productQuantity");
    const priceColumn = productColumns.get("productPrice");

    let customerCount = { totalCustomers: 0 };
    let productCount = { totalProducts: 0 };
    let quantityCount = { totalQuantity: 0 };
    let inventoryValue = { totalValue: 0 };

    if (customerTable) {
      [customerCount] = await pool.execute(`SELECT COUNT(*) AS totalCustomers FROM ${quoteIdentifier(customerTable)}`).then(([rows]) => rows);
    }

    if (productTable) {
      [productCount] = await pool.execute(`SELECT COUNT(*) AS totalProducts FROM ${quoteIdentifier(productTable)}`).then(([rows]) => rows);
    }

    if (productTable && quantityColumn) {
      [quantityCount] = await pool.execute(`SELECT IFNULL(SUM(${quoteIdentifier(quantityColumn)}), 0) AS totalQuantity FROM ${quoteIdentifier(productTable)}`).then(([rows]) => rows);
    }

    if (productTable && quantityColumn && priceColumn) {
      [inventoryValue] = await pool.execute(`SELECT IFNULL(SUM(${quoteIdentifier(priceColumn)} * ${quoteIdentifier(quantityColumn)}), 0) AS totalValue FROM ${quoteIdentifier(productTable)}`).then(([rows]) => rows);
    }

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

    await pool.execute(`DELETE FROM ${quoteIdentifier(tableName)} WHERE id = ?`, [id]);
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

    if (!nameColumn || !dobColumn || !emailColumn || !phoneColumn || !locationColumn) {
      return res.status(500).json({ error: "Customers table schema is not compatible with the backend." });
    }

    await pool.execute(
      `
      UPDATE ${quoteIdentifier(tableName)}
      SET
        ${quoteIdentifier(nameColumn)} = ?,
        ${quoteIdentifier(dobColumn)} = ?,
        ${quoteIdentifier(emailColumn)} = ?,
        ${quoteIdentifier(phoneColumn)} = ?,
        ${quoteIdentifier(locationColumn)} = ?
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
