const { getPool } = require("../db");

// Totals for the signed-in user's own customers and products only.
async function getDashboardStats(userId) {
  const [[row]] = await getPool().execute(
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

  // SUM() over DECIMAL/INT comes back as a string; convert everything to numbers.
  return {
    totalCustomers: Number(row.totalCustomers),
    totalProducts: Number(row.totalProducts),
    totalQuantity: Number(row.totalQuantity),
    totalValue: Number(row.totalValue),
  };
}

module.exports = { getDashboardStats };
