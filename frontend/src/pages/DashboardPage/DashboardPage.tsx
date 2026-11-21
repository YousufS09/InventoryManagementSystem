import { useEffect, useState } from "react";
import { MdErrorOutline, MdWarningAmber } from "react-icons/md";

import styles from "./DashboardPage.module.css";

import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { apiRequest, getErrorMessage } from "../../services/api";
import { formatCurrency, formatNumber } from "../../utils/format";

type DashboardStats = {
  totalCustomers: number;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStockThreshold: number;
  lowStock: {
    id: number;
    product_name: string;
    product_quantity: number;
    customer_name: string;
  }[];
  topProducts: {
    id: number;
    product_name: string;
    stock_value: number;
  }[];
};

const TopProductsChart = ({ products }: { products: DashboardStats["topProducts"] }) => {
  if (products.length === 0) {
    return <p className={styles.empty}>Add products to see their stock value here.</p>;
  }

  const max = Math.max(...products.map((product) => product.stock_value), 1);

  return (
    <ul className={styles.barList}>
      {products.map((product) => {
        const value = formatCurrency(product.stock_value);
        return (
          // Each row is focusable and carries its own tooltip, so the data is readable without hovering the thin bar.
          <li
            key={product.id}
            className={styles.barRow}
            tabIndex={0}
            title={`${product.product_name}: ${value}`}
            aria-label={`${product.product_name}: ${value}`}
          >
            <span className={styles.barLabel}>{product.product_name}</span>
            <span className={styles.barTrack} aria-hidden="true">
              <span
                className={styles.bar}
                style={{ display: "block", width: `${(product.stock_value / max) * 100}%` }}
              />
            </span>
            <span className={styles.barValue}>{value}</span>
          </li>
        );
      })}
    </ul>
  );
};

const LowStockList = ({
  items,
  threshold,
}: {
  items: DashboardStats["lowStock"];
  threshold: number;
}) => {
  if (items.length === 0) {
    return <p className={styles.empty}>All products have more than {threshold} units in stock.</p>;
  }

  return (
    <ul className={styles.stockList}>
      {items.map((item) => {
        const outOfStock = item.product_quantity === 0;
        return (
          <li key={item.id} className={styles.stockItem}>
            <div>
              <div className={styles.stockName}>{item.product_name}</div>
              <div className={styles.stockOwner}>{item.customer_name}</div>
            </div>
            <span className={`${styles.badge} ${outOfStock ? styles.badgeCritical : styles.badgeWarning}`}>
              {outOfStock ? <MdErrorOutline aria-hidden="true" /> : <MdWarningAmber aria-hidden="true" />}
              {outOfStock ? "Out of stock" : `${item.product_quantity} left`}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<DashboardStats>("/api/dashboard/stats")
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err, "Failed to load dashboard stats.")));
  }, []);

  const cards = [
    { label: "Total Customers", value: stats && formatNumber(stats.totalCustomers) },
    { label: "Total Products", value: stats && formatNumber(stats.totalProducts) },
    { label: "Total Quantity", value: stats && formatNumber(stats.totalQuantity) },
    { label: "Inventory Value", value: stats && formatCurrency(stats.totalValue) },
  ];

  return (
    <MainLayout>
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <div className={styles.leftHeader}>
            <h1 className={styles.greeting}>Welcome Back, {user?.username}! 👋</h1>

            <p className={styles.description}>
              {error ?? "Here's what's happening with your business today."}
            </p>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {cards.map((card) => (
            <div key={card.label} className={styles.statCard}>
              <p>{card.label}</p>
              <h2>{card.value ?? (error ? "—" : "…")}</h2>
            </div>
          ))}
        </div>

        {stats && (
          <div className={styles.panels}>
            <section className={styles.panel} aria-labelledby="top-products-title">
              <h2 id="top-products-title" className={styles.panelTitle}>
                Top products by stock value
              </h2>
              <p className={styles.panelSubtitle}>Price × quantity in stock</p>
              <TopProductsChart products={stats.topProducts} />
            </section>

            <section className={styles.panel} aria-labelledby="low-stock-title">
              <h2 id="low-stock-title" className={styles.panelTitle}>
                Low stock
              </h2>
              <p className={styles.panelSubtitle}>
                Products with {stats.lowStockThreshold} or fewer units
              </p>
              <LowStockList items={stats.lowStock} threshold={stats.lowStockThreshold} />
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
