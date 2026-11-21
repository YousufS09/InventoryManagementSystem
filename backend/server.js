// Entry point: connects to MySQL (creating/migrating tables), then starts listening.
const config = require("./config");
const app = require("./app");
const { initDB } = require("./db");

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
