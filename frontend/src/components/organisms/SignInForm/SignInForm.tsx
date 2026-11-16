import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import InputField from "../../molecules/InputField/InputField";
import Button from "../../atoms/Button/Button";
import styles from "./SignInForm.module.css";
import { apiRequest, getErrorMessage } from "../../../services/api";
import { useAuth, type User } from "../../../context/AuthContext";
import { signinFormSchema, type SigninFormValues } from "../../../validation/schemas";

const SigninForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SigninFormValues) => {
    setServerError(null);

    try {
      const data = await apiRequest<{ user: User }>("/api/auth/signin", {
        method: "POST",
        body: values,
      });

      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, "Sign in failed."));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to continue to your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputField
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <InputField
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <p className={styles.errorMessage}>{serverError}</p>}

          <Button
            text={isSubmitting ? "Signing in..." : "Sign In"}
            type="submit"
            disabled={isSubmitting}
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
