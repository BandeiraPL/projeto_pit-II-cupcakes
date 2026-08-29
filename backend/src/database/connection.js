let pool = null;

const databaseConfig = {
  host: process.env.DB_HOST || "",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
};

function isDatabaseEnabled() {
  if (process.env.NODE_ENV === "test") return false;
  return Boolean(databaseConfig.host && databaseConfig.user && databaseConfig.database);
}

function getPool() {
  if (!isDatabaseEnabled()) return null;
  if (pool) return pool;

  const mysql = require("mysql2/promise");
  pool = mysql.createPool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  return pool;
}

async function connectDatabase() {
  if (!isDatabaseEnabled()) {
    return {
      connected: false,
      message: "Banco nao configurado no .env.",
    };
  }

  await getPool().query("SELECT 1");

  return {
    connected: true,
    message: `Conectado ao MySQL no banco ${databaseConfig.database}.`,
  };
}

async function query(sql, params = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

module.exports = {
  databaseConfig,
  isDatabaseEnabled,
  connectDatabase,
  query,
};
