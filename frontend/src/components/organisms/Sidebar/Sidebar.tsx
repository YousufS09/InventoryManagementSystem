import { useState, useEffect } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import styles from "./Sidebar.module.css";
import { useAuth } from "../../../context/AuthContext";

import {
  MdDashboard,
  MdPeople,
  MdLogout,
  MdChevronLeft,
  MdChevronRight,
  MdSmartToy,
  MdMenu,
  MdClose,
} from "react-icons/md";

import { HiOutlineCube } from "react-icons/hi";

const Sidebar = () => {
  const [collapsed, setCollapsed] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [isMobile, setIsMobile] =
    useState(window.innerWidth <= 768);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth <= 768
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  const menuItems = [
    {
      icon: <MdDashboard />,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: <HiOutlineCube />,
      label: "Products",
      path: "/products",
    },
    {
      icon: <MdPeople />,
      label: "Customers",
      path: "/customers",
    },
    {
      icon: <MdSmartToy />,
      label: "AI Assistant",
      path: "/assistant",
    },
  ];

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/signin", {
      replace: true,
    });
  };

  return (
    <>
      {/* MOBILE HAMBURGER */}

      {isMobile && (
        <button
          className={styles.hamburgerBtn}
          onClick={() =>
            setMobileOpen(
              !mobileOpen
            )
          }
        >
          {mobileOpen ? (
            <MdClose />
          ) : (
            <MdMenu />
          )}
        </button>
      )}

      {/* OVERLAY */}

      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <aside
        className={`
          ${styles.sidebar}
          ${
            collapsed
              ? styles.collapsed
              : ""
          }
          ${
            mobileOpen
              ? styles.mobileOpen
              : ""
          }
        `}
      >
        {/* DESKTOP COLLAPSE BUTTON */}

        {!isMobile && (
          <button
            className={`${styles.toggleBtn}
              ${
                collapsed
                  ? styles.toggleBtnCollapsed
                  : ""
              }`}
            onClick={() =>
              setCollapsed(
                !collapsed
              )
            }
          >
            {collapsed ? (
              <MdChevronRight />
            ) : (
              <MdChevronLeft />
            )}
          </button>
        )}

        {/* MENU */}

        <nav className={styles.menu}>
          {menuItems.map(
            (item) => (
              <div
                key={item.label}
                className={`${styles.menuItem}
                  ${
                    location.pathname ===
                    item.path
                      ? styles.activeMenuItem
                      : ""
                  }`}
                onClick={() => {
                  navigate(
                    item.path
                  );

                  if (
                    isMobile
                  ) {
                    setMobileOpen(
                      false
                    );
                  }
                }}
              >
                <span
                  className={
                    styles.icon
                  }
                >
                  {item.icon}
                </span>

                {!collapsed && (
                  <span
                    className={
                      styles.menuLabel
                    }
                  >
                    {item.label}
                  </span>
                )}
              </div>
            )
          )}
        </nav>

        {/* LOGOUT */}

        <div
          className={
            styles.bottomSection
          }
        >
          <button
            className={`${styles.logoutBtn}
              ${
                !collapsed
                  ? styles.logoutExpanded
                  : ""
              }`}
            onClick={
              handleLogout
            }
          >
            {collapsed ? (
              <MdLogout
                className={
                  styles.logoutIcon
                }
              />
            ) : (
              <>
                <div>
                  <div
                    className={
                      styles.logoutTitle
                    }
                  >
                    Logout
                  </div>

                  <div
                    className={
                      styles.logoutSubtitle
                    }
                  >
                    Securely sign out
                  </div>
                </div>

                <MdLogout
                  className={
                    styles.logoutExpandedIcon
                  }
                />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
