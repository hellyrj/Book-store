import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// --- Add Category (Admin only) ---
router.post("/add", authenticate, authorizeAdmin, async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to add category" });
  }
});

// --- List Categories (Public) ---
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name LIMIT 40");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch categories" });
  }
});

// --- Get Books by Category ID ---
router.get("/:id/books", async (req, res) => {
  const categoryId = req.params.id;
  try {
    const result = await pool.query(
      "SELECT * FROM books WHERE category_id = $1",
      [categoryId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch books for this category" });
  }
});

// --- Get Books by Category Name (case-insensitive) ---
router.get("/name/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;

    // Case-insensitive match
    const catRes = await pool.query(
      "SELECT category_id FROM categories WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))",
      [categoryName]
    );

    if (!catRes.rows.length) {
      return res.status(404).json({ error: "Category not found" });
    }

    const categoryId = catRes.rows[0].category_id;

    const booksRes = await pool.query(
      "SELECT * FROM books WHERE category_id=$1",
      [categoryId]
    );

    if (!booksRes.rows.length) {
      return res.status(404).json({ error: "No books found for this category" });
    }

    res.json(booksRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
