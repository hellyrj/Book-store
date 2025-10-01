  

#  CozyReads

BookNest is a full-stack online bookstore application built with **Node.js, Express, PostgreSQL, and Vanilla JS (HTML/CSS/JS frontend)**.  
It allows users to browse books by categories, add to cart, and place orders.  
Admins can manage books (CRUD), categories, and view orders through a dedicated panel.

---

## 🚀 Features

### 👤 Users
- Register & Login (JWT authentication)
- Browse categories & books
- Search books
- Add to Cart
- Place orders
- View their orders

### 🔑 Admin
- Admin login with role-based access
- Add, edit, delete books
- Manage categories
- Manage customer orders

---

## 🛠️ Tech Stack
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (with Supabase or local Postgres)
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Auth:** JWT + Role-based authorization
- **Environment:** `.env` for secrets

---

## ⚙️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/hellyrj/bookstore.git
cd booknest



Table of Contents


1. Features

            User Features

- User registration and login with JWT

- Browse books by categories

- Search books by title, author, or category

- Shopping cart management

-  Wishlist functionality

- Order placement with multiple payment methods

-  Order history and tracking

- Guest reviews system

           Admin Features
- Admin dashboard with statistics

-  Book management (CRUD operations) 

- Order management and status updates

 - Payment verification system

-  Email notifications

   Payment Methods

- Payment screenshot verification

- Cash on delivery

- Automated email notifications

Tech Stack

Project Structure



Setup Instructions

# Install Node.js and PostgreSQL
# Clone the repository
git clone https://github.com/hellyrj/bookstore.git

cd backend

#install dependency 
npm install express dotenv cors bcryptjs jsonwebtoken pg axios

.env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/booknest

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Port
PORT=3000

# Optional: Admin API Key
ADMIN_API_KEY=your_admin_api_key_here

# Initialize database tables
node src/scripts/initTables.js

# Create admin user
node src/scripts/seedAdmin.js

# Seed categories
node src/scripts/seedCategories.js

#populate books
# Fetch books from Google Books API
node src/scripts/fetchBooks.js

# Normalize categories
node src/scripts/normalizeCategories.js

# Auto-categorize books
node src/scripts/categorizeBooks.js

# Development
npm run dev

# Production
npm start

API Endpoints

Authentication
POST /api/users/register - User registration

POST /api/users/login - User login

Books
GET /api/books - Get all books

GET /api/books/:id - Get book by ID

GET /api/books/category/:category - Get books by category

POST /api/books - Add new book (Admin)

PUT /api/books/:id - Update book (Admin)

DELETE /api/books/:id - Delete book (Admin)

GET /api/categories - List all categories

GET /api/categories/search?q=term&filter=all - Search books

GET /api/categories/books/all - Get all books with categories

GET /api/categories/:id/books - Get books by category ID

Orders & Cart
GET /api/orders/cart - Get user cart

POST /api/orders/cart - Add to cart

PUT /api/orders/cart/:id - Update cart item

DELETE /api/orders/cart/:id - Remove from cart

POST /api/orders/checkout - Checkout

GET /api/orders - Get user orders

GET /api/orders/:id - Get order details

Wishlist
GET /api/wishlist - Get user wishlist

POST /api/wishlist - Add to wishlist

DELETE /api/wishlist/:id - Remove from wishlist

POST /api/wishlist/:id/move-to-cart - Move to cart

Admin
GET /api/admin/stats - Dashboard statistics

GET /api/admin/orders - All orders

GET /api/admin/users - All users

PUT /api/admin/orders/:id/status - Update order status

Database Schema

Core Tables
users - User accounts and authentication

categories - Book categories

books - Book inventory with metadata

orders - Order information with payment details

order_items - Individual items in orders

cart_items - Shopping cart items

wishlist - User wishlists

reviews - Book reviews and ratings

Key Relationships
Users ↔ Orders (One-to-Many)

Orders ↔ Order Items (One-to-Many)

Books ↔ Categories (Many-to-One)

Users ↔ Cart Items (One-to-Many)

Users ↔ Wishlist (One-to-Many)
  
Authentication

JWT Token Flow
User logs in with email/password

Server validates credentials and returns JWT token

Client includes token in Authorization header: Bearer <token>

Protected routes use authenticate middleware

Admin routes use authorizeAdmin middleware

Payment Flow

1. Screenshot Payment Method

User Checkout → Upload Payment Screenshot → Order Status: pending_verification
     ↓
Admin Reviews Screenshot → Approve/Reject → Email Notification
     ↓
If Approved: Order Status: paid → Stock Updated → Cart Cleared

2. Cash on Delivery

User Checkout → Select Cash Payment → Order Status: pending
     ↓
Admin Updates Status → processing → shipped → delivered

Admin Features

Admin Features
Dashboard Statistics
Total users, orders, revenue, books

Recent orders

Order status distribution

Order Management
View all orders with user details

Update order status

Verify payment screenshots

Send status update emails

User Management
View all users with order history

Track user spending

Content Management
Add/edit/delete books

Moderate reviews

Manage categories

📧 Email Notifications
The system includes simulated email services for:

Order verification (approval/rejection)

Order status updates

Payment confirmations

Note: Currently logs to console. Integrate with real email service (SendGrid, Mailgun) for production.



Scripts

 Scripts
Database Management
initTables.js - Creates all database tables with constraints

seedAdmin.js - Creates default admin user

seedCategories.js - Populates book categories

Data Population
fetchBooks.js - Fetches books from Google Books API

normalizeCategories.js - Standardizes book categories

categorizeBooks.js - Auto-categorizes books using AI mapping

Utilities
hashadmin.js - Generates bcrypt hashes for passwords

Public (Frontend) Files

The public/ folder contains the client-side application (HTML, CSS, JavaScript).

index.html → Homepage (entry point).

login.html / js/login.js → Login page; authenticates user and stores JWT + user info in localStorage.

register.html / js/register.js → Registration page; lets new users sign up.

categories.html / js/categories.js → Displays categories, lists books, handles “Add to Cart”, and enforces login before cart actions.

cart.html / js/cart.js → Displays current user’s cart, allows quantity updates, clearing, and checkout.

admin.html / js/admin.js → Admin dashboard; only accessible by admin users, supports adding, editing, deleting, and searching books.

contact.html → Static contact page.

css/style.css → Global styles (layout, header, footer).

css/categories.css → Category and book grid styling.

css/cart.css → Cart page styling.

 All frontend files interact with the backend API via Fetch API and use the JWT token from localStorage for authenticated requests.

