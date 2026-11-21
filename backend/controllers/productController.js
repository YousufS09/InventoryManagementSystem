const productService = require("../services/productService");
const {
  validate,
  productSchema,
  productUpdateSchema,
  idParamSchema,
} = require("../utils/validation");

function parseId(req, res) {
  const { data, error } = validate(idParamSchema, req.params.id);
  if (error) {
    res.status(400).json({ error: "Invalid product id." });
    return null;
  }
  return data;
}

async function getProducts(req, res) {
  try {
    res.status(200).json(await productService.listProducts(req.user.id));
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
}

async function createProduct(req, res) {
  const { data, error } = validate(productSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    // Returns null when the customer does not exist or belongs to another user.
    const id = await productService.createProduct(req.user.id, data);
    if (id === null) {
      return res.status(400).json({ error: "Selected customer could not be found." });
    }
    return res.status(201).json({ id, message: "Product created successfully" });
  } catch (err) {
    console.error("Create product error:", err);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

async function updateProduct(req, res) {
  const id = parseId(req, res);
  if (id === null) return;

  const { data, error } = validate(productUpdateSchema, req.body);
  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const updated = await productService.updateProduct(req.user.id, id, data);
    if (!updated) {
      // Either the product is not this user's, or the new customer is not.
      const exists = await productService.getProductById(req.user.id, id);
      return exists
        ? res.status(400).json({ error: "Selected customer could not be found." })
        : res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Update product error:", err);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

async function deleteProduct(req, res) {
  const id = parseId(req, res);
  if (id === null) return;

  try {
    const deleted = await productService.deleteProduct(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
