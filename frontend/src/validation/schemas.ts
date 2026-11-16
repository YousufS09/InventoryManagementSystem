import { z } from "zod";

// These rules mirror backend/utils/validation.js so users see errors before submitting.

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"));

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export const customerFormSchema = z.object({
  customerName: required("Customer name", 100),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => value <= todayIso(), "Date of birth cannot be in the future"),
  email: emailField.pipe(z.string().max(100, "Email must be at most 100 characters")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, "Phone must be 7-20 digits and may start with +"),
  location: required("Location", 100),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const productFormSchema = z.object({
  productName: required("Product name", 100),
  productPrice: z
    .string()
    .trim()
    .min(1, "Price is required")
    .refine((value) => Number(value) > 0, "Price must be greater than 0"),
  productQuantity: z
    .string()
    .trim()
    .min(1, "Quantity is required")
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0,
      "Quantity must be a whole number, 0 or more"
    ),
  customerId: z.string().min(1, "Select a customer"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const signupFormSchema = z
  .object({
    username: required("Username", 100),
    email: emailField,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be at most 72 characters")
      .regex(/[A-Za-z]/, "Password must contain a letter")
      .regex(/[0-9]/, "Password must contain a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormValues = z.infer<typeof signupFormSchema>;

export const signinFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type SigninFormValues = z.infer<typeof signinFormSchema>;
