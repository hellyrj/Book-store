// reviewRoutes.js
import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/reviews
 * Create a new general review (guest users allowed)
 */
router.post("/", async (req, res) => {
  const { review_title, comment, guest_name, guest_email } = req.body;

  // Validate required fields
  if (!review_title || !comment || !guest_name || !guest_email) {
    return res.status(400).json({
      success: false,
      error: "All fields are required: review_title, comment, guest_name, guest_email"
    });
  }

  try {
    // Insert general review (user_id can be null for guest reviews)
    const result = await pool.query(
      `INSERT INTO reviews 
       (review_title, comment, guest_name, guest_email, user_id, is_approved) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING *`,
      [review_title, comment, guest_name, guest_email, req.user?.user_id || null]
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! It will be visible after admin approval.",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({
      success: false,
      error: "Server error while submitting review"
    });
  }
});

/**
 * GET /api/reviews
 * Get all approved general reviews for public display
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        gr.review_id,
        gr.review_title,
        gr.comment,
        gr.guest_name,
        gr.guest_email,
        gr.created_at,
        gr.is_approved,
        u.name as user_name,
        u.email as user_email
       FROM reviews gr
       LEFT JOIN users u ON gr.user_id = u.user_id
       WHERE gr.is_approved = true
       ORDER BY gr.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({
      success: false,
      error: "Server error while loading reviews"
    });
  }
});

// Admin routes for review management
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * GET /api/reviews/admin/pending
 * Get all pending reviews for admin approval
 */
router.get("/admin/pending", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        gr.review_id,
        gr.review_title,
        gr.comment,
        gr.guest_name,
        gr.guest_email,
        gr.created_at,
        gr.is_approved,
        u.name as user_name,
        u.email as user_email
       FROM reviews gr
       LEFT JOIN users u ON gr.user_id = u.user_id
       WHERE gr.is_approved = false
       ORDER BY gr.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching pending reviews:", err);
    res.status(500).json({
      success: false,
      error: "Server error while loading pending reviews"
    });
  }
});

/**
 * GET /api/reviews/admin/all
 * Get all reviews for admin management
 */
router.get("/admin/all", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        gr.review_id,
        gr.review_title,
        gr.comment,
        gr.guest_name,
        gr.guest_email,
        gr.created_at,
        gr.is_approved,
        u.name as user_name,
        u.email as user_email
       FROM reviews gr
       LEFT JOIN users u ON gr.user_id = u.user_id
       ORDER BY gr.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching all reviews:", err);
    res.status(500).json({
      success: false,
      error: "Server error while loading reviews"
    });
  }
});

/**
 * PUT /api/reviews/admin/:id/approve
 * Approve a review
 */
router.put("/admin/:id/approve", async (req, res) => {
  const reviewId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE reviews SET is_approved = true WHERE review_id = $1 RETURNING *",
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    res.json({
      success: true,
      message: "Review approved successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error approving review:", err);
    res.status(500).json({
      success: false,
      error: "Server error while approving review"
    });
  }
});

/**
 * DELETE /api/reviews/admin/:id
 * Delete a review
 */
router.delete("/admin/:id", async (req, res) => {
  const reviewId = req.params.id;

  try {
    const result = await pool.query(
      "DELETE FROM reviews WHERE review_id = $1 RETURNING *",
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Review not found"
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({
      success: false,
      error: "Server error while deleting review"
    });
  }
});

export default router;