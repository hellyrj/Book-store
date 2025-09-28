class WishlistManager {
  constructor() {
    this.token = sessionStorage.getItem("token");
    this.user = JSON.parse(sessionStorage.getItem("user"));
    this.apiBase = "http://localhost:3000/api/wishlist";
    
    this.init();
  }

  async init() {
    // Check authentication
    if (!this.token || !this.user) {
      this.showLoginRequired();
      return;
    }

    await this.loadWishlist();
    this.setupEventListeners();
    this.updateUserInfo();
  }

  updateUserInfo() {
    const userInfoEl = document.getElementById("wishlist-user-info");
    if (userInfoEl && this.user) {
      userInfoEl.innerHTML = `
        <p><strong>User:</strong> ${this.user.name || "Guest"}</p>
        <p><strong>Email:</strong> ${this.user.email}</p>
      `;
    }
  }

  showLoginRequired() {
    document.getElementById('wishlist-grid').style.display = 'none';
    document.getElementById('empty-wishlist-message').style.display = 'none';
    document.getElementById('login-required-message').style.display = 'block';
  }

  showLoading() {
    document.getElementById("wishlist-grid").innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        Loading your wishlist...
      </div>
    `;
  }

  async loadWishlist() {
    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}`, {
        headers: { 
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load wishlist");
      }

      if (result.success) {
        this.displayWishlist(result.data);
        this.updateWishlistCount(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to load wishlist: " + error.message);
      this.showEmptyWishlist();
    }
  }

  updateWishlistCount(wishlistItems) {
    const totalItems = wishlistItems.length;
    document.getElementById('wishlist-count').textContent = totalItems;
    
    // Also update cart count
    this.updateCartCount();
  }

  async updateCartCount() {
    try {
      const response = await fetch("http://localhost:3000/api/orders/cart", {
        headers: { 
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const totalItems = result.data.reduce((total, item) => total + item.quantity, 0);
          document.getElementById('cart-count').textContent = totalItems;
        }
      }
    } catch (error) {
      console.error("Error updating cart count:", error);
    }
  }

  displayWishlist(items) {
    const grid = document.getElementById("wishlist-grid");
    const clearBtn = document.getElementById("clear-wishlist-btn");
    const emptyMessage = document.getElementById("empty-wishlist-message");
    
    if (!items || items.length === 0) {
      this.showEmptyWishlist();
      return;
    }

    grid.innerHTML = items.map(item => {
      const stockStatus = item.stock > 0 ? 'In Stock' : 'Out of Stock';
      const stockClass = item.stock > 0 ? 'stock-in' : 'stock-out';
      
      return `
        <div class="wishlist-item" data-id="${item.wishlist_id}">
          <div class="wishlist-item-cover">
            <img src="${item.cover_url || 'https://via.placeholder.com/300x200?text=No+Cover'}" 
                 alt="${item.title}" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Cover'">
          </div>
          <div class="wishlist-item-info">
            <h3 class="wishlist-item-title">${item.title}</h3>
            <p class="wishlist-item-author">By ${item.author}</p>
            <p class="wishlist-item-price">$${parseFloat(item.price).toFixed(2)}</p>
            
            <div class="wishlist-item-actions">
              <button class="btn-move-cart" data-id="${item.wishlist_id}" ${item.stock <= 0 ? 'disabled' : ''}>
                <i class="fas fa-cart-plus"></i>
                ${item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button class="btn-remove-wishlist" data-id="${item.wishlist_id}" title="Remove from wishlist">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            
            <div class="wishlist-item-meta">
              <span class="stock-status ${stockClass}">${stockStatus}</span>
              <span>Added: ${new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Show/hide elements
    grid.style.display = 'grid';
    clearBtn.style.display = 'block';
    emptyMessage.style.display = 'none';
    
    this.setupWishlistItemEvents();
  }

  showEmptyWishlist() {
    document.getElementById('wishlist-grid').style.display = 'none';
    document.getElementById('clear-wishlist-btn').style.display = 'none';
    document.getElementById('empty-wishlist-message').style.display = 'block';
    document.getElementById('wishlist-count').textContent = '0';
  }

  setupEventListeners() {
    // Clear wishlist button
    const clearWishlistBtn = document.getElementById("clear-wishlist-btn");
    if (clearWishlistBtn) {
      clearWishlistBtn.addEventListener("click", () => {
        this.clearWishlist();
      });
    }
  }

  setupWishlistItemEvents() {
    // Move to cart button events
    document.querySelectorAll(".btn-move-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        if (!btn.disabled) {
          this.moveToCart(e.currentTarget.dataset.id);
        }
      });
    });

    // Remove button events
    document.querySelectorAll(".btn-remove-wishlist").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.removeItem(e.currentTarget.dataset.id);
      });
    });
  }

  async moveToCart(wishlistId) {
    try {
      const button = document.querySelector(`.btn-move-cart[data-id="${wishlistId}"]`);
      const originalHTML = button.innerHTML;
      
      // Show loading state
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Moving...';
      button.disabled = true;

      const response = await fetch(`${this.apiBase}/${wishlistId}/move-to-cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({ quantity: 1 })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to move to cart");
      }

      if (result.success) {
        this.showNotification(result.message || "Book moved to cart successfully!", "success");
        
        // Reload wishlist to reflect changes
        await this.loadWishlist();
        
        // Update cart count
        await this.updateCartCount();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to move to cart: " + error.message);
      await this.loadWishlist(); // Reload to reset button states
    }
  }

  async removeItem(wishlistId) {
    if (!confirm("Are you sure you want to remove this book from your wishlist?")) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/${wishlistId}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${this.token}` 
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove item");
      }

      if (result.success) {
        this.showNotification(result.message || "Book removed from wishlist", "success");
        await this.loadWishlist();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to remove item: " + error.message);
    }
  }

  async clearWishlist() {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) {
      return;
    }

    try {
      // Get all wishlist items and remove them one by one
      const response = await fetch(`${this.apiBase}`, {
        headers: { 
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.success && result.data.length > 0) {
        for (const item of result.data) {
          await fetch(`${this.apiBase}/${item.wishlist_id}`, {
            method: "DELETE",
            headers: { 
              "Authorization": `Bearer ${this.token}` 
            }
          });
        }
        
        this.showNotification("Wishlist cleared successfully!", "success");
        await this.loadWishlist();
      } else {
        this.showEmptyWishlist();
      }
    } catch (error) {
      this.showError("Failed to clear wishlist: " + error.message);
    }
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotification = document.querySelector('.wishlist-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `wishlist-notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles for the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
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

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  showError(message) {
    this.showNotification(message, "error");
    console.error("Wishlist Error:", message);
  }
}

// Add CSS for notification animation
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
  
  .wishlist-notification.success {
    background: #28a745;
  }
  
  .wishlist-notification.error {
    background: #dc3545;
  }
  
  .wishlist-notification.info {
    background: #17a2b8;
  }
`;
document.head.appendChild(style);

// Initialize wishlist when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new WishlistManager();
});