import { useEffect, useState } from "react";

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
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
