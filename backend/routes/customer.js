const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getCustomers,
  getCustomerNames,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getCustomers);
router.get("/allCustomers", getCustomerNames);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;
