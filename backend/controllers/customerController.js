const customerService = require("../services/customerService");
const {
  validate,
  customerSchema,
  customerUpdateSchema,
  idParamSchema,
  listQuerySchema,
} = require("../utils/validation");

function parseId(req, res) {
  const { data, error } = validate(idParamSchema, req.params.id);
  if (error) {
    res.status(400).json({ error: "Invalid customer id." });
    return null;
  }
  return data;
}

// GET /api/customers?search=&sort=&order=&page=&pageSize=  ->  { items, total, page, pageSize }
async function getCustomers(req, res) {
  const { data: options, error: queryError } = validate(listQuerySchema, req.query);
  if (queryError) {
    return res.status(400).json({ error: queryError });
  }

  try {
    return res.status(200).json(await customerService.searchCustomers(req.user.id, options));
  } catch (error) {
    console.error("List customers error:", error);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
}

async function getCustomerNames(req, res) {
  try {
    res.status(200).json(await customerService.listCustomerNames(req.user.id));
  } catch (error) {
    console.error("List customer names error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}

async function createCustomer(req, res) {
  const { data, error } = validate(customerSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const id = await customerService.createCustomer(req.user.id, data);
    return res.status(201).json({ id, message: "Customer created successfully" });
  } catch (err) {
    console.error("Create customer error:", err);
    return res.status(500).json({ error: "Failed to create customer" });
  }
}

async function updateCustomer(req, res) {
  const id = parseId(req, res);
  if (id === null) return;

  const { data, error } = validate(customerUpdateSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const updated = await customerService.updateCustomer(req.user.id, id, data);
    if (!updated) {
      return res.status(404).json({ error: "Customer not found" });
    }
    return res.status(200).json({ message: "Customer updated successfully" });
  } catch (err) {
    console.error("Update customer error:", err);
    return res.status(500).json({ error: "Failed to update customer" });
  }
}

async function deleteCustomer(req, res) {
  const id = parseId(req, res);
  if (id === null) return;

  try {
    const deleted = await customerService.deleteCustomer(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: "Customer not found" });
    }
    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error("Delete customer error:", err);
    return res.status(500).json({ error: "Failed to delete customer" });
  }
}

module.exports = {
  getCustomers,
  getCustomerNames,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
