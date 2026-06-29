import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import styles from "./ProductsPage.module.css";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import ProductModal from "../../components/organisms/ProductModal/ProductModal";
import MainLayout from "../../layouts/MainLayout";
import { apiFetch } from "../../services/api";
type Product = {
  id: number;
  product_name: string;
  product_price: number;
  product_quantity: number;
  customer_id: number;
  customer_name: string;
};

const ProductsPage = () => {
  const [showModal, setShowModal] =
    useState(false);
  const navigate = useNavigate();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<Product | null>(null);

  const fetchProducts =
    async () => {
      try {
        const res = await apiFetch(
          "/api/products"
        );

        const data =
          await res.json();

        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
  <MainLayout>
    <div className={styles.container}>
      {/* Header */}

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Products
          </h1>

          <p className={styles.subtitle}>
            Manage product information
          </p>
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
          <div className={styles.voiceHintTitle}>
            Voice control available
          </div>

          <p className={styles.voiceHintText}>
            Open the AI Assistant and say things like "Create product Laptop price 50000 quantity 5 for Raj" or
            "Delete product Mouse" to manage inventory hands-free.
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

      {/* Products Table */}

      <div
        className={styles.tableContainer}
      >
        {products.length === 0 ? (
          <p
            className={
              styles.emptyMessage
            }
          >
            No products found yet.
          </p>
        ) : (
          <table
            className={
              styles.customerTable
            }
          >
            <thead>
              <tr>
                <th>Product ID</th>

                <th>
                  Product Name
                </th>

                <th>
                  Price
                </th>

                <th>
                  Quantity
                </th>

                <th>
                  Customer ID
                </th>

                <th>
                  Customer Name
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map(
                (product) => (
                  <tr
                    key={
                      product.id
                    }
                  >
                    <td>
                      <span
                        className={
                          styles.productId
                        }
                      >
                        {`PRD${product.id
                          .toString()
                          .padStart(
                            4,
                            "0"
                          )}`}
                      </span>
                    </td>

                    <td>
                      {
                        product.product_name
                      }
                    </td>

                    <td>
                      ₹
                      {
                        product.product_price
                      }
                    </td>

                    <td>
                      {
                        product.product_quantity
                      }
                    </td>

                    <td>
                      {
                        product.customer_id
                      }
                    </td>

                    <td>
                      {
                        product.customer_name
                      }
                    </td>

                    <td>
                      <CrudActions
                        id={
                          product.id
                        }
                        endpoint="products"
                        refreshData={
                          fetchProducts
                        }
                        onEdit={() => {
                          setSelectedProduct(
                            product
                          );

                          setShowModal(
                            true
                          );
                        }}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Modal */}

      {showModal && (
        <ProductModal
          product={
            selectedProduct
          }
          refreshData={
            fetchProducts
          }
          onClose={() => {
            setShowModal(false);

            setSelectedProduct(
              null
            );
          }}
        />
      )}
    </div>
  </MainLayout>
);
};

export default ProductsPage;
