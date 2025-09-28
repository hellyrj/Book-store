// public/script.js
const API_BASE = '/api';

let currentUser = null;

// Show/hide sections
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    
    if (sectionId === 'books') loadBooks();
    if (sectionId === 'categories') loadCategories();
    if (sectionId === 'orders') loadOrders();
}

// Check if user is logged in
function checkAuth() {
    const token = sessionStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = {
                id: payload.user_id,
                email: payload.email,
                role: payload.role
            };
            
            document.getElementById('loginLink').style.display = 'none';
            document.getElementById('registerLink').style.display = 'none';
            document.getElementById('ordersLink').style.display = 'inline';
            document.getElementById('logoutLink').style.display = 'inline';
        } catch (e) {
            console.error('Invalid token');
            sessionStorage.removeItem('token');
        }
    }
}

// Logout function
function logout() {
    sessionStorage.removeItem('token');
    currentUser = null;
    document.getElementById('loginLink').style.display = 'inline';
    document.getElementById('registerLink').style.display = 'inline';
    document.getElementById('ordersLink').style.display = 'none';
    document.getElementById('logoutLink').style.display = 'none';
    showSection('books');
}

// Load books
async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE}/books`);
        const books = await response.json();
        
        const booksList = document.getElementById('booksList');
        booksList.innerHTML = books.map(book => `
            <div class="book-card">
                <h3>${book.title}</h3>
                <p>Author: ${book.author}</p>
                <p>Price: $${book.price}</p>
                <p>Stock: ${book.stock}</p>
                ${currentUser ? `<button onclick="addToOrder(${book.book_id})">Add to Order</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const categories = await response.json();
        
        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = categories.map(category => `
            <div class="category-card">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <button onclick="loadCategoryBooks(${category.category_id})">View Books</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load orders
async function loadOrders() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });
        const orders = await response.json();
        
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = orders.length ? orders.map(order => `
            <div class="order-card">
                <h3>Order #${order.order_id}</h3>
                <p>Status: ${order.status}</p>
                <p>Total: $${order.total_price}</p>
                <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
            </div>
        `).join('') : '<p>No orders found</p>';
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Add to order
async function addToOrder(bookId) {
    if (!currentUser) {
        alert('Please login to place an order');
        showSection('login');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: JSON.stringify({
                book_id: bookId,
                quantity: 1
            })
        });
        
        if (response.ok) {
            alert('Book added to order successfully!');
        } else {
            alert('Error adding book to order');
        }
    } catch (error) {
        console.error('Error adding to order:', error);
    }
}

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            sessionStorage.setItem('token', data.token);
            checkAuth();
            showSection('books');
            alert('Login successful!');
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
});

// Register form handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    try {
        const response = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            showSection('login');
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadBooks();
});