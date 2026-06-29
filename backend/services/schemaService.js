const tableCache = new Map();

async function getExistingTableName(pool, candidates) {
  const cacheKey = candidates.join("|");
  if (tableCache.has(cacheKey)) {
    return tableCache.get(cacheKey);
  }

  const [rows] = await pool.execute(
    `
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (${candidates.map(() => "?").join(", ")})
    `,
    candidates
  );

  const existingTable = rows[0]?.TABLE_NAME || null;
  tableCache.set(cacheKey, existingTable);
  return existingTable;
}

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

async function buildCustomerSchema(pool) {
  const tableName = await getExistingTableName(pool, ["customers", "customer"]);
  if (!tableName) {
    return { tableName: null, columns: new Map() };
  }

  const columns = await getTableColumns(pool, tableName);
  const schema = new Map();

  const nameColumn = columns.includes("customer_name")
    ? "customer_name"
    : columns.includes("customerName")
      ? "customerName"
      : null;

  schema.set("tableName", tableName);
  schema.set("customerName", nameColumn);
  schema.set("dob", columns.includes("dob") ? "dob" : null);
  schema.set("email", columns.includes("email") ? "email" : null);
  schema.set("phone", columns.includes("phone") ? "phone" : null);
  schema.set("location", columns.includes("location") ? "location" : null);

  return { tableName, columns: schema };
}

async function buildProductSchema(pool) {
  const tableName = await getExistingTableName(pool, ["products", "product"]);
  if (!tableName) {
    return { tableName: null, columns: new Map() };
  }

  const columns = await getTableColumns(pool, tableName);
  const schema = new Map();

  schema.set(
    "tableName",
    tableName
  );
  schema.set(
    "productName",
    columns.includes("product_name")
      ? "product_name"
      : columns.includes("productName")
        ? "productName"
        : null
  );
  schema.set(
    "productPrice",
    columns.includes("product_price")
      ? "product_price"
      : columns.includes("productPrice")
        ? "productPrice"
        : null
  );
  schema.set(
    "productQuantity",
    columns.includes("product_quantity")
      ? "product_quantity"
      : columns.includes("productQuantity")
        ? "productQuantity"
        : null
  );
  schema.set(
    "customerId",
    columns.includes("customer_id")
      ? "customer_id"
      : columns.includes("customerId")
        ? "customerId"
        : null
  );
  schema.set(
    "customerName",
    columns.includes("customer_name")
      ? "customer_name"
      : columns.includes("customerName")
        ? "customerName"
        : null
  );

  return { tableName, columns: schema };
}

module.exports = {
  buildCustomerSchema,
  buildProductSchema,
  getExistingTableName,
};
