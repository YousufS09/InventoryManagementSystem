import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./ProductsPage.module.css";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import ProductModal, { type Product } from "../../components/organisms/ProductModal/ProductModal";
import MainLayout from "../../layouts/MainLayout";
import { apiRequest, getErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const ProductsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Bumping this number re-runs the fetch effect (after a create, update or delete).
  const [reloadKey, setReloadKey] = useState(0);
  const fetchProducts = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<Product[]>("/api/products")
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
        setLoadError(null);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error, "Failed to load products."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const renderBody = () => {
    if (loading) {
      return <p className={styles.emptyMessage}>Loading products...</p>;
    }
    if (loadError) {
      return <p className={styles.emptyMessage}>{loadError}</p>;
    }
    if (products.length === 0) {
      return <p className={styles.emptyMessage}>No products found yet.</p>;
    }

    return (
      <table className={styles.customerTable}>
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Customer ID</th>
            <th>Customer Name</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <span className={styles.productId}>
                  {`PRD${product.id.toString().padStart(4, "0")}`}
                </span>
              </td>

              <td>{product.product_name}</td>
              <td>{formatCurrency(product.product_price)}</td>
              <td>{product.product_quantity}</td>
              <td>{product.customer_id}</td>
              <td>{product.customer_name}</td>
              <td>
                <CrudActions
                  id={product.id}
                  endpoint="products"
                  refreshData={fetchProducts}
                  onEdit={() => {
                    setSelectedProduct(product);
                    setShowModal(true);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Products</h1>
            <p className={styles.subtitle}>Manage product information</p>
          </div>

          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedProduct(null);
              setShowModal(true);
            }}
          >
            + Add Product
          </button>
        </div>

        <div className={styles.voiceHint}>
          <div>
            <div className={styles.voiceHintTitle}>Voice control available</div>
            <p className={styles.voiceHintText}>
              Open the AI Assistant and say things like "Create product Laptop price 50000 quantity 5 for Raj" or "Delete product Mouse" to manage inventory hands-free.
            </p>
          </div>

          <button
            type="button"
            className={styles.voiceHintButton}
            onClick={() => navigate("/assistant")}
          >
            Open Voice Assistant
          </button>
        </div>

        <div className={styles.tableContainer}>{renderBody()}</div>

        {showModal && (
          <ProductModal
            product={selectedProduct}
            onSaved={fetchProducts}
            onClose={() => {
              setShowModal(false);
              setSelectedProduct(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
