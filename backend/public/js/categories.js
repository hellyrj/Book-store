// API base URL
const API_BASE = 'http://localhost:3000/api';

// DOM elements
const allCategoriesEl = document.getElementById('all-categories');
const booksTitleEl = document.getElementById('books-title');
const booksContainerEl = document.getElementById('books-container');
const backButtonEl = document.getElementById('back-to-categories');
const searchInputEl = document.getElementById('search-input');
const searchBtnEl = document.getElementById('search-btn');
const searchFilterEl = document.getElementById('search-filter');
const searchResultsInfoEl = document.getElementById('search-results-info');
const bookModalEl = document.getElementById('book-modal');
const bookDetailsEl = document.getElementById('book-details');
const closeModalEl = document.querySelector('.close-modal');
const categoriesSection = document.querySelector('.categories');
const menuToggleEl = document.getElementById('menuToggle');
const navOverlayEl = document.getElementById('navOverlay');
const mainNavEl = document.getElementById('mainNav');

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
    'health': 'fas fa-heartbeat'
};

// Current state
let currentCategoryId = null;
let currentCategoryName = null;
let isSearching = false;
let currentSearchTerm = '';

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchCategories();
    initSearch();
    initModal();
    initMobileMenu();
    
    // Check if user is logged in and update counts
    const token = sessionStorage.getItem("token");
    if (token) {
        updateCartCount();
        updateWishlistCount();
    }
});

// Mobile menu functionality
function initMobileMenu() {
    menuToggleEl.addEventListener('click', toggleMobileMenu);
    navOverlayEl.addEventListener('click', closeMobileMenu);
    
    // Close menu when clicking on nav links
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNavEl.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    menuToggleEl.classList.toggle('active');
    mainNavEl.classList.toggle('active');
    navOverlayEl.classList.toggle('active');
    document.body.style.overflow = mainNavEl.classList.contains('active') ? 'hidden' : 'auto';
}

function closeMobileMenu() {
    menuToggleEl.classList.remove('active');
    mainNavEl.classList.remove('active');
    navOverlayEl.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Search functionality
function initSearch() {
    // Search on button click
    searchBtnEl.addEventListener('click', performSearch);
    
    // Search on Enter key
    searchInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Real-time search with debounce
    searchInputEl.addEventListener('input', debounce(performSearch, 500));
    
    // Hide categories when search input is focused and has text
    searchInputEl.addEventListener('focus', () => {
        if (searchInputEl.value.trim()) {
            hideCategories();
        }
    });
    
    // Show categories when clicking outside search
    document.addEventListener('click', (e) => {
        if (!searchInputEl.contains(e.target) && !searchBtnEl.contains(e.target)) {
            if (!searchInputEl.value.trim() && isSearching) {
                showCategories();
                backToCategories();
            }
        }
    });
    
    // Clear search on escape key
    searchInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchInputEl.value.trim()) {
            searchInputEl.value = '';
            showCategories();
            backToCategories();
        }
    });
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    }
}

// Perform search
async function performSearch() {
    const searchTerm = searchInputEl.value.trim();
    const filter = searchFilterEl.value;
    
    if (!searchTerm) {
        isSearching = false;
        currentSearchTerm = '';
        searchResultsInfoEl.style.display = 'none';
        showCategories();
        backToCategories();
        return;
    }
    
    currentSearchTerm = searchTerm;
    isSearching = true;
    
    try {
        hideCategories();
        booksContainerEl.innerHTML = '<div class="spinner"></div>';
        booksTitleEl.textContent = `Search Results for "${searchTerm}"`;
        backButtonEl.style.display = 'flex';
        
        const response = await fetch(`${API_BASE}/categories/search?q=${encodeURIComponent(searchTerm)}&filter=${filter}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to search books`);
        }
        
        const books = await response.json();
        displayBooks(books);
        
        searchResultsInfoEl.textContent = `Found ${books.length} result(s) for "${searchTerm}" in ${getFilterText(filter)}`;
        searchResultsInfoEl.style.display = 'block';
        
        document.querySelector('.books').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error searching books:', error);
        booksContainerEl.innerHTML = `
            <div class="empty-state">
                <i>❌</i>
                <p>Failed to search books. Please try again later.</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
        searchResultsInfoEl.style.display = 'none';
        showCategories();
    }
}

function getFilterText(filter) {
    const filterMap = {
        'all': 'all fields',
        'title': 'title',
        'author': 'author',
        'category': 'category'
    };
    return filterMap[filter] || 'all fields';
}

// Hide categories section
function hideCategories() {
    if (categoriesSection) {
        categoriesSection.style.display = 'none';
    }
}

// Show categories section
function showCategories() {
    if (categoriesSection) {
        categoriesSection.style.display = 'block';
    }
}

// Fetch all categories
async function fetchCategories() {
    try {
        allCategoriesEl.innerHTML = '<div class="spinner"></div>';
        
        const response = await fetch(`${API_BASE}/categories`);
        if (!response.ok) {
            throw new Error('Failed to fetch categories');
        }
        
        const categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        allCategoriesEl.innerHTML = `
            <div class="empty-state">
                <i>❌</i>
                <p>Failed to load categories. Please try again later.</p>
            </div>
        `;
    }
}

// Get icon for category
function getCategoryIcon(categoryName) {
    const lowerName = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
        if (lowerName.includes(key)) {
            return icon;
        }
    }
    // Default icon if no match found
    return 'fas fa-book';
}

// Display categories in the grid
function displayCategories(categories) {
    if (categories.length === 0) {
        allCategoriesEl.innerHTML = `
            <div class="empty-state">
                <i>📚</i>
                <p>No categories found.</p>
            </div>
        `;
        return;
    }

    allCategoriesEl.innerHTML = categories.map(category => `
        <div class="category-card" data-category-id="${category.category_id}" data-category-name="${category.name}">
            <div class="category-icon">
                <i class="${getCategoryIcon(category.name)}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description || 'No description available.'}</p>
            <span class="book-count">View Books</span>
        </div>
    `).join('');

    // Add click event listeners to category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.getAttribute('data-category-id');
            const categoryName = card.getAttribute('data-category-name');
            loadCategoryBooks(categoryId, categoryName);
        });
    });
}

// Fetch books for a specific category
async function fetchCategoryBooks(categoryId) {
    try {
        const response = await fetch(`${API_BASE}/categories/${categoryId}/books`);
        if (!response.ok) {
            throw new Error('Failed to fetch books for this category');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching category books:', error);
        return [];
    }
}

// Load and display books for selected category
async function loadCategoryBooks(categoryId, categoryName) {
    currentCategoryId = categoryId;
    currentCategoryName = categoryName;
    
    booksTitleEl.textContent = `Books in ${categoryName}`;
    backButtonEl.style.display = 'flex';
    booksContainerEl.innerHTML = '<div class="spinner"></div>';
    
    document.querySelector('.books').scrollIntoView({ behavior: 'smooth' });
    
    const books = await fetchCategoryBooks(categoryId);
    displayBooks(books);
}

// Display books in the grid
function displayBooks(books) {
    if (books.length === 0) {
        booksContainerEl.innerHTML = `
            <div class="empty-state">
                <i>📚</i>
                <p>No books found ${isSearching ? 'matching your search' : 'in this category'}.</p>
            </div>
        `;
        return;
    }

    booksContainerEl.innerHTML = books.map(book => `
        <div class="book-card" data-book-id="${book.book_id}">
            <div class="book-cover">
                <img src="${book.cover_url || 'https://via.placeholder.com/200x300?text=No+Cover'}" 
                     alt="${book.title}" 
                     onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
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

    // Add event listeners to book cards for details view
    document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart') && !e.target.closest('.add-to-wishlist')) {
                const bookId = card.getAttribute('data-book-id');
                showBookDetails(bookId);
            }
        });
    });

    // Add event listeners to Add to Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
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

    // Add event listeners to Add to Wishlist buttons
    document.querySelectorAll('.add-to-wishlist').forEach(button => {
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

// Fetch book details
async function fetchBookDetails(bookId) {
    try {
        const response = await fetch(`${API_BASE}/categories/books/${bookId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch book details');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching book details:', error);
        throw error;
    }
}

// Show book details modal
async function showBookDetails(bookId) {
    try {
        bookDetailsEl.innerHTML = '<div class="spinner"></div>';
        bookModalEl.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        const book = await fetchBookDetails(bookId);
        
        bookDetailsEl.innerHTML = `
            <div class="book-details-container">
                <div class="book-details-cover">
                    <img src="${book.cover_url || 'https://via.placeholder.com/300x450?text=No+Cover'}" 
                         alt="${book.title}"
                         onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                </div>
                <div class="book-details-info">
                    <h2>${book.title}</h2>
                    <p class="book-author">By ${book.author}</p>
                    <p class="book-category">Category: ${book.category_name || 'Unknown'}</p>
                    <p class="book-isbn">ISBN: ${book.isbn || 'N/A'}</p>
                    <p class="book-description">${book.description || 'No description available.'}</p>
                    <div class="book-price-section">
                        <span class="book-price">$${book.price ? parseFloat(book.price).toFixed(2) : '0.00'}</span>
                        <div class="book-actions">
                            <button class="add-to-cart-details" data-book-id="${book.book_id}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            <button class="add-to-wishlist-details" data-book-id="${book.book_id}">
                                <i class="fas fa-heart"></i> Add to Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners for modal buttons
        document.querySelector('.add-to-cart-details').addEventListener('click', (e) => {
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!token || !user) {
                alert("Please login to add items to your cart");
                window.location.href = "login.html";
                return;
            }
            addToCart(bookId);
            closeModal();
        });
        
        document.querySelector('.add-to-wishlist-details').addEventListener('click', (e) => {
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));

            if (!token || !user) {
                alert("Please login to add items to your wishlist");
                window.location.href = "login.html";
                return;
            }
            addToWishlist(bookId, e.target.closest('button'));
            closeModal();
        });
        
    } catch (error) {
        bookDetailsEl.innerHTML = `
            <div class="empty-state">
                <i>❌</i>
                <p>Failed to load book details. Please try again.</p>
            </div>
        `;
    }
}

// Modal functionality
function initModal() {
    closeModalEl.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === bookModalEl) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bookModalEl.style.display === 'block') {
            closeModal();
        }
    });
}

function closeModal() {
    bookModalEl.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Back to categories view
function backToCategories() {
    currentCategoryId = null;
    currentCategoryName = null;
    isSearching = false;
    currentSearchTerm = '';
    booksTitleEl.textContent = 'Books';
    backButtonEl.style.display = 'none';
    booksContainerEl.innerHTML = '';
    searchResultsInfoEl.style.display = 'none';
    searchInputEl.value = '';
    
    showCategories();
    document.querySelector('.categories').scrollIntoView({ behavior: 'smooth' });
}

// Event listener for back button
backButtonEl.addEventListener('click', (e) => {
    e.preventDefault();
    backToCategories();
});

// Add to wishlist function
async function addToWishlist(bookId, button) {
    try {
        const token = sessionStorage.getItem("token");
        
        // Show loading state
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

// Update wishlist count
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

// Add to cart function
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
                button.innerHTML = originalText;
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

// Update cart count
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

// Show notification function
function showNotification(message, type = "info") {
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 15px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for animations and category icons
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .cart-notification.success {
        background: #28a745;
    }
    
    .cart-notification.error {
        background: #dc3545;
    }
    
    .cart-notification.info {
        background: #17a2b8;
    }
    
    /* Category Icons */
    .category-icon {
        font-size: 3rem;
        color: var(--gold);
        margin-bottom: 16px;
        transition: var(--transition);
    }
    
    .category-card:hover .category-icon {
        transform: scale(1.1) rotate(5deg);
        color: var(--gold-light);
    }
    
    /* Modal Styles */
    .modal {
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    }
    
    .modal-content {
        background-color: white;
        margin: 2% auto;
        padding: 0;
        border-radius: 15px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    
    .close-modal {
        position: absolute;
        right: 20px;
        top: 15px;
        font-size: 2rem;
        font-weight: bold;
        color: #aaa;
        cursor: pointer;
        z-index: 10;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    
    .close-modal:hover {
        color: #333;
        background: #f8f9fa;
    }
    
    .book-details-container {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 2rem;
        padding: 2rem;
    }
    
    .book-details-cover img {
        width: 100%;
        height: auto;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    .book-details-info h2 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        color: #333;
    }
    
    .book-author {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 1rem;
    }
    
    .book-category, .book-isbn {
        color: #777;
        margin-bottom: 0.5rem;
    }
    
    .book-description {
        line-height: 1.6;
        margin: 1.5rem 0;
        color: #555;
    }
    
    .book-price-section {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 2px solid #e9ecef;
    }
    
    .book-price {
        font-size: 2rem;
        font-weight: bold;
        color: #28a745;
        display: block;
        margin-bottom: 1.5rem;
    }
    
    .book-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .add-to-cart-details, .add-to-wishlist-details {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .add-to-cart-details {
        background: #007bff;
        color: white;
    }
    
    .add-to-cart-details:hover {
        background: #0056b3;
    }
    
    .add-to-wishlist-details {
        background: #f8f9fa;
        color: #333;
        border: 2px solid #e9ecef;
    }
    
    .add-to-wishlist-details:hover {
        background: #e9ecef;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
        .book-details-container {
            grid-template-columns: 1fr;
            text-align: center;
        }
        
        .book-details-cover img {
            max-width: 250px;
            margin: 0 auto;
        }
    }
`;
document.head.appendChild(style);