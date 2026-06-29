import { Routes, Route, Navigate } from "react-router-dom";
import ProductsPage from "../pages/ProductsPage/ProductsPage";
import SigninPage from "../pages/SignInPage/SignInPage";
import SignupPage from "../pages/SignUpPage/SignUpPage";
import CustomersPage from "../pages/CustomersPage/CustomersPage";
import AIAssistantPage from "../pages/AIAssistantPage/AIAssistantPage";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../components/organisms/Dashboard/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>

      {/* Default Route */}

      <Route
        path="/"
        element={<Navigate to="/signin" replace />}
      />

      {/* Public Routes */}

      <Route
        path="/signin"
        element={<SigninPage />}
      />

      <Route
        path="/signup"
        element={<SignupPage />}
      />

      {/* Protected Dashboard Route */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Customers Route */}

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
  path="/products"
  element={
    <ProtectedRoute>
      <ProductsPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/assistant"
  element={
    <ProtectedRoute>
      <AIAssistantPage />
    </ProtectedRoute>
  }
/>

      {/* Fallback Route */}

      <Route
        path="*"
        element={<Navigate to="/signin" replace />}
      />
    </Routes>
    
  );
}