import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import styles from "./ProductModal.module.css";
import { apiRequest, getErrorMessage } from "../../../services/api";
import { productFormSchema, type ProductFormValues } from "../../../validation/schemas";

type CustomerOption = {
  id: number;
  customer_name: string;
};

export type Product = {
  id: number;
  product_name: string;
  product_price: number;
  product_quantity: number;
  customer_id: number;
  customer_name: string | null;
};

type Props = {
  product?: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

const ProductModal = ({ product, onClose, onSaved }: Props) => {
  const isEditMode = Boolean(product);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: product?.product_name ?? "",
      productPrice: product ? String(product.product_price) : "",
      productQuantity: product ? String(product.product_quantity) : "",
      customerId: product?.customer_id ? String(product.customer_id) : "",
    },
  });

  useEffect(() => {
    apiRequest<CustomerOption[]>("/api/customers/allCustomers")
      .then(setCustomers)
      .catch((error) => toast.error(getErrorMessage(error, "Failed to load customers")))
      .finally(() => setCustomersLoading(false));
  }, []);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      await apiRequest(isEditMode ? `/api/products/${product!.id}` : "/api/products", {
        method: isEditMode ? "PUT" : "POST",
        body: {
          productName: values.productName,
          productPrice: Number(values.productPrice),
          productQuantity: Number(values.productQuantity),
          customerId: Number(values.customerId),
        },
      });

      toast.success(isEditMode ? "Product updated successfully" : "Product added successfully");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save product"));
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{isEditMode ? "Edit Product" : "Add Product"}</h2>

        <p className={styles.subtitle}>Enter product information</p>

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="product-name" className={styles.label}>
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="Enter product name"
              className={styles.input}
              aria-invalid={Boolean(errors.productName)}
              {...register("productName")}
            />
            {errors.productName && <p className={styles.error}>{errors.productName.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="product-price" className={styles.label}>
              Product Price (₹)
            </label>
            <input
              id="product-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter price"
              className={styles.input}
              aria-invalid={Boolean(errors.productPrice)}
              {...register("productPrice")}
            />
            {errors.productPrice && <p className={styles.error}>{errors.productPrice.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="product-quantity" className={styles.label}>
              Product Quantity
            </label>
            <input
              id="product-quantity"
              type="number"
              min="0"
              step="1"
              placeholder="Enter quantity"
              className={styles.input}
              aria-invalid={Boolean(errors.productQuantity)}
              {...register("productQuantity")}
            />
            {errors.productQuantity && (
              <p className={styles.error}>{errors.productQuantity.message}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="product-customer" className={styles.label}>
              Customer
            </label>
            <select
              id="product-customer"
              className={styles.select}
              disabled={customersLoading}
              aria-invalid={Boolean(errors.customerId)}
              {...register("customerId")}
            >
              <option value="">{customersLoading ? "Loading customers..." : "Select Customer"}</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_name} (#{customer.id})
                </option>
              ))}
            </select>
            {errors.customerId && <p className={styles.error}>{errors.customerId.message}</p>}
            {!customersLoading && customers.length === 0 && (
              <p className={styles.error}>Add a customer first; every product belongs to a customer.</p>
            )}
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
