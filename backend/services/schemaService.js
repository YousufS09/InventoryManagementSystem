const tableCache = new Map();
const columnCache = new Map();

function quoteIdentifier(identifier) {
  return `\`${identifier.replace(/`/g, "``")}\``;
}

function getColumnExpression(columnName, tableAlias = "") {
  if (!columnName) {
    return "NULL";
  }

  const prefix = tableAlias ? `${tableAlias}.` : "";
  return `${prefix}${quoteIdentifier(columnName)}`;
}

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
  const cacheKey = tableName;
  if (columnCache.has(cacheKey)) {
    return columnCache.get(cacheKey);
  }

  const [rows] = await pool.execute(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    ORDER BY ORDINAL_POSITION
    `,
    [tableName]
  );

  const columns = rows.map((row) => row.COLUMN_NAME);
  columnCache.set(cacheKey, columns);
  return columns;
}

function pickColumn(columns, candidates) {
  return candidates.find((candidate) => columns.includes(candidate)) || null;
}

async function buildCustomerSchema(pool) {
  const tableName = await getExistingTableName(pool, ["customers", "customer"]);
  if (!tableName) {
    return { tableName: null, columns: new Map() };
  }

  const columns = await getTableColumns(pool, tableName);
  const schema = new Map();

  schema.set("tableName", tableName);
  schema.set(
    "customerName",
    pickColumn(columns, [
      "customer_name",
      "customerName",
      "full_name",
      "fullName",
      "name",
      "customer",
    ])
  );
  schema.set(
    "dob",
    pickColumn(columns, [
      "dob",
      "date_of_birth",
      "birth_date",
      "birthday",
    ])
  );
  schema.set(
    "email",
    pickColumn(columns, ["email", "email_address"])
  );
  schema.set(
    "phone",
    pickColumn(columns, [
      "phone",
      "phone_number",
      "mobile",
      "mobile_number",
    ])
  );
  schema.set(
    "location",
    pickColumn(columns, [
      "location",
      "address",
      "city",
      "place",
    ])
  );

  return { tableName, columns: schema };
}

async function buildProductSchema(pool) {
  const tableName = await getExistingTableName(pool, ["products", "product"]);
  if (!tableName) {
    return { tableName: null, columns: new Map() };
  }

  const columns = await getTableColumns(pool, tableName);
  const schema = new Map();

  schema.set("tableName", tableName);
  schema.set(
    "productName",
    pickColumn(columns, ["product_name", "productName", "name"])
  );
  schema.set(
    "productPrice",
    pickColumn(columns, ["product_price", "productPrice", "price", "unit_price"])
  );
  schema.set(
    "productQuantity",
    pickColumn(columns, [
      "product_quantity",
      "productQuantity",
      "quantity",
      "stock",
      "stock_quantity",
      "inventory_quantity",
    ])
  );
  schema.set(
    "customerId",
    pickColumn(columns, [
      "customer_id",
      "customerId",
      "customerid",
      "customer",
      "user_id",
    ])
  );
  schema.set(
    "customerName",
    pickColumn(columns, [
      "customer_name",
      "customerName",
      "name",
      "customer",
    ])
  );

  return { tableName, columns: schema };
}

module.exports = {
  buildCustomerSchema,
  buildProductSchema,
  getExistingTableName,
  getTableColumns,
  getColumnExpression,
  pickColumn,
  quoteIdentifier,
};
