const express = require("express");

const router = express.Router();

const {
  createCustomer,
  getCustomers,
  getAllCustomers,
  getDashboardStats,
  deleteCustomer,
  updateCustomer,
} = require(
  "../controllers/customerController"
);

router.post("/", createCustomer);

router.get("/", getCustomers);

router.get(
  "/allCustomers",
  getAllCustomers
);

router.get(
  "/dashboard-stats",
  getDashboardStats
);
router.put(
  "/:id",
  updateCustomer
);

router.delete("/:id", deleteCustomer);
router.put("/:id",updateCustomer);
module.exports = router;