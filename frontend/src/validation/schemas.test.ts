import { describe, expect, it } from "vitest";

import {
  customerFormSchema,
  productFormSchema,
  signinFormSchema,
  signupFormSchema,
} from "./schemas";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? undefined : result.error?.issues[0]?.message;

describe("customerFormSchema", () => {
  const valid = {
    customerName: "Raj",
    dob: "2005-03-09",
    email: "raj@example.com",
    phone: "+91 98765 43210",
    location: "Chennai",
  };

  it("accepts a valid customer", () => {
    expect(customerFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name, bad email, bad phone and future dates", () => {
    expect(firstError(customerFormSchema.safeParse({ ...valid, customerName: "  " }))).toMatch(/required/);
    expect(firstError(customerFormSchema.safeParse({ ...valid, email: "nope" }))).toMatch(/valid email/);
    expect(firstError(customerFormSchema.safeParse({ ...valid, phone: "12ab" }))).toMatch(/Phone/);
    expect(firstError(customerFormSchema.safeParse({ ...valid, dob: "2999-01-01" }))).toMatch(/future/);
  });
});

describe("productFormSchema", () => {
  const valid = { productName: "Laptop", productPrice: "500", productQuantity: "0", customerId: "3" };

  it("accepts quantity 0", () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects zero price, fractional quantity and missing customer", () => {
    expect(firstError(productFormSchema.safeParse({ ...valid, productPrice: "0" }))).toMatch(/greater than 0/);
    expect(firstError(productFormSchema.safeParse({ ...valid, productQuantity: "2.5" }))).toMatch(/whole number/);
    expect(firstError(productFormSchema.safeParse({ ...valid, customerId: "" }))).toMatch(/Select a customer/);
  });
});

describe("auth schemas", () => {
  it("requires matching, strong passwords on sign up", () => {
    const base = { username: "a", email: "a@b.com", password: "Passw0rd123" };
    expect(signupFormSchema.safeParse({ ...base, confirmPassword: "Passw0rd123" }).success).toBe(true);
    expect(firstError(signupFormSchema.safeParse({ ...base, confirmPassword: "other" }))).toMatch(/do not match/);
    expect(
      firstError(signupFormSchema.safeParse({ ...base, password: "short", confirmPassword: "short" }))
    ).toMatch(/at least 8/);
  });

  it("requires email and password on sign in", () => {
    expect(signinFormSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(signinFormSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
  });
});
