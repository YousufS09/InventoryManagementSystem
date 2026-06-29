import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../../molecules/InputField/InputField";
import Button from "../../atoms/Button/Button";
import styles from "./SignInForm.module.css";
import { apiFetch } from "../../../services/api";

const SigninForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiFetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signin failed.");
      }

      // Optional (recommended): verify session before redirect
      const profileRes = await apiFetch("/api/auth/profile");

      if (profileRes.ok) {
        navigate("/dashboard");
      } else {
        throw new Error("Session not created properly.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signin failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in to continue to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <InputField
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.errorMessage}>{error}</p>}

          <Button
            text={loading ? "Signing in..." : "Sign In"}
            type="submit"
            disabled={loading}
          />

          <p className={styles.switchText}>
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SigninForm;
