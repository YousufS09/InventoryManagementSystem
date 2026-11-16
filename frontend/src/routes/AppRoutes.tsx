import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SigninPage from "../pages/SignInPage/SignInPage";
import SignupPage from "../pages/SignUpPage/SignUpPage";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import ProductsPage from "../pages/ProductsPage/ProductsPage";
import CustomersPage from "../pages/CustomersPage/CustomersPage";
import AIAssistantPage from "../pages/AIAssistantPage/AIAssistantPage";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

// Signed-in users who open /signin or /signup go straight to the dashboard.
function PublicOnly({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return null;
  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/signin" element={<PublicOnly><SigninPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />

      {/* Unknown URLs go to the dashboard (or sign-in if not logged in) instead of looking like a logout. */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
