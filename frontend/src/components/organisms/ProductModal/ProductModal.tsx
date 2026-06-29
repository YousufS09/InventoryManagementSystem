import styles from "./ProductModal.module.css";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiFetch } from "../../../services/api";
type Customer = {
  id: number;
  customer_name: string;
};

type Product = {
  id: number;
  product_name: string;
  product_price: number;
  product_quantity: number;
  customer_id: number;
};

type Props = {
  onClose: () => void;
  refreshData: () => void;
  product?: Product | null;
};

const ProductModal = ({
  onClose,
  refreshData,
  product,
}: Props) => {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [productName, setProductName] =
    useState("");

  const [productPrice, setProductPrice] =
    useState("");

  const [
    productQuantity,
    setProductQuantity,
  ] = useState("");

  const [customerId, setCustomerId] =
    useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (product) {
      setProductName(
        product.product_name
      );

      setProductPrice(
        product.product_price.toString()
      );

      setProductQuantity(
        product.product_quantity.toString()
      );

      setCustomerId(
        product.customer_id.toString()
      );
    }
  }, [product]);

  const fetchCustomers =
    async () => {
      try {
        const res = await apiFetch(
          "/api/customers/allCustomers"
        );

        const data =
          await res.json();

        setCustomers(data);
      } catch (error) {
        console.error(error);
      }
    };

  const handleSubmit =
    async () => {
    try {
      const url = product
          ? `/api/products/${product.id}`
          : "/api/products";

        const method =
          product
            ? "PUT"
            : "POST";

        const res = await apiFetch(
          url,
          {
            method,
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productName,
              productPrice,
              productQuantity,
              customerId,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to save product"
          );
        }

        toast.success(
          product
            ? "Product updated successfully"
            : "Product added successfully"
        );

        refreshData();

        onClose();
      } catch (error) {
        console.error(error);

        toast.error(
          "Failed to save product"
        );
      }
    };

  return (
    <div
      className={styles.modalOverlay}
    >
      <div
        className={styles.modal}
      >
        <h2 className={styles.title}>
          {product
            ? "Edit Product"
            : "Add Product"}
        </h2>

        <p
          className={styles.subtitle}
        >
          Enter product information
        </p>

        <div className={styles.form}>
          <div
            className={
              styles.formGroup
            }
          >
            <label
              className={styles.label}
            >
              Product Name
            </label>

            <input
              type="text"
              value={productName}
              onChange={(e) =>
                setProductName(
                  e.target.value
                )
              }
              placeholder="Enter product name"
              className={
                styles.input
              }
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label
              className={styles.label}
            >
              Product Price
            </label>

            <input
              type="number"
              value={productPrice}
              onChange={(e) =>
                setProductPrice(
                  e.target.value
                )
              }
              placeholder="Enter price"
              className={
                styles.input
              }
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label
              className={styles.label}
            >
              Product Quantity
            </label>

            <input
              type="number"
              value={
                productQuantity
              }
              onChange={(e) =>
                setProductQuantity(
                  e.target.value
                )
              }
              placeholder="Enter quantity"
              className={
                styles.input
              }
            />
          </div>

          <div
            className={
              styles.formGroup
            }
          >
            <label
              className={styles.label}
            >
              Customer
            </label>

            <select
              value={customerId}
              onChange={(e) =>
                setCustomerId(
                  e.target.value
                )
              }
              className={
                styles.select
              }
            >
              <option value="">
                Select Customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={
                      customer.id
                    }
                    value={
                      customer.id
                    }
                  >
                    {
                      customer.customer_name
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div
            className={
              styles.buttonGroup
            }
          >
            <button
              className={
                styles.cancelBtn
              }
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className={
                styles.saveBtn
              }
              onClick={
                handleSubmit
              }
            >
              {product
                ? "Update Product"
                : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
