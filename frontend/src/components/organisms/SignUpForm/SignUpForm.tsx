import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../../molecules/InputField/InputField";
import Button from "../../atoms/Button/Button";
import styles from "./SignUpForm.module.css";
import { apiFetch } from "../../../services/api";

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      navigate("/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create your account</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField label="Username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <InputField label="Email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <InputField label="Password" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <InputField label="Confirm Password" id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

          {error && <p className={styles.errorMessage}>{error}</p>}

          <Button text={loading ? "Signing up..." : "Sign Up"} type="submit" disabled={loading} />

          <p className={styles.switchText}>
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
