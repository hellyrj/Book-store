const pool = require("../db");
const bcrypt = require("bcrypt"); // for password hashing

async function seedDatabase() {
  try {
    // 1. Insert users
    const hashedPassword1 = await bcrypt.hash("password123", 10);
    const hashedPassword2 = await bcrypt.hash("admin123", 10);

    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES 
      ('Alice', 'alice@example.com', '${hashedPassword1}', 'customer'),
      ('Bob', 'bob@example.com', '${hashedPassword2}', 'admin');
    `);

    console.log("✅ Users inserted");

    // 2. Insert categories
    await pool.query(`
      INSERT INTO categories (name, description)
      VALUES 
      ('Fiction', 'Novels and stories'),
      ('Science', 'Science and technology books'),
      ('Romance', 'Romantic novels');
    `);

    console.log("✅ Categories inserted");

    // 3. Insert books
    await pool.query(`
      INSERT INTO books (title, author, isbn, price, stock, description, category_id)
      VALUES
      ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 12.99, 10, 'Classic novel', 1),
      ('A Brief History of Time', 'Stephen Hawking', '9780553380163', 15.99, 5, 'Science book', 2),
      ('Pride and Prejudice', 'Jane Austen', '9781503290563', 9.99, 7, 'Romantic classic', 3);
    `);

    console.log("✅ Books inserted");

    // Done
    console.log("🎉 Database seeded successfully!");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    pool.end();
  }
}

seedDatabase();
