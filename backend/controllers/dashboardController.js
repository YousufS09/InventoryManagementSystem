const { getDashboardStats } = require("../services/dashboardService");

async function getStats(req, res) {
  try {
    res.status(200).json(await getDashboardStats());
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}

module.exports = { getStats };
