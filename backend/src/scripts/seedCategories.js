
import pool from "../db.js"; // adjust path if needed


const seedCategories = async () => {
  try {
    // Clear old categories
    await pool.query("TRUNCATE TABLE categories RESTART IDENTITY CASCADE");

    // Insert curated categories
    await pool.query(`
      INSERT INTO categories (name, description) VALUES
      ('Fiction', 'Novels and stories across genres'),
      ('Non-Fiction', 'Biographies, history, and real-life topics'),
      ('Children & Young Adults', 'Books for kids, teens, and young adults'),
      ('Academic & Professional', 'Textbooks and professional resources'),
      ('Special Collections', 'Bestsellers, staff picks, limited editions')
    `);

    console.log("✅ Categories seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
  } finally {
    pool.end();
  }
};

seedCategories();
