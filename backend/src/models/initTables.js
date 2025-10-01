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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Orders - UPDATED with email column
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        
        -- Customer information
        email VARCHAR(150) NOT NULL, -- NEW: Customer email for order
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        
        -- Shipping and billing information
        shipping_address TEXT NOT NULL,
        billing_address TEXT,
        city VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20),
        
        -- Payment information
        payment_method VARCHAR(50) DEFAULT 'screenshot',
        tx_ref VARCHAR(255),
        payment_status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        payment_screenshot TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Cart Items
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id) -- Prevent duplicate cart items
      );
    `);

    // 6. Order Items
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Wishlist
    await query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        wishlist_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id) -- Prevent duplicate entries
      );
    `);

    // 8. Reviews
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
        book_id INT REFERENCES books(book_id) ON DELETE CASCADE,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add this after creating the reviews table in initTables.js
await query(`
  ALTER TABLE reviews 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guest_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
`);

    // Add status constraints to orders table
    await query(`
      DO $$ 
      BEGIN 
        -- Drop existing constraint if it exists
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
          ALTER TABLE orders DROP CONSTRAINT orders_status_check;
        END IF;
        
        -- Add new constraint with all valid status values
        ALTER TABLE orders 
        ADD CONSTRAINT orders_status_check 
        CHECK (status IN (
          'pending', 
          'pending_verification', 
          'processing', 
          'shipped', 
          'delivered', 
          'cancelled', 
          'paid', 
          'payment_rejected'
        ));
      EXCEPTION
        WHEN undefined_object THEN 
          -- Constraint doesn't exist, create it
          ALTER TABLE orders 
          ADD CONSTRAINT orders_status_check 
          CHECK (status IN (
            'pending', 
            'pending_verification', 
            'processing', 
            'shipped', 
            'delivered', 
            'cancelled', 
            'paid', 
            'payment_rejected'
          ));
      END $$;
    `);

    // Create indexes for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
      CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
    `);

    console.log("✅ All tables created successfully with screenshot payment support!");
    
    // Insert sample admin user if not exists
    await query(`
      INSERT INTO users (name, email, password, role) 
      VALUES ('Admin User', 'admin@booknest.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
    
    console.log("✅ Sample admin user created (if not exists)!");

  } catch (err) {
    console.error("❌ Error creating tables:", err);
  } finally {
    end();
  }
}

createTables();