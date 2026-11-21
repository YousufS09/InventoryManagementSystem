// Idempotent schema changes for databases created by older versions of the app.
// Each step checks INFORMATION_SCHEMA first, so running them on every startup is safe.

async function columnInfo(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS maxLength, IS_NULLABLE AS nullable
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0] || null;
}

async function hasIndex(pool, table, indexName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return Number(rows[0].count) > 0;
}

// customers.user_id: owner of each customer. Existing rows stay NULL (hidden from everyone).
async function addCustomerOwner(pool) {
  if (await columnInfo(pool, "customers", "user_id")) {
    return;
  }

  console.log("Migrating: adding customers.user_id (existing customers stay unowned and hidden).");
  await pool.query(`
    ALTER TABLE customers
      ADD COLUMN user_id INT NULL AFTER id,
      ADD KEY idx_customers_user (user_id),
      ADD CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES \`user\` (id) ON DELETE CASCADE
  `);
}

// Older user tables used VARCHAR(30) for email and VARCHAR(40) for username,
// which made signup fail with a 500 for longer values the API accepts.
async function widenUserColumns(pool) {
  const email = await columnInfo(pool, "user", "email");
  const username = await columnInfo(pool, "user", "username");

  // Keep each column's current NULL setting so existing rows never block the change.
  const nullability = (info) => (info.nullable === "YES" ? "NULL" : "NOT NULL");

  if (email && Number(email.maxLength) < 255) {
    console.log("Migrating: widening user.email to VARCHAR(255).");
    await pool.query(`ALTER TABLE \`user\` MODIFY email VARCHAR(255) ${nullability(email)}`);
  }

  if (username && Number(username.maxLength) < 100) {
    console.log("Migrating: widening user.username to VARCHAR(100).");
    await pool.query(`ALTER TABLE \`user\` MODIFY username VARCHAR(100) ${nullability(username)}`);
  }
}

// Guarantees one account per email even when two signups race each other.
async function addUniqueUserEmail(pool) {
  if (await hasIndex(pool, "user", "uniq_user_email")) {
    return;
  }

  const [duplicates] = await pool.query(
    "SELECT LOWER(email) AS email, COUNT(*) AS count FROM `user` GROUP BY LOWER(email) HAVING COUNT(*) > 1"
  );

  if (duplicates.length > 0) {
    // Never delete accounts automatically; leave it to a person to merge them.
    console.warn(
      `Skipping UNIQUE(user.email): ${duplicates.length} email(s) are used by more than one account: ` +
        duplicates.map((row) => row.email).join(", ")
    );
    return;
  }

  console.log("Migrating: adding UNIQUE index on user.email.");
  await pool.query("ALTER TABLE `user` ADD UNIQUE KEY uniq_user_email (email)");
}

async function runMigrations(pool) {
  await widenUserColumns(pool);
  await addUniqueUserEmail(pool);
  await addCustomerOwner(pool);
}

module.exports = { runMigrations };
