import { query, end } from "../db.js";

async function createTables() {
  try {
    // 1. Users (customers)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Categories
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        name VARCHAR(200) UNIQUE NOT NULL,
        description TEXT
      );
    `);

    // 3. Books
    await query(`
      CREATE TABLE IF NOT EXISTS books (
        book_id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        author VARCHAR(300) NOT NULL,
        isbn VARCHAR(100) UNIQUE,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        description TEXT,
        category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
        cover_url TEXT,
        main_category VARCHAR(255),   
        sub_category VARCHAR(255),    
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 4. Orders
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Cart Items
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 6. Order Items
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL
      );
    `);

    // 7. Reviews
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

   
    console.log("✅ All tables (including admins) created successfully!");
  } catch (err) {
    console.error("❌ Error creating tables:", err);
  } finally {
    end();
  }
}

createTables();
