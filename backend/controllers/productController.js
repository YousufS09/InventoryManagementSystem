const { getPool } = require("../db");
const {
  buildProductSchema,
  buildCustomerSchema,
  getColumnExpression,
  quoteIdentifier,
} = require("../services/schemaService");

async function resolveCustomerName(pool, customerId) {
  const { tableName, columns } = await buildCustomerSchema(pool);

  if (!tableName) {
    return null;
  }

  const nameColumn = columns.get("customerName");
  if (!nameColumn) {
    return null;
  }

  const [rows] = await pool.execute(
    `
    SELECT ${quoteIdentifier(nameColumn)} AS customer_name
    FROM ${quoteIdentifier(tableName)}
    WHERE id = ?
    LIMIT 1
    `,
    [customerId]
  );

  return rows[0]?.customer_name || null;
}

async function createProduct(req, res) {
  try {
    const { productName, productPrice, productQuantity, customerId } = req.body;
    const pool = getPool();
    const { tableName, columns } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");
    const customerNameColumn = columns.get("customerName");

    if (!nameColumn || !priceColumn || !quantityColumn) {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    if (customerIdColumn) {
      await pool.execute(
        `
        INSERT INTO ${quoteIdentifier(tableName)}
        (
          ${quoteIdentifier(nameColumn)},
          ${quoteIdentifier(priceColumn)},
          ${quoteIdentifier(quantityColumn)},
          ${quoteIdentifier(customerIdColumn)}
        )
        VALUES (?, ?, ?, ?)
        `,
        [productName, productPrice, productQuantity, customerId]
      );
    } else if (customerNameColumn) {
      const customerName = await resolveCustomerName(pool, customerId);

      if (!customerName) {
        return res.status(400).json({ error: "Selected customer could not be found." });
      }

      await pool.execute(
        `
        INSERT INTO ${quoteIdentifier(tableName)}
        (
          ${quoteIdentifier(nameColumn)},
          ${quoteIdentifier(priceColumn)},
          ${quoteIdentifier(quantityColumn)},
          ${quoteIdentifier(customerNameColumn)}
        )
        VALUES (?, ?, ?, ?)
        `,
        [productName, productPrice, productQuantity, customerName]
      );
    } else {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    return res.status(201).json({ message: "Product created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

async function getProducts(req, res) {
  try {
    const pool = getPool();
    const { tableName: productTable, columns: productColumns } = await buildProductSchema(pool);
    const { tableName: customerTable, columns: customerColumns } = await buildCustomerSchema(pool);

    if (!productTable) {
      return res.status(200).json([]);
    }

    const nameColumn = productColumns.get("productName");
    const priceColumn = productColumns.get("productPrice");
    const quantityColumn = productColumns.get("productQuantity");
    const customerIdColumn = productColumns.get("customerId");
    const productCustomerNameColumn = productColumns.get("customerName");
    const customerNameColumn = customerColumns.get("customerName");

    const hasCustomerIdColumn = typeof customerIdColumn === "string" && customerIdColumn.trim() && customerIdColumn !== "null";
    const hasProductCustomerNameColumn = typeof productCustomerNameColumn === "string" && productCustomerNameColumn.trim() && productCustomerNameColumn !== "null";
    const hasCustomerNameColumn = typeof customerNameColumn === "string" && customerNameColumn.trim() && customerNameColumn !== "null";
    const hasProductNameColumn = typeof nameColumn === "string" && nameColumn.trim() && nameColumn !== "null";
    const hasPriceColumn = typeof priceColumn === "string" && priceColumn.trim() && priceColumn !== "null";
    const hasQuantityColumn = typeof quantityColumn === "string" && quantityColumn.trim() && quantityColumn !== "null";

    if (!hasProductNameColumn || !hasPriceColumn || !hasQuantityColumn) {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    const productSelect = [
      "p.id",
      `${getColumnExpression(nameColumn, "p")} AS product_name`,
      `${getColumnExpression(priceColumn, "p")} AS product_price`,
      `${getColumnExpression(quantityColumn, "p")} AS product_quantity`,
    ];

    let joinClause = "";

    if (hasCustomerIdColumn && customerTable && hasCustomerNameColumn) {
      productSelect.push(`${getColumnExpression(customerIdColumn, "p")} AS customer_id`);
      productSelect.push(`${getColumnExpression(customerNameColumn, "c")} AS customer_name`);
      joinClause = `LEFT JOIN ${quoteIdentifier(customerTable)} c ON p.${quoteIdentifier(customerIdColumn)} = c.id`;
    } else if (hasCustomerIdColumn) {
      productSelect.push(`${getColumnExpression(customerIdColumn, "p")} AS customer_id`);
      productSelect.push(`NULL AS customer_name`);
    } else if (hasProductCustomerNameColumn) {
      if (customerTable && hasCustomerNameColumn) {
        productSelect.push(`c.id AS customer_id`);
        productSelect.push(`${getColumnExpression(productCustomerNameColumn, "p")} AS customer_name`);
        joinClause = `LEFT JOIN ${quoteIdentifier(customerTable)} c ON p.${quoteIdentifier(productCustomerNameColumn)} = c.${quoteIdentifier(customerNameColumn)}`;
      } else {
        productSelect.push(`NULL AS customer_id`);
        productSelect.push(`${getColumnExpression(productCustomerNameColumn, "p")} AS customer_name`);
      }
    } else {
      productSelect.push(`NULL AS customer_id`);
      productSelect.push(`NULL AS customer_name`);
    }

    const [products] = await pool.execute(
      `
      SELECT
        ${productSelect.join(",\n        ")}
      FROM ${quoteIdentifier(productTable)} p
      ${joinClause}
      ORDER BY p.id DESC
      `
    );

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { tableName } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    await pool.execute(`DELETE FROM ${quoteIdentifier(tableName)} WHERE id = ?`, [id]);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { productName, productPrice, productQuantity, customerId } = req.body;

    const pool = getPool();
    const { tableName, columns } = await buildProductSchema(pool);

    if (!tableName) {
      return res.status(500).json({ error: "Products table was not found." });
    }

    const nameColumn = columns.get("productName");
    const priceColumn = columns.get("productPrice");
    const quantityColumn = columns.get("productQuantity");
    const customerIdColumn = columns.get("customerId");
    const customerNameColumn = columns.get("customerName");

    if (!nameColumn || !priceColumn || !quantityColumn) {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    if (customerIdColumn) {
      await pool.execute(
        `
        UPDATE ${quoteIdentifier(tableName)}
        SET
          ${quoteIdentifier(nameColumn)} = ?,
          ${quoteIdentifier(priceColumn)} = ?,
          ${quoteIdentifier(quantityColumn)} = ?,
          ${quoteIdentifier(customerIdColumn)} = ?
        WHERE id = ?
        `,
        [productName, productPrice, productQuantity, customerId, id]
      );
    } else if (customerNameColumn) {
      const customerName = await resolveCustomerName(pool, customerId);

      if (!customerName) {
        return res.status(400).json({ error: "Selected customer could not be found." });
      }

      await pool.execute(
        `
        UPDATE ${quoteIdentifier(tableName)}
        SET
          ${quoteIdentifier(nameColumn)} = ?,
          ${quoteIdentifier(priceColumn)} = ?,
          ${quoteIdentifier(quantityColumn)} = ?,
          ${quoteIdentifier(customerNameColumn)} = ?
        WHERE id = ?
        `,
        [productName, productPrice, productQuantity, customerName, id]
      );
    } else {
      return res.status(500).json({ error: "Products table schema is not compatible with the backend." });
    }

    return res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
