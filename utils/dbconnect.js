const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

console.log(process.env.DB_PASSWORD);
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  port: process.env.DB_PORT || 5432,
  password: process.env.DB_PASSWORD || "Srikanth@143",
  database: process.env.DB_NAME || "User",
});

module.exports = pool;
