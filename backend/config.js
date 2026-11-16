const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const INSECURE_SECRETS = new Set([
  "secret-key",
  "your-secret-key-change-me",
  "replace-with-a-strong-secret",
  "your-strong-random-secret",
]);

function loadConfig() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || INSECURE_SECRETS.has(jwtSecret) || jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or insecure. Set a random value of at least 32 characters in backend/.env " +
        "(for example: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\")."
    );
  }

  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY is not set. The AI assistant will return errors until it is configured.");
  }

  return {
    isProduction: process.env.NODE_ENV === "production",
    port: Number(process.env.PORT) || 4000,
    frontendUrl: process.env.FRONTEND_URL,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  };
}

try {
  module.exports = loadConfig();
} catch (error) {
  console.error(`Configuration error: ${error.message}`);
  process.exit(1);
}
