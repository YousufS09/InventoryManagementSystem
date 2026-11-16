import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import InputField from "../../molecules/InputField/InputField";
import Button from "../../atoms/Button/Button";
import styles from "./SignUpForm.module.css";
import { apiRequest, getErrorMessage } from "../../../services/api";
import { useAuth, type User } from "../../../context/AuthContext";
import { signupFormSchema, type SignupFormValues } from "../../../validation/schemas";

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async ({ username, email, password }: SignupFormValues) => {
    setServerError(null);

    try {
      // The backend signs the new user in (sets the auth cookie), so go straight to the dashboard.
      const data = await apiRequest<{ user: User }>("/api/auth/signup", {
        method: "POST",
        body: { username, email, password },
      });

      setUser(data.user);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, "Sign up failed."));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create your account</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <InputField
            label="Username"
            id="username"
            autoComplete="username"
            error={errors.username?.message}
            {...register("username")}
          />
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
            autoComplete="new-password"
            placeholder="At least 8 characters, with a letter and a number"
            error={errors.password?.message}
            {...register("password")}
          />
          <InputField
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {serverError && <p className={styles.errorMessage}>{serverError}</p>}

          <Button
            text={isSubmitting ? "Signing up..." : "Sign Up"}
            type="submit"
            disabled={isSubmitting}
          />

          <p className={styles.switchText}>
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
