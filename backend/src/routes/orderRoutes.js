import express from "express";
import pool from "../db.js";
import { authenticate } from "../middleware/auth.js";
import EmailService from "./emailService.js";

const router = express.Router();

/**
 * GET /api/orders/cart
 * Get current user's cart items
 */
router.get("/cart", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ci.cart_item_id, 
        ci.book_id, 
        ci.quantity, 
        b.title, 
        b.price, 
        b.cover_url,
        (ci.quantity * b.price) as item_total
       FROM cart_items ci
       JOIN books b ON ci.book_id = b.book_id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading cart" 
    });
  }
});

/**
 * POST /api/orders/cart
 * Add a book to cart
 */
router.post("/cart", authenticate, async (req, res) => {
  const { book_id, quantity = 1 } = req.body;
  
  if (!book_id) {
    return res.status(400).json({ 
      success: false,
      error: "Book ID is required" 
    });
  }

  if (quantity <= 0) {
    return res.status(400).json({ 
      success: false,
      error: "Quantity must be greater than 0" 
    });
  }

  try {
    // Verify book exists
    const bookCheck = await pool.query(
      "SELECT book_id, title, price, stock FROM books WHERE book_id = $1",
      [book_id]
    );
    
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Book not found" 
      });
    }

    const book = bookCheck.rows[0];
    
    // Check stock availability
    if (book.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        error: `Only ${book.stock} items available in stock` 
      });
    }

    // Check if already in cart
    const existingItem = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2",
      [req.user.user_id, book_id]
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;
      
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2",
        [newQuantity, existingItem.rows[0].cart_item_id]
      );
      
      res.json({
        success: true,
        message: `Added ${quantity} more to "${book.title}" in cart`,
        action: "updated"
      });
    } else {
      // Insert new item
      await pool.query(
        "INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3)",
        [req.user.user_id, book_id, quantity]
      );
      
      res.json({
        success: true,
        message: `"${book.title}" added to cart`,
        action: "added"
      });
    }
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while adding to cart" 
    });
  }
});

/**
 * PUT /api/orders/cart/:id
 * Update cart item quantity
 */
router.put("/cart/:id", authenticate, async (req, res) => {
  const { quantity } = req.body;
  const cartItemId = req.params.id;
  
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ 
      success: false,
      error: "Valid quantity required (minimum 1)" 
    });
  }

  try {
    // Verify item belongs to user and get book info
    const itemCheck = await pool.query(
      `SELECT ci.*, b.title, b.stock 
       FROM cart_items ci 
       JOIN books b ON ci.book_id = b.book_id 
       WHERE ci.cart_item_id = $1 AND ci.user_id = $2`,
      [cartItemId, req.user.user_id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Cart item not found" 
      });
    }

    const item = itemCheck.rows[0];
    
    // Check stock availability
    if (item.stock < quantity) {
      return res.status(400).json({ 
        success: false,
        error: `Only ${item.stock} items available for "${item.title}"` 
      });
    }

    // Update quantity
    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 RETURNING *",
      [quantity, cartItemId]
    );
    
    res.json({
      success: true,
      message: `Quantity updated for "${item.title}"`,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while updating cart" 
    });
  }
});

/**
 * DELETE /api/orders/cart/:id
 * Remove an item from cart
 */
router.delete("/cart/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM cart_items 
       WHERE cart_item_id = $1 AND user_id = $2 
       RETURNING *`,
      [req.params.id, req.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Cart item not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Item removed from cart"
    });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while removing item" 
    });
  }
});

/**
 * POST /api/orders/checkout
 * Create order with screenshot verification
 */
router.post("/checkout", authenticate, async (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    shipping_address,
    billing_address,
    city,
    zip_code,
    payment_method = "screenshot",
    payment_screenshot
  } = req.body;

  try {
    // Validate required fields
    if (!full_name || !phone_number || !shipping_address || !city || !email) {
      return res.status(400).json({ 
        success: false,
        error: "Full name, email, phone number, shipping address, and city are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: "Valid email address is required" 
      });
    }

    // Validate screenshot for screenshot payment method
    if (payment_method === "screenshot" && !payment_screenshot) {
      return res.status(400).json({ 
        success: false,
        error: "Payment screenshot is required for screenshot verification" 
      });
    }

    // Start transaction early to prevent race conditions
    await pool.query('BEGIN');

    // Get cart items with book details WITH LOCK to prevent race conditions
    const cartItemsRes = await pool.query(
      `SELECT ci.book_id, ci.quantity, b.title, b.price, b.stock
       FROM cart_items ci
       JOIN books b ON ci.book_id = b.book_id
       WHERE ci.user_id = $1
       FOR UPDATE`,
      [req.user.user_id]
    );

    const cartItems = cartItemsRes.rows;
    
    if (cartItems.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Cart is empty" 
      });
    }

    // Validate stock and calculate total within transaction
    let totalPrice = 0;
    const stockIssues = [];

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        stockIssues.push(`"${item.title}": only ${item.stock} available`);
      }
      totalPrice += item.price * item.quantity;
    }

    if (stockIssues.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        error: "Insufficient stock",
        details: stockIssues
      });
    }

    // Create order with appropriate status
    const status = payment_method === "screenshot"
      ? "pending_verification"
      : payment_method === "cash"
      ? "pending"
      : "pending";
    
    const orderRes = await pool.query(
      `INSERT INTO orders (user_id, total_price, status, shipping_address, billing_address, full_name, email, phone_number, city, zip_code, payment_method, payment_screenshot) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING order_id, created_at`,
      [
        req.user.user_id, 
        totalPrice, 
        status,
        shipping_address,
        billing_address || shipping_address,
        full_name,
        email,
        phone_number,
        city,
        zip_code || '',
        payment_method,
        payment_method === 'screenshot' ? payment_screenshot : null
      ]
    );
    
    const orderId = orderRes.rows[0].order_id;

    // Insert order items
    for (const item of cartItems) {
      await pool.query(
        "INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4)",
        [orderId, item.book_id, item.quantity, item.price]
      );
    }

    // For cash on delivery, clear cart immediately but don't update stock yet
    if (payment_method === "cash") {
      await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.user_id]);
    }

    // For screenshot payments, clear cart after successful order creation
    if (payment_method === "screenshot") {
      await pool.query("DELETE FROM cart_items WHERE user_id = $1", [req.user.user_id]);
    }

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: payment_method === 'screenshot' 
        ? "Order submitted for verification. We will review your payment screenshot." 
        : "Order created successfully",
      order_id: orderId,
      total_price: totalPrice,
      status: status
    });

  } catch (err) {
    console.error("Checkout error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      detail: err.detail
    });
    
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error("Rollback error:", rollbackErr);
    }
    
    res.status(500).json({ 
      success: false,
      error: "Server error during checkout" 
    });
  }
});

/**
 * GET /api/orders/pending-verification
 * Get orders pending verification (for admin)
 */
router.get("/pending-verification", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: "Admin access required" 
      });
    }

    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.total_price,
        o.status,
        o.payment_method,
        o.payment_screenshot,
        o.created_at,
        o.full_name,
        o.phone_number,
        o.shipping_address,
        o.city,
        o.zip_code,
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
       WHERE o.status = 'pending_verification'
       GROUP BY o.order_id, u.user_id
       ORDER BY o.created_at DESC`
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching pending verification orders:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading orders" 
    });
  }
});
/**
 * PUT /api/orders/verify-payment/:id
 * Verify payment and update order status (admin only) - WITH EMAIL NOTIFICATION
 */
router.put("/verify-payment/:id", authenticate, async (req, res) => {
  const { action, admin_notes } = req.body; // 'approve' or 'reject'
  const orderId = req.params.id;

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: "Admin access required" 
      });
    }

    const orderCheck = await pool.query(
      `SELECT o.*, u.email as user_email, u.name as user_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.order_id = $1 AND o.status = 'pending_verification'`,
      [orderId]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found or already processed" 
      });
    }

    const order = orderCheck.rows[0];
    let newStatus, message;

    if (action === 'approve') {
      newStatus = 'paid';
      message = "Payment verified and order approved";
      
      // Update book stock
      const orderItems = await pool.query(
        "SELECT book_id, quantity FROM order_items WHERE order_id = $1",
        [orderId]
      );
      
      for (const item of orderItems.rows) {
        await pool.query(
          "UPDATE books SET stock = stock - $1 WHERE book_id = $2",
          [item.quantity, item.book_id]
        );
      }
      
      // Send approval email notification
      try {
        await EmailService.sendOrderVerificationEmail(order.user_email, order, true);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the whole request if email fails
      }
      
    } else if (action === 'reject') {
      newStatus = 'payment_rejected';
      message = "Payment verification rejected";
      
      // Send rejection email notification
      try {
        await EmailService.sendOrderVerificationEmail(order.user_email, order, false);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    } else {
      return res.status(400).json({ 
        success: false,
        error: "Invalid action. Use 'approve' or 'reject'" 
      });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *",
      [newStatus, orderId]
    );

    res.json({
      success: true,
      message: message,
      data: result.rows[0],
      email_sent: true,
      user_notified: order.user_email
    });

  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error during payment verification" 
    });
  }
});

/**
 * GET /api/orders/shipping-info
 * Get user's previous shipping information (for auto-fill)
 */
router.get("/shipping-info", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (user_id) 
        full_name, shipping_address, billing_address, phone_number, payment_method, city, zip_code
       FROM orders 
       WHERE user_id = $1 
       ORDER BY user_id, created_at DESC 
       LIMIT 1`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (err) {
    console.error("Error fetching shipping info:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading shipping information" 
    });
  }
});

/**
 * GET /api/orders
 * Get all orders for user
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'title', b.title,
                  'quantity', oi.quantity,
                  'price', oi.price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN books b ON oi.book_id = b.book_id
       WHERE o.user_id = $1 
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading orders" 
    });
  }
});

/**
 * GET /api/orders/:id
 * Get specific order details
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'title', b.title,
                  'quantity', oi.quantity,
                  'price', oi.price,
                  'book_id', b.book_id
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN books b ON oi.book_id = b.book_id
       WHERE o.order_id = $1 AND o.user_id = $2
       GROUP BY o.order_id`,
      [req.params.id, req.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while loading order" 
    });
  }
});

/**
 * GET /api/orders/admin/all-orders
 * Get all orders for admin dashboard
 */
router.get("/admin/all-orders", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: "Admin access required" 
      });
    }

    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.total_price,
        o.status,
        o.payment_method,
        o.created_at,
        o.full_name,
        o.phone_number,
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
 * PUT /api/orders/admin/update-status/:id
 * Update order status (admin only) - WITH EMAIL NOTIFICATION
 */
router.put("/admin/update-status/:id", authenticate, async (req, res) => {
  const { status, notify_user = true } = req.body;
  const orderId = req.params.id;
  
  const validStatuses = ['pending', 'pending_verification', 'processing', 'shipped', 'delivered', 'cancelled', 'paid', 'payment_rejected'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false,
      error: "Invalid status. Must be one of: " + validStatuses.join(', ')
    });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: "Admin access required" 
      });
    }

    // Get order with user info for email
    const orderCheck = await pool.query(
      `SELECT o.*, u.email as user_email, u.name as user_name 
       FROM orders o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.order_id = $1`,
      [orderId]
    );
    
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      });
    }

    const order = orderCheck.rows[0];
    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *",
      [status, orderId]
    );

    // Send status update email if requested and status changed
    if (notify_user && order.status !== status) {
      try {
        await EmailService.sendOrderStatusUpdate(order.user_email, order, status);
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
    }

    // If status is changed to paid and it was pending_verification, update stock and clear cart
    if (status === 'paid') {
      const orderCheck = await pool.query(
        "SELECT user_id FROM orders WHERE order_id = $1",
        [orderId]
      );
      
      if (orderCheck.rows.length > 0) {
        const order = orderCheck.rows[0];
        
        // Update book stock
        const orderItems = await pool.query(
          "SELECT book_id, quantity FROM order_items WHERE order_id = $1",
          [orderId]
        );
        
        for (const item of orderItems.rows) {
          await pool.query(
            "UPDATE books SET stock = stock - $1 WHERE book_id = $2",
            [item.quantity, item.book_id]
          );
        }
        
        // Clear user's cart
        await pool.query(
          "DELETE FROM cart_items WHERE user_id = $1",
          [order.user_id]
        );
      }
    }
    
    res.json({
      success: true,
      message: "Order status updated successfully",
      data: result.rows[0],
      email_sent: notify_user,
      user_notified: order.user_email
    });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ 
      success: false,
      error: "Server error while updating order status" 
    });
  }
});


export default router;