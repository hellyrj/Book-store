import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();


// --- Search Books ---
router.get("/search", async (req, res) => {
  try {
    const { q: searchTerm, filter = 'all' } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    let query;
    let params;

    switch (filter) {
      case 'title':
        query = `
          SELECT b.*, c.name as category_name 
          FROM books b 
          LEFT JOIN categories c ON b.category_id = c.category_id 
          WHERE LOWER(b.title) LIKE LOWER($1) 
          ORDER BY b.title
        `;
        params = [`%${searchTerm}%`];
        break;
      
      case 'author':
        query = `
          SELECT b.*, c.name as category_name 
          FROM books b 
          LEFT JOIN categories c ON b.category_id = c.category_id 
          WHERE LOWER(b.author) LIKE LOWER($1) 
          ORDER BY b.author, b.title
        `;
        params = [`%${searchTerm}%`];
        break;
      
      case 'category':
        query = `
          SELECT b.*, c.name as category_name 
          FROM books b 
          LEFT JOIN categories c ON b.category_id = c.category_id 
          WHERE LOWER(c.name) LIKE LOWER($1) 
          ORDER BY c.name, b.title
        `;
        params = [`%${searchTerm}%`];
        break;
      
      case 'all':
      default:
        query = `
          SELECT b.*, c.name as category_name 
          FROM books b 
          LEFT JOIN categories c ON b.category_id = c.category_id 
          WHERE LOWER(b.title) LIKE LOWER($1) 
             OR LOWER(b.author) LIKE LOWER($1)
             OR LOWER(c.name) LIKE LOWER($1)
          ORDER BY b.title
        `;
        params = [`%${searchTerm}%`];
        break;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Unable to perform search" });
  }
});

// --- Get All Books ---
router.get("/books/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.category_id 
      ORDER BY b.title
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch books" });
  }
});

// --- Get Book by ID ---
router.get("/books/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.category_id 
      WHERE b.book_id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch book" });
  }
});



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
