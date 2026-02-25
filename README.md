
# CozyReads Online Bookstore 📚
LIVE VIEW: https://book-store-7ttu.onrender.com

A full-stack online bookstore application built with Node.js/Express backend and vanilla JavaScript frontend. Features include user authentication, book browsing, shopping cart, wishlist, order management, and comprehensive admin dashboard.

## ✨ Features

### 🛒 Shopping Experience
- **Book Browsing** - Browse books by categories with search functionality
- **Shopping Cart** - Add, update, and remove items with real-time stock validation
- **Wishlist** - Save books for later and move to cart with one click
- **Order Management** - Track order status and view order history

### 👤 User Features
- **User Authentication** - Secure registration/login with JWT tokens
- **Guest Checkout** - Option to checkout without registration
- **Review System** - Submit and view book reviews (with admin moderation)
- **Profile Management** - Personal information and order tracking

### 🛠️ Admin Dashboard
- **Book Inventory** - CRUD operations for book management
- **Order Processing** - Manage and update order status
- **Payment Verification** - Review payment screenshots for orders
- **User Management** - View all users and their statistics
- **Review Moderation** - Approve or reject user-submitted reviews

### 💳 Payment Options
- **Screenshot Verification** - Upload payment proof for admin verification
- **Cash on Delivery** - Traditional payment method with status tracking

## 🏗️ Architecture

```
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
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/hellyrj/bookstore.git
cd bookstore/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Create PostgreSQL database
createdb booknest

# Copy environment variables
cp .env.example .env
```

4. **Configure environment variables**
```env
# Edit .env file with your credentials
DATABASE_URL=postgresql://username:password@localhost:5432/booknest
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_API_KEY=your_admin_api_key_here
```

5. **Initialize the database**
```bash
# Create tables
node src/models/initTables.js

# Seed admin user
node src/models/seedAdmin.js

# Seed categories
node src/scripts/seedCategories.js

# Populate with sample books (optional)
node src/scripts/fetchBooks.js
```

6. **Start the development server**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

## 📖 API Documentation

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register` | User registration | No |
| POST | `/api/users/login` | User login | No |

### Book Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/books` | Get all books | No |
| GET | `/api/books/:id` | Get book by ID | No |
| POST | `/api/books` | Add new book | Admin |
| PUT | `/api/books/:id` | Update book | Admin |

### Order & Cart Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/orders/cart` | Get user cart | User |
| POST | `/api/orders/cart` | Add to cart | User |
| POST | `/api/orders/checkout` | Create order | User |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/orders` | All orders with user details | Admin |
| GET | `/api/admin/users` | All users with statistics | Admin |
| GET | `/api/admin/stats` | Dashboard statistics | Admin |

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and authentication
- **books** - Book inventory and details
- **categories** - Book categorization
- **orders** - Order information
- **order_items** - Individual items in orders
- **cart_items** - User shopping carts
- **wishlist** - User wishlists
- **reviews** - Book reviews and ratings

### Relationships
- Users → Orders (One-to-Many)
- Orders → Order Items (One-to-Many)
- Books → Categories (Many-to-One)
- Users → Cart Items (One-to-Many)

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: Warm, book-themed colors
- **Accents**: Complementary action colors
- **Neutral**: Clean backgrounds and text colors

### Typography
- **Headings**: Playfair Display
- **Body Text**: Merriweather
- **Icons**: Font Awesome 6.4.0

### Responsive Design
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Features

- **JWT Authentication** with token expiration
- **Password Hashing** using bcrypt (10 rounds)
- **Role-Based Access Control** (User/Admin)
- **Input Sanitization** on all endpoints
- **SQL Injection Prevention** with parameterized queries
- **CORS Configuration** for API security

## 📱 Features

### Mobile-First Design
- Responsive navigation with hamburger menu
- Touch-friendly interface elements
- Optimized mobile layouts

### Performance Optimizations
- Image lazy loading
- Debounced search inputs
- Efficient database queries
- Minified CSS and JavaScript

## 🚀 Deployment

### Production Setup
1. Set environment variables:
```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
```

2. Install production dependencies:
```bash
npm install --production
```

3. Start the server:
```bash
npm start
```

### Deployment Considerations
- Use HTTPS for all communications
- Implement proper logging and monitoring
- Set up database backups
- Configure environment variables securely
- Consider using a process manager (PM2)

## 🧪 Testing

### Manual Testing Checklist
1. **User Registration & Login**
2. **Book Browsing & Search**
3. **Shopping Cart Operations**
4. **Checkout Process**
5. **Order Tracking**
6. **Admin Dashboard Functions**
7. **Payment Verification Flow**

### Edge Cases Tested
- Out-of-stock scenarios
- Payment verification failures
- Network error handling
- Form validation errors
- Concurrent cart updates

## 🔧 Development

### Project Structure
```
public/
├── css/           # Stylesheets
├── js/            # Frontend JavaScript
├── images/        # Static assets
└── *.html         # Application pages

src/
├── middleware/    # Authentication middleware
├── models/        # Database models
├── routes/        # API routes
└── scripts/       # Data utilities
```

### Scripts Available
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- Database seeding and population scripts

## 🔮 Future Enhancements

### Planned Features
- [ ] Payment Gateway Integration (Stripe/PayPal)
- [ ] Advanced Search with Elasticsearch
- [ ] Book Recommendation Engine
- [ ] Social Features (Reading lists, sharing)
- [ ] Mobile Application (React Native)
- [ ] Multi-language Support
- [ ] Real-time Chat Support

### Technical Improvements
- [ ] WebSocket Integration for real-time updates
- [ ] Redis Caching Layer
- [ ] Microservices Architecture
- [ ] Automated Testing Suite
- [ ] CI/CD Pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 👥 Authors

- **Hilina Hussien** - *Initial work* - [hellyrj](https://github.com/hellyrj)

## 🙏 Acknowledgments

- Icons by [Font Awesome](https://fontawesome.com/)
- Google Books API for sample data
- All contributors and testers

## 📞 Support

For support, email [hellyhussein1@gmail.com] or open an issue in the GitHub repository.

---

⭐ **Star this repo if you found it useful!**
```

This README.md file includes:

1. **Badges** for quick visual indicators
2. **Clear feature overview** in sections
3. **Step-by-step installation** with code blocks
4. **API documentation** in table format
5. **Database schema** explanation
6. **Security features** highlighted
7. **Deployment guide** for production
8. **Future roadmap** for development
9. **Contributing guidelines**





