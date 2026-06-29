const { getPool } = require("../db");
const { buildCustomerSchema, buildProductSchema } = require("../services/schemaService");

async function createCustomer(data) {
  const pool = getPool();
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    throw new Error("Customers table was not found.");
  }

  const nameColumn = columns.get("customerName");
  const dobColumn = columns.get("dob");
  const emailColumn = columns.get("email");
  const phoneColumn = columns.get("phone");
  const locationColumn = columns.get("location");

  const { customerName, dob, email, phone, location } = data;

  const [result] = await pool.execute(
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
    [customerName, dob, email, phone, location]
  );

  return {
    success: true,
    customerId: result.insertId,
  };
}

async function updateCustomer(customerId, data) {
  const pool = getPool();
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    throw new Error("Customers table was not found.");
  }

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
    UPDATE ${tableName}
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
  const { tableName } = await buildCustomerSchema(pool);

  if (!tableName) {
    throw new Error("Customers table was not found.");
  }

  await pool.execute(
    `
    DELETE FROM ${tableName}
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
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    return [];
  }

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
    FROM ${tableName}
    ORDER BY id DESC
  `);

  return customers;
}

async function findCustomerByName(customerName) {
  const pool = getPool();
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    return undefined;
  }

  const nameColumn = columns.get("customerName");

  const [customers] = await pool.execute(
    `
    SELECT *
    FROM ${tableName}
    WHERE ${nameColumn} = ?
    `,
    [customerName]
  );

  return customers[0];
}

async function getLatestCustomer() {
  const pool = getPool();
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    return undefined;
  }

  const nameColumn = columns.get("customerName");

  const [customers] = await pool.execute(`
    SELECT
      id,
      ${nameColumn} AS customer_name
    FROM ${tableName}
    ORDER BY id DESC
    LIMIT 1
  `);

  return customers[0];
}

async function getCustomerCount() {
  const pool = getPool();
  const { tableName } = await buildCustomerSchema(pool);

  if (!tableName) {
    return 0;
  }

  const [[result]] = await pool.execute(`
    SELECT COUNT(*) AS totalCustomers
    FROM ${tableName}
  `);

  return result.totalCustomers;
}

async function createProduct(data) {
  const pool = getPool();
  const { tableName, columns } = await buildProductSchema(pool);

  if (!tableName) {
    throw new Error("Products table was not found.");
  }

  const nameColumn = columns.get("productName");
  const priceColumn = columns.get("productPrice");
  const quantityColumn = columns.get("productQuantity");
  const customerIdColumn = columns.get("customerId");

  const { productName, productPrice, productQuantity, customerId } = data;

  const [result] = await pool.execute(
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

  return {
    success: true,
    productId: result.insertId,
  };
}

async function updateProduct(productId, data) {
  const pool = getPool();
  const { tableName, columns } = await buildProductSchema(pool);

  if (!tableName) {
    throw new Error("Products table was not found.");
  }

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
    UPDATE ${tableName}
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
  const { tableName } = await buildProductSchema(pool);

  if (!tableName) {
    throw new Error("Products table was not found.");
  }

  await pool.execute(
    `
    DELETE FROM ${tableName}
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
  const { tableName: productTable, columns: productColumns } = await buildProductSchema(pool);
  const { tableName: customerTable, columns: customerColumns } = await buildCustomerSchema(pool);

  if (!productTable || !customerTable) {
    return [];
  }

  const nameColumn = productColumns.get("productName");
  const priceColumn = productColumns.get("productPrice");
  const quantityColumn = productColumns.get("productQuantity");
  const customerIdColumn = productColumns.get("customerId");
  const customerNameColumn = customerColumns.get("customerName");
  const productCustomerNameColumn = productColumns.get("customerName");

  let query;

  if (customerIdColumn && customerTable && customerNameColumn) {
    query = `
      SELECT
        p.id,
        p.${nameColumn} AS product_name,
        p.${priceColumn} AS product_price,
        p.${quantityColumn} AS product_quantity,
        p.${customerIdColumn} AS customer_id,
        c.${customerNameColumn} AS customer_name
      FROM ${productTable} p
      LEFT JOIN ${customerTable} c
        ON p.${customerIdColumn} = c.id
      ORDER BY p.id DESC
    `;
  } else if (productCustomerNameColumn && customerTable && customerNameColumn) {
    query = `
      SELECT
        p.id,
        p.${nameColumn} AS product_name,
        p.${priceColumn} AS product_price,
        p.${quantityColumn} AS product_quantity,
        c.id AS customer_id,
        p.${productCustomerNameColumn} AS customer_name
      FROM ${productTable} p
      LEFT JOIN ${customerTable} c
        ON p.${productCustomerNameColumn} = c.${customerNameColumn}
      ORDER BY p.id DESC
    `;
  } else {
    query = `
      SELECT
        p.id,
        p.${nameColumn} AS product_name,
        p.${priceColumn} AS product_price,
        p.${quantityColumn} AS product_quantity,
        NULL AS customer_id,
        NULL AS customer_name
      FROM ${productTable} p
      ORDER BY p.id DESC
    `;
  }

  const [products] = await pool.execute(query);

  return products;
}

async function findProductByName(productName) {
  const pool = getPool();
  const { tableName, columns } = await buildProductSchema(pool);

  if (!tableName) {
    return undefined;
  }

  const nameColumn = columns.get("productName");

  const [products] = await pool.execute(
    `
    SELECT *
    FROM ${tableName}
    WHERE ${nameColumn} = ?
    `,
    [productName]
  );

  return products[0];
}

async function getProductCount() {
  const pool = getPool();
  const { tableName } = await buildProductSchema(pool);

  if (!tableName) {
    return 0;
  }

  const [[result]] = await pool.execute(`
    SELECT COUNT(*) AS totalProducts
    FROM ${tableName}
  `);

  return result.totalProducts;
}

async function getDashboardStats() {
  const pool = getPool();
  const { tableName: customerTable } = await buildCustomerSchema(pool);
  const { tableName: productTable, columns: productColumns } = await buildProductSchema(pool);
  const priceColumn = productColumns.get("productPrice");
  const quantityColumn = productColumns.get("productQuantity");

  let customerCount = { totalCustomers: 0 };
  let productCount = { totalProducts: 0 };
  let quantityCount = { totalQuantity: 0 };
  let inventoryValue = { totalValue: 0 };

  if (customerTable) {
    [customerCount] = await pool.execute(`SELECT COUNT(*) AS totalCustomers FROM ${customerTable}`).then(([rows]) => rows);
  }

  if (productTable) {
    [productCount] = await pool.execute(`SELECT COUNT(*) AS totalProducts FROM ${productTable}`).then(([rows]) => rows);
  }

  if (productTable && quantityColumn) {
    [quantityCount] = await pool.execute(`SELECT IFNULL(SUM(${quantityColumn}), 0) AS totalQuantity FROM ${productTable}`).then(([rows]) => rows);
  }

  if (productTable && priceColumn && quantityColumn) {
    [inventoryValue] = await pool.execute(`SELECT IFNULL(SUM(${priceColumn} * ${quantityColumn}), 0) AS totalValue FROM ${productTable}`).then(([rows]) => rows);
  }

  return {
    totalCustomers: customerCount.totalCustomers || 0,
    totalProducts: productCount.totalProducts || 0,
    totalQuantity: quantityCount.totalQuantity || 0,
    totalValue: inventoryValue.totalValue || 0,
  };
}

async function getInventoryValue() {
  const pool = getPool();
  const { tableName, columns } = await buildProductSchema(pool);
  const priceColumn = columns.get("productPrice");
  const quantityColumn = columns.get("productQuantity");

  if (!tableName || !priceColumn || !quantityColumn) {
    return 0;
  }

  const [[result]] = await pool.execute(`
    SELECT IFNULL(SUM(${priceColumn} * ${quantityColumn}), 0) AS totalValue
    FROM ${tableName}
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
