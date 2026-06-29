import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Dashboard.module.css";

import MainLayout from "../../../layouts/MainLayout";
import { apiFetch } from "../../../services/api";

type User = {
  id: number;
  username: string;
  email: string;
};

type DashboardStats = {
  totalCustomers: number;
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
};

const Dashboard = () => {
  const [user, setUser] =
    useState<User | null>(null);

  const [stats, setStats] =
    useState<DashboardStats>({
      totalCustomers: 0,
      totalProducts: 0,
      totalQuantity: 0,
      totalValue: 0,
    });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile =
      async () => {
        try {
          const res = await apiFetch(
            "/api/auth/profile"
          );

          const data =
            await res.json();

          if (res.ok) {
            setUser(data.user);
          } else {
            navigate(
              "/signin",
              {
                replace: true,
              }
            );
          }
        } catch {
          navigate(
            "/signin",
            {
              replace: true,
            }
          );
        }
      };

    const fetchDashboardStats =
      async () => {
        try {
          const res =
            await apiFetch(
              "/api/customers/dashboard-stats"
            );

          const data =
            await res.json();

          setStats(data);
        } catch (error) {
          console.error(error);
        }
      };

    fetchProfile();

    fetchDashboardStats();
  }, [navigate]);

  return (
    <MainLayout>
      <div className={styles.dashboard}>
        {/* Header */}

        <div className={styles.header}>
          <div
            className={
              styles.leftHeader
            }
          >
            <h1
              className={
                styles.greeting
              }
            >
              Welcome Back,{" "}
              {
                user?.username
              }
              ! 👋
            </h1>

            <p
              className={
                styles.description
              }
            >
              Here's what's
              happening with
              your business
              today.
            </p>
          </div>
        </div>

        {/* Statistics Cards */}

        <div
          className={
            styles.statsGrid
          }
        >
          <div
            className={
              styles.statCard
            }
          >
            <p>
              Total Customers
            </p>

            <h2>
              {
                stats.totalCustomers
              }
            </h2>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <p>
              Total Products
            </p>

            <h2>
              {
                stats.totalProducts
              }
            </h2>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <p>
              Total Quantity
            </p>

            <h2>
              {
                stats.totalQuantity
              }
            </h2>
          </div>

          <div
            className={
              styles.statCard
            }
          >
            <p>
              Inventory Value
            </p>

            <h2>
              ₹
              {
                stats.totalValue
              }
            </h2>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
