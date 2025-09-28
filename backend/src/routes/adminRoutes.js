// adminRoutes.js
import express from "express";
import pool from "../db.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Protect all admin routes
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * GET /api/admin/orders
 * Get all orders with user details
 */
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.total_price,
        o.status,
        o.created_at,
        u.user_id,
        u.name as user_name,
        u.email as user_email,
        json_agg(
          json_build_object(
            'title', b.title,
            'quantity', oi.quantity,
            'price', oi.price,
            'book_id', b.book_id
          )
        ) as items
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN books b ON oi.book_id = b.book_id
       GROUP BY o.order_id, u.user_id
       ORDER BY o.created_at DESC`
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading orders" 
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with order counts
 */
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_spent
       FROM users u
       LEFT JOIN orders o ON u.user_id = o.user_id
       GROUP BY u.user_id
       ORDER BY u.created_at DESC`
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading users" 
    });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put("/orders/:id/status", async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false,
      error: "Invalid status. Must be one of: " + validStatuses.join(', ')
    });
  }

  try {
    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *",
      [status, orderId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Order status updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while updating order status" 
    });
  }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get("/stats", async (req, res) => {
  try {
    // Get total stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.user_id) as total_users,
        COUNT(DISTINCT o.order_id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COUNT(DISTINCT b.book_id) as total_books
      FROM users u
      CROSS JOIN (SELECT 1) as dummy
      LEFT JOIN orders o ON true
      LEFT JOIN books b ON true
      WHERE u.role = 'customer'
    `);

    // Get recent orders
    const recentOrdersResult = await pool.query(`
      SELECT o.*, u.name, u.email 
      FROM orders o 
      JOIN users u ON o.user_id = u.user_id 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);

    // Get order status distribution
    const statusStatsResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        recentOrders: recentOrdersResult.rows,
        statusStats: statusStatsResult.rows
      }
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading statistics" 
    });
  }
});

export default router;