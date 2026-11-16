// Loads and validates environment variables; exits early if JWT_SECRET is unsafe.
const config = require("./config");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { initDB } = require("./db");
const authRoutes = require("./routes/auth");
const customerRoutes = require("./routes/customer");
const productRoutes = require("./routes/product");
const dashboardRoutes = require("./routes/dashboard");
const assistantRoutes = require("./routes/assistant");

const app = express();

// Render (and most hosts) sit behind a proxy; needed so rate limiting sees the real client IP.
if (config.isProduction) {
  app.set("trust proxy", 1);
}

const allowedOrigins = [
  config.frontendUrl,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some((entry) =>
      typeof entry === "string" ? entry === origin : entry.test(origin)
    );

    return isAllowed
      ? callback(null, true)
      : callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Assistant requests carry the chat transcript; keep bodies small.
app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => {
  res.json({ message: "Inventory Management backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assistant", assistantRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Last-resort handler: CORS rejections, malformed JSON bodies and unexpected errors.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed." });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body is not valid JSON." });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
});

(async () => {
  try {
    await initDB();
    app.listen(config.port, () => {
      console.log(`Backend server listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error.code || "", error.message || "");
    process.exit(1);
  }
})();
