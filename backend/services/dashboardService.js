const { getPool } = require("../db");

// Products at or below this quantity are listed as low stock on the dashboard.
const LOW_STOCK_THRESHOLD = 5;
const LIST_LIMIT = 5;

// Totals and highlights for the signed-in user's own customers and products only.
async function getDashboardStats(userId) {
  const pool = getPool();

  const [[totals]] = await pool.execute(
    `
    SELECT
      (SELECT COUNT(*) FROM customers WHERE user_id = ?) AS totalCustomers,
      COUNT(p.id) AS totalProducts,
      IFNULL(SUM(p.product_quantity), 0) AS totalQuantity,
      IFNULL(SUM(p.product_price * p.product_quantity), 0) AS totalValue
    FROM products p
    JOIN customers c ON c.id = p.customer_id
    WHERE c.user_id = ?
  `,
    [userId, userId]
  );

  const [lowStock] = await pool.execute(
    `
    SELECT p.id, p.product_name, p.product_quantity, c.customer_name
    FROM products p
    JOIN customers c ON c.id = p.customer_id
    WHERE c.user_id = ? AND p.product_quantity <= ${LOW_STOCK_THRESHOLD}
    ORDER BY p.product_quantity ASC, p.product_name ASC
    LIMIT ${LIST_LIMIT}
  `,
    [userId]
  );

  const [topProducts] = await pool.execute(
    `
    SELECT p.id, p.product_name, (p.product_price * p.product_quantity) AS stock_value
    FROM products p
    JOIN customers c ON c.id = p.customer_id
    WHERE c.user_id = ?
    ORDER BY stock_value DESC, p.id DESC
    LIMIT ${LIST_LIMIT}
  `,
    [userId]
  );

  // SUM() and DECIMAL math come back as strings; convert everything to numbers.
  return {
    totalCustomers: Number(totals.totalCustomers),
    totalProducts: Number(totals.totalProducts),
    totalQuantity: Number(totals.totalQuantity),
    totalValue: Number(totals.totalValue),
    lowStockThreshold: LOW_STOCK_THRESHOLD,
    lowStock: lowStock.map((row) => ({ ...row, product_quantity: Number(row.product_quantity) })),
    topProducts: topProducts.map((row) => ({ ...row, stock_value: Number(row.stock_value) })),
  };
}

module.exports = { getDashboardStats };
