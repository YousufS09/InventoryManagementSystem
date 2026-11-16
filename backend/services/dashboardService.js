const { getPool } = require("../db");

async function getDashboardStats() {
  const [[row]] = await getPool().execute(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS totalCustomers,
      (SELECT COUNT(*) FROM products) AS totalProducts,
      (SELECT IFNULL(SUM(product_quantity), 0) FROM products) AS totalQuantity,
      (SELECT IFNULL(SUM(product_price * product_quantity), 0) FROM products) AS totalValue
  `);

  // SUM() over DECIMAL/INT comes back as a string; convert everything to numbers.
  return {
    totalCustomers: Number(row.totalCustomers),
    totalProducts: Number(row.totalProducts),
    totalQuantity: Number(row.totalQuantity),
    totalValue: Number(row.totalValue),
  };
}

module.exports = { getDashboardStats };
