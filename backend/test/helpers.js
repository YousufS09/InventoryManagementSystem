// Shared setup for tests that need MySQL.
// Uses the database configured in backend/.env (or the CI environment).
// Every user created here has an @test.invalid email and is deleted afterwards;
// ON DELETE CASCADE removes their customers, products and assistant sessions.

process.env.AUTH_RATE_LIMIT = process.env.AUTH_RATE_LIMIT || "1000";

const config = require("../config");
const { initDB, getPool } = require("../db");

const TEST_EMAIL_DOMAIN = "test.invalid";

async function startServer() {
  await initDB();
  const app = require("../app");

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

// A tiny HTTP client that keeps its own auth cookie, like one browser.
function createClient(baseUrl) {
  let cookie = "";

  return async function request(method, path, body) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      cookie = setCookie.split(";")[0];
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      // Empty body.
    }
    return { status: response.status, data };
  };
}

let counter = 0;
function uniqueEmail(prefix) {
  counter += 1;
  return `${prefix}-${process.pid}-${Date.now()}-${counter}@${TEST_EMAIL_DOMAIN}`;
}

// Signs up a new user and returns a client that is logged in as that user.
async function signedInClient(baseUrl, name = "tester") {
  const request = createClient(baseUrl);
  const email = uniqueEmail(name);
  const result = await request("POST", "/api/auth/signup", {
    username: name,
    email,
    password: "Passw0rd123",
  });
  if (result.status !== 201) {
    throw new Error(`Signup failed: ${result.status} ${JSON.stringify(result.data)}`);
  }
  return { request, email, user: result.data.user };
}

// Creates a user directly in the database (for tests that call controllers without HTTP).
async function createUserRow(name = "tester") {
  const [result] = await getPool().query(
    "INSERT INTO `user` (username, email, password) VALUES (?, ?, 'not-a-real-hash')",
    [name, uniqueEmail(name)]
  );
  return result.insertId;
}

async function cleanup(server) {
  await getPool().query("DELETE FROM `user` WHERE email LIKE ?", [`%@${TEST_EMAIL_DOMAIN}`]);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await getPool().end();
}

module.exports = {
  config,
  startServer,
  createClient,
  signedInClient,
  createUserRow,
  uniqueEmail,
  cleanup,
  getPool,
};
