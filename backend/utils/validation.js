const { z } = require("zod");
const { normalizeDate, isPastOrToday } = require("./dateUtils");

const trimmed = (label, max) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be at most ${max} characters.`);

const dobSchema = z
  .string({ error: "Date of birth is required." })
  .transform((value, ctx) => {
    const iso = normalizeDate(value);
    if (!iso) {
      ctx.addIssue({ code: "custom", message: "Date of birth is not a valid date." });
      return z.NEVER;
    }
    if (!isPastOrToday(iso)) {
      ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future." });
      return z.NEVER;
    }
    return iso;
  });

const emailSchema = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Email is not valid.").max(100, "Email must be at most 100 characters."));

const phoneSchema = z
  .string({ error: "Phone is required." })
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, "Phone must be 7-20 digits and may start with +.");

const customerSchema = z.object({
  customerName: trimmed("Customer name", 100),
  dob: dobSchema,
  email: emailSchema,
  phone: phoneSchema,
  location: trimmed("Location", 100),
});

const customerUpdateSchema = customerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Provide at least one field to update."
);

// Accepts numbers or numeric strings, because HTML number inputs and voice input send strings.
// Empty strings become undefined first, so "" is rejected instead of being coerced to 0.
const numeric = (schema) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    schema
  );

const priceSchema = numeric(
  z.coerce
    .number({ error: "Price must be a number." })
    .positive("Price must be greater than 0.")
    .max(99999999.99, "Price is too large.")
);

const quantitySchema = numeric(
  z.coerce
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(2147483647, "Quantity is too large.")
);

const customerIdSchema = numeric(
  z.coerce
    .number({ error: "Customer is required." })
    .int("Customer is required.")
    .positive("Customer is required.")
);

const productSchema = z.object({
  productName: trimmed("Product name", 100),
  productPrice: priceSchema,
  productQuantity: quantitySchema,
  customerId: customerIdSchema,
});

const productUpdateSchema = productSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "Provide at least one field to update."
);

const signupSchema = z.object({
  username: trimmed("Username", 100),
  email: emailSchema,
  password: z
    .string({ error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be at most 72 characters.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number."),
});

const signinSchema = z.object({
  email: z.string({ error: "Email is required." }).trim().toLowerCase().min(1, "Email is required."),
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

const idParamSchema = z.coerce.number().int().positive();

/**
 * Parses data with a schema. Returns { data } on success or { error } with the first message.
 */
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data };
  }
  return { error: result.error.issues[0]?.message || "Invalid input." };
}

module.exports = {
  validate,
  customerSchema,
  customerUpdateSchema,
  productSchema,
  productUpdateSchema,
  signupSchema,
  signinSchema,
  idParamSchema,
  // Field-level schemas, reused by the AI assistant to check one answer at a time.
  fields: {
    customerName: trimmed("Customer name", 100),
    dob: dobSchema,
    email: emailSchema,
    phone: phoneSchema,
    location: trimmed("Location", 100),
    productName: trimmed("Product name", 100),
    productPrice: priceSchema,
    productQuantity: quantitySchema,
  },
};
