import express from "express";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js"; // your JWT middleware

const router = express.Router();

// Get all orders for the logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1",
      [req.user.user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create a new order
router.post("/", authenticate, async (req, res) => {
  const { book_id, quantity } = req.body;

  if (!book_id || !quantity) {
    return res.status(400).json({ error: "Book ID and quantity are required" });
  }

  try {
    // Insert order
    const orderResult = await pool.query(
      "INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING order_id, user_id, total_price, status, created_at",
      [req.user.user_id, 0, "pending"] // total_amount 0 for now, can calculate later
    );

    const order = orderResult.rows[0];

    // Insert order item
    const bookResult = await pool.query(
      "SELECT price FROM books WHERE book_id = $1",
      [book_id]
    );
    if (bookResult.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    const bookPrice = bookResult.rows[0].price;
    const totalPrice = bookPrice * quantity;

    await pool.query(
      "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4)",
      [order.order_id, book_id, quantity, bookPrice]
    );

    // Update order total
    await pool.query(
      "UPDATE orders SET total_price = $1 WHERE order_id = $2",
      [totalPrice, order.order_id]
    );

    res.status(201).json({ message: "Order created", order_id: order.order_id, total_price: totalPrice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
