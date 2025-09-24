import bcrypt from "bcryptjs";
import { query, end } from "../db.js";

async function seedAdmin() {
  try {
    const name = "Admin";
    const email = "admin@example.com";
    const password = "supersecret"; // <-- change this before running live!

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin into users table
    await query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      [name, email, hashedPassword, "admin"]
    );

    console.log("✅ Admin user created:", email);
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  } finally {
    await end();
  }
}

seedAdmin();
