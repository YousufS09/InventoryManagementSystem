import {
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  useNavigate,
} from "react-router-dom";

import Sidebar from "../components/organisms/Sidebar/Sidebar";
import { apiFetch } from "../services/api";

import styles from "./MainLayout.module.css";

type User = {
  id: number;
  username: string;
  email: string;
};

type Props = {
  children: ReactNode;
};

const MainLayout = ({
  children,
}: Props) => {
  const [user, setUser] =
    useState<User | null>(null);

  const navigate =
    useNavigate();

  useEffect(() => {
    const fetchProfile =
      async () => {
        try {
          const res =
            await apiFetch(
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
        } catch (error) {
          console.error(error);

          navigate(
            "/signin",
            {
              replace: true,
            }
          );
        }
      };

    fetchProfile();
  }, [navigate]);

  return (
    <div className={styles.page}>
      <Sidebar />

      <div
        className={
          styles.mainContent
        }
      >
        {/* Top Bar */}

        <div
          className={
            styles.topBar
          }
        >
          <div
            className={
              styles.profileCard
            }
          >
            <img
              src={`https://ui-avatars.com/api/?name=${
                user?.username ||
                "User"
              }&background=2563eb&color=fff`}
              alt="avatar"
              className={
                styles.avatar
              }
            />

            <div>
              <div
                className={
                  styles.profileName
                }
              >
                {user?.username ||
                  "Loading..."}
              </div>

              <div
                className={
                  styles.online
                }
              >
                ● Online
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}

        {children}
      </div>
    </div>
  );
};

export default MainLayout;
