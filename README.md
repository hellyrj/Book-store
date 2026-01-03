CozyReads Online Bookstore - Complete Documentation
📋 Project Overview
CozyReads is a full-stack online bookstore application built with Node.js/Express backend and vanilla JavaScript frontend. The application provides a complete e-commerce experience with user authentication, book browsing, shopping cart, wishlist, order management, and comprehensive admin features.

🏗️ Architecture Overview
CozyReads/
├── backend/                 # Node.js/Express API Server
│   ├── src/
│   │   ├── routes/         # API Route handlers
│   │   ├── middleware/     # Authentication & Authorization
│   │   ├── scripts/        # Data population utilities
│   │   └── db.js          # Database configuration
│   └── public/            # Frontend static files
│       ├── *.html         # Application pages
│       ├── css/           # Stylesheets
│       ├── js/            # Frontend JavaScript
│       └── images/        # Static assets
🚀 Quick Start Guide
Prerequisites
Node.js (v14 or higher)
PostgreSQL (v12 or higher)
npm or yarn
Installation & Setup
Clone and Setup Backend
git clone https://github.com/hellyrj/bookstore.git
cd backend
npm install
Database Configuration
# Create PostgreSQL database
createdb booknest

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials
Initialize Database
# Create tables and schema
node src/models/initTables.js

# Seed admin user
node src/models/seedAdmin.js

# Seed categories
node src/scripts/seedCategories.js

# Populate with sample books (optional)
node src/scripts/fetchBooks.js
Start Development Server
npm run dev
# Server runs on http://localhost:3000
📁 Complete File Structure & Documentation
Backend Structure (/backend)
Core Application (/src)
index.js - Main server entry point
Express server configuration
Middleware setup (CORS, JSON parsing, static files)
Route mounting
Error handling middleware
Database Layer
db.js - PostgreSQL connection pool
Database connection configuration
Connection error handling
Query utility exports
Authentication & Middleware (/middleware)
auth.js - JWT authentication middleware
authenticate - Verifies JWT tokens
authorizeAdmin - Role-based access control
adminKey.js - API key protection for admin routes
API Routes (/routes)
User Management (userRoutes.js)
Endpoint	Method	Description	Authentication
/api/users/register	POST	User registration	Public
/api/users/login	POST	User login	Public
Features:

Password hashing with bcrypt
JWT token generation
Email uniqueness validation
Role-based user creation
Book Management (bookRoutes.js)
Endpoint	Method	Description	Auth
/api/books	GET	Get all books	Public
/api/books/:id	GET	Get book by ID	Public
/api/books/category/:category	GET	Books by category	Public
/api/books	POST	Add new book	Admin
/api/books/:id	PUT	Update book	Admin
/api/books/:id	DELETE	Delete book	Admin
Features:

Public browsing for all users
Admin-only CRUD operations
Category-based filtering
ISBN uniqueness validation
Category & Search (categoryRoute.js)
Endpoint	Method	Description
/api/categories	GET	List all categories
/api/categories/search	GET	Search books
/api/categories/:id/books	GET	Books by category ID
/api/categories/name/:name	GET	Books by category name
Search Features:

Multi-field search (title, author, category)
Case-insensitive matching
Real-time results with debouncing
Filter by search category
Order Management (orderRoutes.js)
Endpoint	Method	Description	Auth
/api/orders/cart	GET	Get user cart	User
/api/orders/cart	POST	Add to cart	User
/api/orders/cart/:id	PUT	Update cart item	User
/api/orders/cart/:id	DELETE	Remove from cart	User
/api/orders/checkout	POST	Create order	User
/api/orders	GET	User orders	User
/api/orders/:id	GET	Order details	User
Cart Features:

Stock validation before adding to cart
Quantity management with stock checks
Persistent cart across sessions
Real-time price calculations
Checkout Features:

Multiple payment methods (screenshot, cash)
Address validation
Order status tracking
Email notifications
Wishlist Management (wishlistRoutes.js)
Endpoint	Method	Description
/api/wishlist	GET	Get user wishlist
/api/wishlist	POST	Add to wishlist
/api/wishlist/:id	DELETE	Remove from wishlist
/api/wishlist/book/:book_id	DELETE	Remove by book ID
/api/wishlist/:id/move-to-cart	POST	Move to cart
Features:

Duplicate prevention
Quick cart transfer
Wishlist count tracking
Admin Routes (adminRoutes.js)
Endpoint	Method	Description
/api/admin/orders	GET	All orders with user details
/api/admin/users	GET	All users with statistics
/api/admin/stats	GET	Dashboard statistics
Admin Features:

Sales analytics
User management
Order overview
Revenue tracking
Review System (reviewRoutes.js)
Endpoint	Method	Description	Auth
/api/reviews	POST	Submit review	Public
/api/reviews	GET	Get approved reviews	Public
/api/reviews/admin/pending	GET	Pending reviews	Admin
/api/reviews/admin/:id/approve	PUT	Approve review	Admin
Features:

Guest reviews with moderation
Admin approval workflow
Public display of approved reviews
Data Utilities (/scripts)
fetchBooks.js - Populate database from Google Books API
seedCategories.js - Initialize book categories
normalizeCategories.js - Standardize category names
categorizeBooks.js - Auto-categorize books
hashadmin.js - Password hashing utility
Database Models (/models)
initTables.js - Database schema creation
seedAdmin.js - Default admin user creation
seed.js - Sample data population
Frontend Structure (/public)
HTML Pages
Core Pages
index.html - Homepage with featured content
categories.html - Book browsing and search
books.html - Complete book listing
User Features
login.html - User authentication
register.html - User registration
cart.html - Shopping cart management
wishlist.html - Wishlist management
orders.html - Order history and tracking
checkout.html - Purchase completion
contact.html - Reviews and feedback
Admin Features
admin.html - Book inventory management
admin-order.html - Order processing dashboard
payment-success.html - Order confirmation
Stylesheets (/css)
Core Styles
style.css - Global styles and design system
Responsive grid system
Color scheme and typography
Component styles (cards, buttons, forms)
Page-Specific Styles
admin.css & admin-order.css - Admin panel styling
cart.css - Shopping cart layout
categories.css - Book grid and search UI
login.css & register.css - Auth form styling
orders.css - Order history layout
wishlist.css - Wishlist management UI
contact.css - Review form styling
JavaScript Modules (/js)
Application Core
script.js - Shared utilities and helpers
home.js - Homepage functionality
Feature Modules
admin.js - Book management interface
admin-order.js - Order processing dashboard
cart.js - Shopping cart operations
categories.js - Search and browsing
contact.js - Review submission
login.js & register.js - Authentication
orders.js - Order tracking
wishlist.js - Wishlist management
🔧 Technical Implementation Details
Database Schema Design
Core Tables
users (user_id, name, email, password, role, created_at)
books (book_id, title, author, isbn, price, stock, description, cover_url)
categories (category_id, name, description)
orders (order_id, user_id, total_price, status, payment_method, ...)
order_items (order_item_id, order_id, book_id, quantity, price)
cart_items (cart_item_id, user_id, book_id, quantity)
wishlist (wishlist_id, user_id, book_id, created_at)
reviews (review_id, user_id, guest_name, guest_email, comment, is_approved)
Key Relationships
Users → Orders (One-to-Many)
Orders → Order Items (One-to-Many)
Books → Categories (Many-to-One)
Users → Cart Items (One-to-Many)
Users → Wishlist (One-to-Many)
Authentication Flow
User Registration

Frontend form validation
Password strength checking
Backend email uniqueness verification
Password hashing with bcrypt
JWT token generation
User Login

Credential validation
JWT token issuance
Session storage management
Role-based redirects
Protected Routes

JWT token verification middleware
Role-based access control
Automatic token expiration handling
Payment Processing System
Screenshot Verification Flow
User uploads payment screenshot during checkout
Order created with pending_verification status
Admin reviews payment evidence in admin panel
Admin approves → stock updated, confirmation email sent
Admin rejects → notification email sent, order marked rejected
Cash on Delivery Flow
User selects cash payment
Order created with pending status
Admin updates status through shipping process
Status progression: pending → processing → shipped → delivered
Search & Filtering System
Implementation Features
Debounced search (300ms delay)
Multi-field search (title, author, category)
Real-time results with loading states
Category-based filtering
Empty state handling
API Integration
// Search endpoint usage
/api/categories/search?q=searchTerm&filter=category
Shopping Cart Architecture
Client-Side Management
Local storage persistence
Real-time quantity updates
Stock validation
Price calculations
Server-Side Sync
Database persistence
Stock reservation
Concurrency control
Transaction safety
🎨 UI/UX Design System
Color Scheme
Primary: Warm, book-themed colors
Accents: Complementary action colors
Neutral: Clean backgrounds and text colors
Typography
Headings: Playfair Display (600 weight)
Body Text: Merriweather (400, 700 weights)
Icons: Font Awesome 6.4.0
Responsive Breakpoints
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
Component Library
Cards: Book displays, category items
Buttons: Primary, secondary, danger variants
Forms: Consistent validation styling
Modals: Popup dialogs for details and actions
Tables: Data presentation for orders and admin
🔒 Security Implementation
Authentication Security
JWT tokens with expiration
Password hashing (bcrypt, 10 rounds)
Role-based route protection
Session management
Data Validation
Input sanitization on all endpoints
SQL injection prevention with parameterized queries
XSS protection through output encoding
File upload validation
API Security
CORS configuration
Rate limiting readiness
Error message sanitization
Secure headers
📱 Mobile-First Features
Responsive Navigation
Hamburger menu for mobile
Touch-friendly button sizes
Optimized form inputs
Mobile-appropriate layouts
Performance Optimizations
Image optimization and lazy loading
Minimal JavaScript bundle sizes
Efficient CSS delivery
Debounced user interactions
🚀 Deployment Guide
Production Environment Setup
Environment Configuration
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your_secure_jwt_secret
ADMIN_API_KEY=your_admin_api_key
Build Process
npm install --production
Database Migration
node src/models/initTables.js
node src/models/seedAdmin.js
Start Production Server
npm start
Deployment Considerations
HTTPS enforcement
Environment variable security
Database connection pooling
Static file serving optimization
Error logging and monitoring
🔍 Testing Strategy
Manual Testing Checklist
User Flows
 User registration and login
 Book browsing and search
 Shopping cart operations
 Checkout process
 Order tracking
 Wishlist management
Admin Flows
 Book inventory management
 Order processing
 Payment verification
 User management
 Review moderation
Edge Cases
 Out-of-stock scenarios
 Payment verification failures
 Network error handling
 Form validation errors
📈 Performance Optimization
Backend Optimizations
Database query optimization
Efficient JOIN operations
Proper indexing strategy
Connection pooling
Frontend Optimizations
Image compression and lazy loading
JavaScript bundle optimization
CSS minimization
Efficient DOM manipulation
Network Optimizations
API response compression
Static asset caching
CDN readiness
Request batching
🤝 API Documentation
Consistent Response Format
{
  success: boolean,
  data: object|array,
  error: string,
  message: string
}
Error Handling
400 - Bad Request (validation errors)
401 - Unauthorized (authentication required)
403 - Forbidden (insufficient permissions)
404 - Not Found (resource doesn't exist)
500 - Server Error (internal issues)
🔮 Future Enhancements
Planned Features
Payment Gateway Integration - Stripe/PayPal support
Advanced Search - Full-text search with Elasticsearch
Book Recommendations - Machine learning suggestions
Social Features - Reading lists, reviews, sharing
Mobile App - React Native application
Analytics Dashboard - Advanced business intelligence
Multi-language Support - Internationalization
Advanced Inventory - Supplier management, reordering
Technical Improvements
Real-time Updates - WebSocket integration
Caching Layer - Redis for performance
Microservices - Scalable architecture
CI/CD Pipeline - Automated testing and deployment
📞 Support & Maintenance
Development Tools
Debugging: Comprehensive console logging
Monitoring: Performance and error tracking
Documentation: API and code documentation
Maintenance Procedures
Regular backups of database
Security updates for dependencies
Performance monitoring
Error log review
