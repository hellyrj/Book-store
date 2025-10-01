// Mobile Menu Toggle for Orders Page
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    new OrderManager();
});

// Mobile menu functionality
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
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : 'auto';
    });

    // Close menu when clicking overlay
    navOverlay.addEventListener('click', function() {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
        this.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('active')) {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

class OrderManager {
    constructor() {
        this.token = sessionStorage.getItem("token");
        this.user = JSON.parse(sessionStorage.getItem("user"));
        this.apiBase = "http://localhost:3000/api/orders";
        
        this.init();
    }

    async init() {
        // Check authentication
        if (!this.token || !this.user) {
            this.showLoginRequired();
            return;
        }

        await this.loadOrders();
        this.updateCartWishlistCounts();
        this.startAutoRefresh();
    }

    // Update cart and wishlist counts
    async updateCartWishlistCounts() {
        try {
            const baseUrl = this.apiBase.replace('/orders', '');
            
            // Update cart count
            const cartResponse = await fetch(`${baseUrl}/orders/cart`, {
                headers: { 
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            });

            if (cartResponse.ok) {
                const cartResult = await cartResponse.json();
                if (cartResult.success) {
                    const totalItems = cartResult.data.reduce((total, item) => total + item.quantity, 0);
                    const cartCountElement = document.getElementById('cart-count');
                    if (cartCountElement) {
                        cartCountElement.textContent = totalItems;
                    }
                }
            }

            // Update wishlist count
            const wishlistResponse = await fetch(`${baseUrl}/wishlist`, {
                headers: { 
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            });

            if (wishlistResponse.ok) {
                const wishlistResult = await wishlistResponse.json();
                if (wishlistResult.success) {
                    const wishlistCountElement = document.getElementById('wishlist-count');
                    if (wishlistCountElement) {
                        wishlistCountElement.textContent = wishlistResult.data.length;
                    }
                }
            }
        } catch (error) {
            console.error("Error updating counts:", error);
        }
    }

    showLoginRequired() {
        const container = document.getElementById('orders-container');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Login Required</h2>
                <p>Please log in to view your orders.</p>
                <a href="login.html" class="btn">
                    <i class="fas fa-sign-in-alt"></i> Login Now
                </a>
            </div>
        `;
    }

    async loadOrders() {
        const container = document.getElementById('orders-container');
        
        try {
            // Show loading state
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    Loading your orders...
                </div>
            `;

            const response = await fetch(`${this.apiBase}`, {
                headers: { 
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to load orders");
            }

            if (result.success) {
                this.displayOrders(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showError("Failed to load orders: " + error.message);
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('orders-container');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <h2>No Orders Yet</h2>
                    <p>You haven't placed any orders yet.</p>
                    <a href="categories.html" class="btn">
                        <i class="fas fa-book"></i> Start Shopping
                    </a>
                </div>
            `;
            return;
        }

        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        container.innerHTML = orders.map(order => {
            const statusClass = `status-${order.status}`;
            const statusText = this.getStatusText(order.status);
            const verificationMessage = this.getVerificationMessage(order);
            const lastUpdated = order.updated_at !== order.created_at ? 
                new Date(order.updated_at).toLocaleString() : null;
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <h3>Order #${order.order_id}</h3>
                            <p class="order-date">Placed on ${new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        <div class="order-header-right">
                            <div class="order-status ${statusClass}">${statusText}</div>
                            <div class="order-price">$${parseFloat(order.total_price).toFixed(2)}</div>
                        </div>
                    </div>
                    
                    ${verificationMessage ? `
                        <div class="verification-message">
                            <i class="fas fa-info-circle"></i> ${verificationMessage}
                        </div>
                    ` : ''}
                    
                    <div class="order-details">
                        <div class="shipping-info">
                            <h4>Shipping Information</h4>
                            <p><strong>Name:</strong> ${order.full_name}</p>
                            <p><strong>Phone:</strong> ${order.phone_number}</p>
                            <p><strong>Address:</strong> ${order.shipping_address}</p>
                            <p><strong>City:</strong> ${order.city}${order.zip_code ? `, ${order.zip_code}` : ''}</p>
                            <p><strong>Payment Method:</strong> ${order.payment_method === 'screenshot' ? 'Bank Transfer' : 'Cash on Delivery'}</p>
                        </div>
                        
                        <div class="order-items-section">
                            <h4>Order Items</h4>
                            <div class="order-items">
                                ${order.items && order.items.length > 0 ? 
                                    order.items.map(item => `
                                        <div class="order-item">
                                            <span>${item.title} by ${item.author}</span>
                                            <span>${item.quantity} x $${parseFloat(item.price).toFixed(2)}</span>
                                        </div>
                                    `).join('') : 
                                    '<p class="no-items">No items found</p>'
                                }
                            </div>
                        </div>
                    </div>
                    
                    ${lastUpdated ? `
                        <div class="order-update">
                            <i class="fas fa-sync-alt"></i> Last updated: ${lastUpdated}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'pending_verification': 'Pending Verification',
            'paid': 'Payment Verified',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled',
            'payment_rejected': 'Payment Rejected'
        };
        return statusMap[status] || status;
    }

    getVerificationMessage(order) {
        switch(order.status) {
            case 'pending_verification':
                return 'Your payment is being verified. We will notify you once verified.';
            case 'paid':
                return 'Your payment has been verified! Your order is now being processed.';
            case 'payment_rejected':
                return 'Your payment could not be verified. Please contact support or try again.';
            case 'processing':
                return 'Your order is being processed and will be shipped soon.';
            case 'shipped':
                return 'Your order has been shipped!';
            case 'delivered':
                return 'Your order has been delivered!';
            default:
                return '';
        }
    }

    startAutoRefresh() {
        // Refresh orders every 30 seconds for status updates
        setInterval(() => {
            if (this.token && this.user) {
                this.loadOrders();
                this.updateCartWishlistCounts();
            }
        }, 30000);
    }

    showError(message) {
        const container = document.getElementById('orders-container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Orders</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Utility function to handle page refresh
function refreshPage() {
    location.reload();
}