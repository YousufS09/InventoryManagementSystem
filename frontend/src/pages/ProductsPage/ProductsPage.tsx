import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./ProductsPage.module.css";
import CrudActions from "../../components/molecules/CrudActions/CrudActions";
import {
  Pagination,
  SortableHeader,
  TableToolbar,
} from "../../components/molecules/TableControls/TableControls";
import ProductModal, { type Product } from "../../components/organisms/ProductModal/ProductModal";
import MainLayout from "../../layouts/MainLayout";
import { usePagedList } from "../../hooks/usePagedList";
import { formatCurrency } from "../../utils/format";

const COLUMNS: { key: string; label: string }[] = [
  { key: "id", label: "Product ID" },
  { key: "product_name", label: "Product Name" },
  { key: "product_price", label: "Price" },
  { key: "product_quantity", label: "Quantity" },
  { key: "customer_id", label: "Customer ID" },
  { key: "customer_name", label: "Customer Name" },
];

const ProductsPage = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const list = usePagedList<Product>("/api/products");

  const renderBody = () => {
    if (list.loading) {
      return <p className={styles.emptyMessage}>Loading products...</p>;
    }
    if (list.error) {
      return <p className={styles.emptyMessage}>{list.error}</p>;
    }
    if (list.items.length === 0) {
      return (
        <p className={styles.emptyMessage}>
          {list.activeSearch ? `No products match "${list.activeSearch}".` : "No products found yet."}
        </p>
      );
    }

    return (
      <table className={styles.customerTable}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <SortableHeader
                key={column.key}
                column={column.key}
                sort={list.sort}
                order={list.order}
                onSort={list.toggleSort}
              >
                {column.label}
              </SortableHeader>
            ))}
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {list.items.map((product) => (
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
                  refreshData={list.reload}
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
              Open the AI Assistant and say things like "Create product Laptop price 50000 quantity 5 for Raj" or "Move product Laptop to customer Ravi" to manage inventory hands-free.
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

        <div className={styles.tableContainer}>
          <TableToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            placeholder="Search product or customer name"
            pageSize={list.pageSize}
            onPageSizeChange={list.setPageSize}
          />
          {renderBody()}
          {!list.loading && !list.error && (
            <Pagination
              page={list.page}
              pageSize={list.pageSize}
              total={list.total}
              onPageChange={list.setPage}
            />
          )}
        </div>

        {showModal && (
          <ProductModal
            product={selectedProduct}
            onSaved={list.reload}
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
