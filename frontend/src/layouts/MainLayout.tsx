import type { ReactNode } from "react";

import Sidebar from "../components/organisms/Sidebar/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/format";

import styles from "./MainLayout.module.css";

type Props = {
  children: ReactNode;
};

const MainLayout = ({ children }: Props) => {
  // ProtectedRoute guarantees a signed-in user before this layout renders.
  const { user } = useAuth();
  const username = user?.username || "User";

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.profileCard}>
            {/* Initials are drawn locally so the username is not sent to a third-party avatar service. */}
            <div className={styles.avatar} aria-hidden="true">
              {getInitials(username)}
            </div>

            <div>
              <div className={styles.profileName}>{username}</div>
              <div className={styles.online}>● Online</div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default MainLayout;
