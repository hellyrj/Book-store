// API base URL
const API_BASE = 'http://localhost:3000/api';

// DOM elements
const homeCategoriesEl = document.getElementById('home-categories');
const bestsellerBooksEl = document.getElementById('bestseller-books');
const featuredBooksEl = document.getElementById('featured-books');

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();
    loadHomePageData();
    
    // Check if user is logged in and update counts
    const token = sessionStorage.getItem("token");
    if (token) {
        updateCartCount();
        updateWishlistCount();
    }
});

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');

    if (!menuToggle || !mainNav || !navOverlay) {
        console.error('Mobile menu elements not found');
        return;
    }

    menuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        mainNav.classList.toggle('active');
        navOverlay.classList.toggle('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking overlay
    navOverlay.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        this.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// Load all home page data
async function loadHomePageData() {
    try {
        await Promise.all([
            loadBestsellerBooks(),
            loadPopularCategories()
        ]);
    } catch (error) {
        console.error('Error loading home page data:', error);
        showError('Failed to load home page content. Please try again later.');
    }
}

// Load bestseller books
async function loadBestsellerBooks() {
    try {
        bestsellerBooksEl.innerHTML = '<div class="spinner"></div>';
        
        // First, find the "Bestseller" category
        const categoriesResponse = await fetch(`${API_BASE}/categories`);
        if (!categoriesResponse.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const categories = await categoriesResponse.json();
        const bestsellerCategory = categories.find(cat => 
            cat.name.toLowerCase().includes('bestseller') || 
            cat.name.toLowerCase().includes('best seller') ||
            cat.name.toLowerCase().includes('popular')
        );
        
        if (bestsellerCategory) {
            // Fetch books from the bestseller category
            const booksResponse = await fetch(`${API_BASE}/categories/${bestsellerCategory.category_id}/books`);
            if (booksResponse.ok) {
                const books = await booksResponse.json();
                displayBooksSection(books, bestsellerBooksEl, 'bestseller');
                return;
            }
        }
        
        // Fallback: get all books and use first 8 as bestsellers
        const allBooksResponse = await fetch(`${API_BASE}/books`);
        if (allBooksResponse.ok) {
            const allBooks = await allBooksResponse.json();
            const bestsellerBooks = allBooks.slice(0, 8);
            displayBooksSection(bestsellerBooks, bestsellerBooksEl, 'bestseller');
        } else {
            throw new Error('No books available');
        }
        
    } catch (error) {
        console.error('Error loading bestseller books:', error);
        bestsellerBooksEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No bestseller books available at the moment.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
}

// Load popular categories for home page (4-5 categories)
async function loadPopularCategories() {
    try {
        homeCategoriesEl.innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(`${API_BASE}/categories`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const categories = await response.json();
        
        // Show 4-5 categories (or all if less than 5)
        const categoriesToShow = categories.slice(0, 5);
        displayHomeCategories(categoriesToShow);
        
    } catch (error) {
        console.error('Error loading categories:', error);
        homeCategoriesEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>Failed to load categories. Please try again later.</p>
            </div>
        `;
    }
}

// Display categories on home page
function displayHomeCategories(categories) {
    if (categories.length === 0) {
        homeCategoriesEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No categories found.</p>
            </div>
        `;
        return;
    }

    // Category icons mapping
    const categoryIcons = {
        'fiction': 'fas fa-feather',
        'science fiction': 'fas fa-rocket',
        'mystery': 'fas fa-user-secret',
        'romance': 'fas fa-heart',
        'thriller': 'fas fa-mask',
        'biography': 'fas fa-user',
        'history': 'fas fa-landmark',
        'science': 'fas fa-flask',
        'technology': 'fas fa-laptop-code',
        'business': 'fas fa-chart-line',
        'fantasy': 'fas fa-dragon',
        'horror': 'fas fa-ghost',
        'children': 'fas fa-child',
        'young adult': 'fas fa-users',
        'cookbooks': 'fas fa-utensils',
        'travel': 'fas fa-plane',
        'art': 'fas fa-palette',
        'music': 'fas fa-music',
        'sports': 'fas fa-running',
        'health': 'fas fa-heartbeat',
        'bestseller': 'fas fa-star',
        'best seller': 'fas fa-star',
        'popular': 'fas fa-fire'
    };

    homeCategoriesEl.innerHTML = categories.map(category => {
        const categoryNameLower = category.name.toLowerCase();
        let iconClass = 'fas fa-book';
        
        // Find matching icon
        for (const [key, value] of Object.entries(categoryIcons)) {
            if (categoryNameLower.includes(key)) {
                iconClass = value;
                break;
            }
        }
        
        return `
            <div class="category-card animate" data-category-id="${category.category_id}">
                <div class="category-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'Explore our collection of ' + category.name + ' books'}</p>
                    <span class="book-count">Browse Collection</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click event listeners to category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.getAttribute('data-category-id');
            // Redirect to categories page with the specific category
            window.location.href = `categories.html?category=${categoryId}`;
        });
    });
}

// Display books in a section
function displayBooksSection(books, containerEl, type) {
    if (books.length === 0) {
        containerEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>No ${type} books found.</p>
            </div>
        `;
        return;
    }

    containerEl.innerHTML = books.map(book => `
        <div class="book-card animate" data-book-id="${book.book_id}">
            <div class="book-cover">
                <img src="${book.cover_url || 'https://via.placeholder.com/200x300/4a5568/ffffff?text=No+Cover'}" 
                     alt="${book.title}" 
                     onerror="this.src='https://via.placeholder.com/200x300/4a5568/ffffff?text=No+Cover'">
                ${type === 'bestseller' ? '<div class="bestseller-badge">Bestseller</div>' : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">By ${book.author}</p>
                <p class="book-price">$${book.price ? parseFloat(book.price).toFixed(2) : '0.00'}</p>
                <div class="book-actions">
                    <button class="add-to-cart" data-book-id="${book.book_id}">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="add-to-wishlist" data-book-id="${book.book_id}" title="Add to Wishlist">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Add event listeners
    addBookEventListeners(containerEl);
}

// Add event listeners to book cards
function addBookEventListeners(container) {
    // Book card click for details
    container.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart') && !e.target.closest('.add-to-wishlist')) {
                const bookId = card.getAttribute('data-book-id');
                showBookQuickView(bookId);
            }
        });
    });

    // Add to cart buttons
    container.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = button.getAttribute('data-book-id');
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!token || !user) {
                alert("Please login to add items to your cart");
                window.location.href = "login.html";
                return;
            }
            addToCart(bookId);
        });
    });

    // Add to wishlist buttons
    container.querySelectorAll('.add-to-wishlist').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const bookId = button.getAttribute('data-book-id');
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!token || !user) {
                alert("Please login to add items to your wishlist");
                window.location.href = "login.html";
                return;
            }
            addToWishlist(bookId, button);
        });
    });
}

// Quick view for books
async function showBookQuickView(bookId) {
    try {
        const response = await fetch(`${API_BASE}/categories/books/${bookId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch book details');
        }
        
        const book = await response.json();
        
        // Create a simple modal for quick view
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="quick-view-content" style="
                background: white;
                padding: 2rem;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <button class="close-quick-view" style="
                    float: right;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--brown);
                ">&times;</button>
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <img src="${book.cover_url || 'https://via.placeholder.com/150x225'}" 
                         alt="${book.title}" 
                         style="width: 150px; height: auto; border-radius: 5px;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--charcoal);">${book.title}</h3>
                        <p style="color: var(--brown); margin: 0 0 0.5rem 0; font-weight: 600;">By ${book.author}</p>
                        <p style="font-size: 1.5rem; font-weight: bold; color: var(--brown);">$${book.price ? parseFloat(book.price).toFixed(2) : '0.00'}</p>
                    </div>
                </div>
                <p style="color: var(--charcoal); line-height: 1.6;">${book.description || 'No description available.'}</p>
                <div style="margin-top: 1rem;">
                    <button class="add-to-cart-quick" data-book-id="${book.book_id}" style="
                        background: var(--brown);
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-right: 0.5rem;
                        font-weight: 600;
                    ">Add to Cart</button>
                    <button class="view-details" onclick="window.location.href='book-details.html?id=${book.book_id}'" style="
                        background: var(--beige);
                        color: var(--brown);
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                    ">View Details</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal events
        modal.querySelector('.close-quick-view').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add to cart from quick view
        modal.querySelector('.add-to-cart-quick').addEventListener('click', (e) => {
            e.stopPropagation();
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!token || !user) {
                alert("Please login to add items to your cart");
                window.location.href = "login.html";
                return;
            }
            addToCart(bookId);
            document.body.removeChild(modal);
        });
        
    } catch (error) {
        console.error('Error showing quick view:', error);
        alert('Failed to load book details');
    }
}

// Cart and Wishlist functions
async function addToCart(bookId) {
    try {
        const token = sessionStorage.getItem("token");
        const button = document.querySelector(`.add-to-cart[data-book-id="${bookId}"]`);
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        button.disabled = true;

        const response = await fetch(`${API_BASE}/orders/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                book_id: parseInt(bookId), 
                quantity: 1 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to add to cart");
        }

        if (result.success) {
            button.innerHTML = '<i class="fas fa-check"></i> Added!';
            button.style.background = "#28a745";
            
            updateCartCount();
            showNotification(result.message || "Book added to cart successfully!", "success");
            
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                button.style.background = "";
                button.disabled = false;
            }, 2000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        const button = document.querySelector(`.add-to-cart[data-book-id="${bookId}"]`);
        button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
        button.disabled = false;
        showNotification("Failed to add book to cart: " + error.message, "error");
    }
}

async function addToWishlist(bookId, button) {
    try {
        const token = sessionStorage.getItem("token");
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;

        const response = await fetch(`${API_BASE}/wishlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ book_id: parseInt(bookId) })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to add to wishlist");
        }

        if (result.success) {
            button.innerHTML = '<i class="fas fa-heart" style="color: #e74c3c;"></i>';
            button.style.background = "#f8f9fa";
            
            showNotification(result.message || "Book added to wishlist!", "success");
            updateWishlistCount();
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = "";
                button.disabled = false;
            }, 3000);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        button.innerHTML = '<i class="fas fa-heart"></i>';
        button.disabled = false;
        showNotification("Failed to add to wishlist: " + error.message, "error");
    }
}

async function updateCartCount() {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE}/orders/cart`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const totalItems = result.data.reduce((total, item) => total + item.quantity, 0);
                const cartCountElement = document.getElementById('cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = totalItems;
                }
            }
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}

async function updateWishlistCount() {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE}/wishlist`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                const wishlistCountElement = document.getElementById('wishlist-count');
                if (wishlistCountElement) {
                    wishlistCountElement.textContent = result.data.length;
                }
            }
        }
    } catch (error) {
        console.error("Error updating wishlist count:", error);
    }
}

function showNotification(message, type = "info") {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">&times;</button>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 1rem;
        margin: 1rem;
        border: 1px solid #f5c6cb;
        border-radius: 5px;
        text-align: center;
    `;
    errorDiv.textContent = message;
    document.querySelector('main').prepend(errorDiv);
}