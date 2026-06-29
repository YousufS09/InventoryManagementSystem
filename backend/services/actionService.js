const { getPool } = require("../db");

/*
|--------------------------------------------------------------------------
| CUSTOMER ACTIONS
|--------------------------------------------------------------------------
*/

async function createCustomer(data) {
  const pool = getPool();

  const {
    customerName,
    dob,
    email,
    phone,
    location,
  } = data;

  const [result] =
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

  return {
    success: true,
    customerId: result.insertId,
  };
}

async function updateCustomer(
  customerId,
  data
) {
  const pool = getPool();

  const fieldMapping = {
    customerName:
      "customer_name",

    dob: "dob",

    email: "email",

    phone: "phone",

    location: "location",
  };

  const updates = [];
  const values = [];

  for (const key in data) {
    if (
      fieldMapping[key]
    ) {
      updates.push(
        `${fieldMapping[key]} = ?`
      );

      values.push(
        data[key]
      );
    }
  }

  if (
    updates.length === 0
  ) {
    throw new Error(
      "No valid fields provided for update."
    );
  }

  values.push(
    customerId
  );

  const query = `
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  await pool.execute(
    query,
    values
  );

  return {
    success: true,
  };
}
async function deleteCustomer(
  customerId
) {
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

  const [customers] =
    await pool.execute(`
      SELECT *
      FROM customers
      ORDER BY id DESC
    `);

  return customers;
}

async function findCustomerByName(
  customerName
) {
  const pool = getPool();

  const [customers] =
    await pool.execute(
      `
      SELECT *
      FROM customers
      WHERE customer_name = ?
      `,
      [customerName]
    );

  return customers[0];
}

async function getLatestCustomer() {
  const pool = getPool();

  const [customers] =
    await pool.execute(`
      SELECT *
      FROM customers
      ORDER BY id DESC
      LIMIT 1
    `);

  return customers[0];
}

async function getCustomerCount() {
  const pool = getPool();

  const [[result]] =
    await pool.execute(`
      SELECT COUNT(*) AS totalCustomers
      FROM customers
    `);

  return result.totalCustomers;
}

async function createProduct(data) {
  const pool = getPool();

  const {
    productName,
    productPrice,
    productQuantity,
    customerId,
  } = data;

  const [result] =
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

  return {
    success: true,
    productId: result.insertId,
  };
}

async function updateProduct(
  productId,
  data
) {
  const pool = getPool();

  const fieldMapping = {
    productName:
      "product_name",

    productPrice:
      "product_price",

    productQuantity:
      "product_quantity",

    customerId:
      "customer_id",
  };

  const updates = [];
  const values = [];

  for (const key in data) {
    if (
      fieldMapping[key]
    ) {
      updates.push(
        `${fieldMapping[key]} = ?`
      );

      values.push(
        data[key]
      );
    }
  }

  if (
    updates.length === 0
  ) {
    throw new Error(
      "No valid fields provided for update."
    );
  }

  values.push(
    productId
  );

  const query = `
    UPDATE products
    SET ${updates.join(", ")}
    WHERE id = ?
  `;

  await pool.execute(
    query,
    values
  );

  return {
    success: true,
  };
}

async function deleteProduct(
  productId
) {
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

  return products;
}

async function findProductByName(
  productName
) {
  const pool = getPool();

  const [products] =
    await pool.execute(
      `
      SELECT *
      FROM products
      WHERE product_name = ?
      `,
      [productName]
    );

  return products[0];
}

async function getProductCount() {
  const pool = getPool();

  const [[result]] =
    await pool.execute(`
      SELECT COUNT(*) AS totalProducts
      FROM products
    `);

  return result.totalProducts;
}

/*
|--------------------------------------------------------------------------
| DASHBOARD ACTIONS
|--------------------------------------------------------------------------
*/

async function getDashboardStats() {
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

  return {
    totalCustomers:
      customerCount.totalCustomers,

    totalProducts:
      productCount.totalProducts,

    totalQuantity:
      quantityCount.totalQuantity,

    totalValue:
      inventoryValue.totalValue,
  };
}

async function getInventoryValue() {
  const pool = getPool();

  const [[result]] =
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