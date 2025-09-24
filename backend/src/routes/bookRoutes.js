// src/routes/bookRoutes.js
import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// ------------------------
// Public routes
// ------------------------

// Get books by category (main or sub)
router.get("/category/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM books 
       WHERE main_category ILIKE $1 
          OR sub_category ILIKE $1
       ORDER BY created_at DESC`,
      [category]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "No books found for this category" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all books with optional pagination
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || null; // No limit by default
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      "SELECT * FROM books ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single book by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books WHERE book_id=$1",
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Book not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// Admin routes (JWT + role 'admin')
// ------------------------

// Add a new book
router.post("/", authenticate, authorizeAdmin, async (req, res) => {
  const {
    title,
    author,
    isbn,
    price,
    stock,
    category_id,
    description,
    cover_url,
    main_category,
    sub_category,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO books 
       (title, author, isbn, price, stock, category_id, description, cover_url, main_category, sub_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (isbn) DO NOTHING
       RETURNING *`,
      [
        title,
        author,
        isbn,
        price,
        stock,
        category_id,
        description,
        cover_url,
        main_category,
        sub_category,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update a book
router.put("/:id", authenticate, authorizeAdmin, async (req, res) => {
  const {
    title,
    author,
    isbn,
    price,
    stock,
    category_id,
    description,
    cover_url,
    main_category,
    sub_category,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE books 
       SET title=$1, author=$2, isbn=$3, price=$4, stock=$5, category_id=$6, description=$7, cover_url=$8,
           main_category=$9, sub_category=$10
       WHERE book_id=$11 RETURNING *`,
      [
        title,
        author,
        isbn,
        price,
        stock,
        category_id,
        description,
        cover_url,
        main_category,
        sub_category,
        req.params.id,
      ]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Book not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a book
router.delete("/:id", authenticate, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM books WHERE book_id=$1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
