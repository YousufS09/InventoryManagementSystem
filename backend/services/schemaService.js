const customerColumnCache = new Map();
const productColumnCache = new Map();

async function getTableColumns(pool, tableName) {
  const [rows] = await pool.execute(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `,
    [tableName]
  );

  return rows.map((row) => row.COLUMN_NAME);
}

async function getCustomerColumns(pool) {
  if (customerColumnCache.size) {
    return customerColumnCache;
  }

  const columns = await getTableColumns(pool, "customers");
  const hasSnake = columns.includes("customer_name");
  const hasCamel = columns.includes("customerName");

  customerColumnCache.set(
    "customerName",
    hasSnake ? "customer_name" : hasCamel ? "customerName" : null
  );
  customerColumnCache.set("dob", columns.includes("dob") ? "dob" : null);
  customerColumnCache.set("email", columns.includes("email") ? "email" : null);
  customerColumnCache.set("phone", columns.includes("phone") ? "phone" : null);
  customerColumnCache.set("location", columns.includes("location") ? "location" : null);

  return customerColumnCache;
}

async function getProductColumns(pool) {
  if (productColumnCache.size) {
    return productColumnCache;
  }

  const columns = await getTableColumns(pool, "products");
  const hasSnakeName = columns.includes("product_name");
  const hasCamelName = columns.includes("productName");
  const hasSnakePrice = columns.includes("product_price");
  const hasCamelPrice = columns.includes("productPrice");
  const hasSnakeQty = columns.includes("product_quantity");
  const hasCamelQty = columns.includes("productQuantity");
  const hasSnakeCustomerId = columns.includes("customer_id");
  const hasCamelCustomerId = columns.includes("customerId");
  const hasSnakeCustomerName = columns.includes("customer_name");
  const hasCamelCustomerName = columns.includes("customerName");

  productColumnCache.set(
    "productName",
    hasSnakeName ? "product_name" : hasCamelName ? "productName" : null
  );
  productColumnCache.set(
    "productPrice",
    hasSnakePrice ? "product_price" : hasCamelPrice ? "productPrice" : null
  );
  productColumnCache.set(
    "productQuantity",
    hasSnakeQty ? "product_quantity" : hasCamelQty ? "productQuantity" : null
  );
  productColumnCache.set(
    "customerId",
    hasSnakeCustomerId ? "customer_id" : hasCamelCustomerId ? "customerId" : null
  );
  productColumnCache.set(
    "customerName",
    hasSnakeCustomerName ? "customer_name" : hasCamelCustomerName ? "customerName" : null
  );

  return productColumnCache;
}

module.exports = {
  getCustomerColumns,
  getProductColumns,
};
