import express from "express";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        w.wishlist_id,
        w.book_id,
        w.created_at,
        b.title,
        b.author,
        b.price,
        b.cover_url,
        b.stock
       FROM wishlist w
       JOIN books b ON w.book_id = b.book_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading wishlist" 
    });
  }
});

/**
 * POST /api/wishlist
 * Add book to wishlist
 */
router.post("/", authenticate, async (req, res) => {
  const { book_id } = req.body;
  
  if (!book_id) {
    return res.status(400).json({ 
      success: false,
      error: "Book ID is required" 
    });
  }

  try {
    // Verify book exists
    const bookCheck = await pool.query(
      "SELECT book_id, title FROM books WHERE book_id = $1",
      [book_id]
    );
    
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Book not found" 
      });
    }

    const book = bookCheck.rows[0];
    
    // Check if already in wishlist
    const existingItem = await pool.query(
      "SELECT * FROM wishlist WHERE user_id = $1 AND book_id = $2",
      [req.user.user_id, book_id]
    );

    if (existingItem.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `"${book.title}" is already in your wishlist` 
      });
    }

    // Add to wishlist
    await pool.query(
      "INSERT INTO wishlist (user_id, book_id) VALUES ($1, $2)",
      [req.user.user_id, book_id]
    );
    
    res.json({
      success: true,
      message: `"${book.title}" added to wishlist`
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while adding to wishlist" 
    });
  }
});

/**
 * DELETE /api/wishlist/:id
 * Remove book from wishlist
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM wishlist 
       WHERE wishlist_id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Wishlist item not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Book removed from wishlist"
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while removing item" 
    });
  }
});

/**
 * DELETE /api/wishlist/book/:book_id
 * Remove book from wishlist by book ID
 */
router.delete("/book/:book_id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM wishlist 
       WHERE book_id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.book_id, req.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Book not found in wishlist" 
      });
    }
    
    res.json({
      success: true,
      message: "Book removed from wishlist"
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while removing item" 
    });
  }
});

/**
 * POST /api/wishlist/:id/move-to-cart
 * Move wishlist item to cart
 */
router.post("/:id/move-to-cart", authenticate, async (req, res) => {
  const { quantity = 1 } = req.body;
  
  try {
    // Get wishlist item
    const wishlistItem = await pool.query(
      `SELECT w.*, b.title, b.stock 
       FROM wishlist w 
       JOIN books b ON w.book_id = b.book_id 
       WHERE w.wishlist_id = $1 AND w.user_id = $2`,
      [req.params.id, req.user.user_id]
    );
    
    if (wishlistItem.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Wishlist item not found" 
      });
    }

    const item = wishlistItem.rows[0];
    
    // Check stock
    if (item.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        error: `Only ${item.stock} items available for "${item.title}"` 
      });
    }

    // Check if already in cart
    const existingCartItem = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2",
      [req.user.user_id, item.book_id]
    );

    if (existingCartItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingCartItem.rows[0].quantity + quantity;
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2",
        [newQuantity, existingCartItem.rows[0].cart_item_id]
      );
    } else {
      // Add to cart
      await pool.query(
        "INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3)",
        [req.user.user_id, item.book_id, quantity]
      );
    }

    // Remove from wishlist
    await pool.query(
      "DELETE FROM wishlist WHERE wishlist_id = $1",
      [req.params.id]
    );
    
    res.json({
      success: true,
      message: `"${item.title}" moved to cart`
    });
  } catch (err) {
    console.error("Error moving to cart:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while moving to cart" 
    });
  }
});

export default router;