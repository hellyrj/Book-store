
// src/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
console.log("DATABASE_URL raw:", JSON.stringify(process.env.DATABASE_URL));

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing! Did you load your .env?");
}

export const query = (text, params) => pool.query(text, params);
export const end = () => pool.end(); // 👈 add this

export default pool;