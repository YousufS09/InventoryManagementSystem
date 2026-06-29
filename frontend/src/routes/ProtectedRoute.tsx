import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../services/api";

type Props = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: Props) => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch("/api/auth/profile");

        setIsAuth(res.ok);
      } catch {
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return null;

  if (!isAuth) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
