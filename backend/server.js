const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(
    __dirname,
    ".env"
  ),
});

const { initDB } =
  require("./db");

const authRoutes =
  require("./routes/auth");

const customerRoutes =
  require("./routes/customer");

const productRoutes =
  require("./routes/product");

const assistantRoutes =
  require("./routes/assistant");
  
const app = express();

const port =
  process.env.PORT || 4000;

const corsOptions = {
  origin: (
    origin,
    callback
  ) => {
    if (!origin) {
      return callback(
        null,
        true
      );
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    ].filter(Boolean);

    const isAllowed = allowedOrigins.some((entry) => {
      if (typeof entry === "string") {
        return entry === origin;
      }

      return entry.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "Not allowed by CORS"
      )
    );
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message:
      "SignupSignin backend is running.",
  });
});

app.use("/api/auth",authRoutes);

app.use(
  "/api/customers",
  customerRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/assistant",
  assistantRoutes
);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
  });
});

(async () => {
  try {
    await initDB();
    app.listen(port, () => {
      console.log(
        `Backend server listening on http://localhost:${port}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to initialize database:",
      error.message
    );
    process.exit(1);
  }
})();
