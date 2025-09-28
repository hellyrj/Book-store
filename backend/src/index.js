import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoute from "./routes/categoryRoute.js";
import adminRoutes from './routes/adminRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';

dotenv.config();
const app = express();

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Increase payload size limit for base64 images
app.use(express.json({ limit: '50mb' })); // Increase from default 100kb to 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Health check
app.get("/api", (req, res) => {
  res.json({ message: "Bookstore API is running!" });
});






app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// 404 handler (only for API, frontend handled above)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend + Frontend running on http://localhost:${PORT}`);
});
