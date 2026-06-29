const { getPool } = require("../db");
const { getCustomerColumns, getProductColumns } = require("../services/schemaService");

async function createCustomer(data) {
  const pool = getPool();
  const columns = await getCustomerColumns(pool);

  const nameColumn = columns.get("customerName");
  const dobColumn = columns.get("dob");
  const emailColumn = columns.get("email");
  const phoneColumn = columns.get("phone");
  const locationColumn = columns.get("location");

  const {
    customerName,
    dob,
    email,
    phone,
    location,
  } = data;

  const [result] = await pool.execute(
    `
    INSERT INTO customers
    (
      ${nameColumn},
      ${dobColumn},
      ${emailColumn},
      ${phoneColumn},
      ${locationColumn}
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [customerName, dob, email, phone, location]
  );

  return {
    success: true,
    customerId: result.insertId,
  };
}

async function updateCustomer(customerId, data) {
  const pool = getPool();
  const columns = await getCustomerColumns(pool);

  const fieldMapping = {
    customerName: columns.get("customerName"),
    dob: columns.get("dob"),
    email: columns.get("email"),
    phone: columns.get("phone"),
    location: columns.get("location"),
  };

  const updates = [];
  const values = [];

  for (const key in data) {
    if (fieldMapping[key]) {
      updates.push(`${fieldMapping[key]} = ?`);
      values.push(data[key]);
    }
  }

  if (updates.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  values.push(customerId);

  const query = `
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  await pool.execute(query, values);

  return {
    success: true,
  };
}

async function deleteCustomer(customerId) {
  const pool = getPool();

  await pool.execute(
    `
    DELETE FROM customers
    WHERE id = ?
    `,
    [customerId]
  );

  return {
    success: true,
  };
}

async function getCustomers() {
  const pool = getPool();
  const columns = await getCustomerColumns(pool);
  const nameColumn = columns.get("customerName");
  const dobColumn = columns.get("dob");
  const emailColumn = columns.get("email");
  const phoneColumn = columns.get("phone");
  const locationColumn = columns.get("location");

  const [customers] = await pool.execute(`
    SELECT
      id,
      ${nameColumn} AS customer_name,
      ${dobColumn} AS dob,
      ${emailColumn} AS email,
      ${phoneColumn} AS phone,
      ${locationColumn} AS location
    FROM customers
    ORDER BY id DESC
  `);

  return customers;
}

async function findCustomerByName(customerName) {
  const pool = getPool();
  const columns = await getCustomerColumns(pool);
  const nameColumn = columns.get("customerName");

  const [customers] = await pool.execute(
    `
    SELECT *
    FROM customers
    WHERE ${nameColumn} = ?
    `,
    [customerName]
  );

  return customers[0];
}

async function getLatestCustomer() {
  const pool = getPool();
  const columns = await getCustomerColumns(pool);
  const nameColumn = columns.get("customerName");

  const [customers] = await pool.execute(`
    SELECT
      id,
      ${nameColumn} AS customer_name
    FROM customers
    ORDER BY id DESC
    LIMIT 1
  `);

  return customers[0];
}

async function getCustomerCount() {
  const pool = getPool();

  const [[result]] = await pool.execute(`
    SELECT COUNT(*) AS totalCustomers
    FROM customers
  `);

  return result.totalCustomers;
}

async function createProduct(data) {
  const pool = getPool();
  const columns = await getProductColumns(pool);

  const nameColumn = columns.get("productName");
  const priceColumn = columns.get("productPrice");
  const quantityColumn = columns.get("productQuantity");
  const customerIdColumn = columns.get("customerId");

  const {
    productName,
    productPrice,
    productQuantity,
    customerId,
  } = data;

  const [result] = await pool.execute(
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

  return {
    success: true,
    productId: result.insertId,
  };
}

async function updateProduct(productId, data) {
  const pool = getPool();
  const columns = await getProductColumns(pool);

  const fieldMapping = {
    productName: columns.get("productName"),
    productPrice: columns.get("productPrice"),
    productQuantity: columns.get("productQuantity"),
    customerId: columns.get("customerId"),
  };

  const updates = [];
  const values = [];

  for (const key in data) {
    if (fieldMapping[key]) {
      updates.push(`${fieldMapping[key]} = ?`);
      values.push(data[key]);
    }
  }

  if (updates.length === 0) {
    throw new Error("No valid fields provided for update.");
  }

  values.push(productId);

  const query = `
    UPDATE products
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  await pool.execute(query, values);

  return {
    success: true,
  };
}

async function deleteProduct(productId) {
  const pool = getPool();

  await pool.execute(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [productId]
  );

  return {
    success: true,
  };
}

async function getProducts() {
  const pool = getPool();
  const productColumns = await getProductColumns(pool);
  const customerColumns = await getCustomerColumns(pool);

  const nameColumn = productColumns.get("productName");
  const priceColumn = productColumns.get("productPrice");
  const quantityColumn = productColumns.get("productQuantity");
  const customerIdColumn = productColumns.get("customerId");
  const customerNameColumn = customerColumns.get("customerName");

  const [products] = await pool.execute(`
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
  `);

  return products;
}

async function findProductByName(productName) {
  const pool = getPool();
  const columns = await getProductColumns(pool);
  const nameColumn = columns.get("productName");

  const [products] = await pool.execute(
    `
    SELECT *
    FROM products
    WHERE ${nameColumn} = ?
    `,
    [productName]
  );

  return products[0];
}

async function getProductCount() {
  const pool = getPool();

  const [[result]] = await pool.execute(`
    SELECT COUNT(*) AS totalProducts
    FROM products
  `);

  return result.totalProducts;
}

async function getDashboardStats() {
  const pool = getPool();

  const [[customerCount]] = await pool.execute(`
    SELECT COUNT(*) AS totalCustomers
    FROM customers
  `);

  const [[productCount]] = await pool.execute(`
    SELECT COUNT(*) AS totalProducts
    FROM products
  `);

  const [[quantityCount]] = await pool.execute(`
    SELECT IFNULL(SUM(product_quantity), 0) AS totalQuantity
    FROM products
  `);

  const [[inventoryValue]] = await pool.execute(`
    SELECT IFNULL(SUM(product_price * product_quantity), 0) AS totalValue
    FROM products
  `);

  return {
    totalCustomers: customerCount.totalCustomers,
    totalProducts: productCount.totalProducts,
    totalQuantity: quantityCount.totalQuantity,
    totalValue: inventoryValue.totalValue,
  };
}

async function getInventoryValue() {
  const pool = getPool();

  const [[result]] = await pool.execute(`
    SELECT IFNULL(SUM(product_price * product_quantity), 0) AS totalValue
    FROM products
  `);

  return result.totalValue;
}

module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
  findCustomerByName,
  getLatestCustomer,
  getCustomerCount,
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  findProductByName,
  getProductCount,
  getDashboardStats,
  getInventoryValue,
};
