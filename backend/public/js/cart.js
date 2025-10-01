class CartManager {
  constructor() {
    this.token = sessionStorage.getItem("token");
    this.user = JSON.parse(sessionStorage.getItem("user"));
    this.apiBase = "http://localhost:3000/api/orders";
    
    this.init();
  }

  async init() {
    // Initialize mobile menu
    this.initMobileMenu();
    
    // Check authentication
    if (!this.token || !this.user) {
      this.showLoginRequired();
      return;
    }

    await this.loadCart();
    this.setupEventListeners();
  }

  // Mobile Menu Toggle Functionality
  initMobileMenu() {
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

  showLoginRequired() {
    document.getElementById('cart-table-body').style.display = 'none';
    document.getElementById('cart-summary').style.display = 'none';
    document.getElementById('empty-cart-message').style.display = 'none';
    document.getElementById('login-required-message').style.display = 'block';
  }

  showLoading() {
    document.getElementById("cart-table-body").innerHTML = `
      <tr>
        <td colspan="7" class="loading">
          <div class="spinner"></div>
          Loading your cart...
        </td>
      </tr>
    `;
  }

  async loadCart() {
    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/cart`, {
        headers: { 
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load cart");
      }

      if (result.success) {
        this.displayCart(result.data);
        this.updateCartCount(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to load cart: " + error.message);
      this.showEmptyCart();
    }
  }

  updateCartCount(cartItems) {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
  }

  displayCart(items) {
    const tbody = document.getElementById("cart-table-body");
    const totalEl = document.getElementById("cart-total");
    const cartSummary = document.getElementById("cart-summary");
    const emptyMessage = document.getElementById("empty-cart-message");
    const clearCartBtn = document.getElementById("clear-cart-btn");
    
    if (!items || items.length === 0) {
      this.showEmptyCart();
      return;
    }

    let total = 0;
    tbody.innerHTML = items.map(item => {
      const itemTotal = item.quantity * parseFloat(item.price);
      total += itemTotal;
      
      // Determine stock status
      const stockStatus = this.getStockStatus(item.stock, item.quantity);
      const stockClass = stockStatus.includes('In Stock') ? 'stock-in' : 'stock-out';
      const stockIcon = stockStatus.includes('In Stock') ? 'fa-check-circle' : 'fa-times-circle';

      return `
        <tr class="cart-item" data-id="${item.cart_item_id}">
          <td class="book-cover">
            <img src="${item.cover_url || 'images/no-cover.png'}" 
                 alt="${item.title}" 
                 onerror="this.src='images/no-cover.png'">
          </td>
          <td class="book-title">${item.title}</td>
          <td class="price">$${parseFloat(item.price).toFixed(2)}</td>
          <td class="quantity">
            <input type="number" 
                   min="1" 
                   value="${item.quantity}" 
                   data-id="${item.cart_item_id}"
                   class="quantity-input"
                   ${!stockStatus.includes('In Stock') ? 'disabled' : ''}>
          </td>
          <td class="stock-status ${stockClass}">
            <i class="fas ${stockIcon}"></i> ${stockStatus}
          </td>
          <td class="item-total">$${itemTotal.toFixed(2)}</td>
          <td class="actions">
            <button class="remove-btn" data-id="${item.cart_item_id}" title="Remove item">
              <i class="fas fa-trash"></i> Remove
            </button>
          </td>
        </tr>
      `;
    }).join("");

    totalEl.textContent = total.toFixed(2);
    
    // Show/hide elements
    tbody.style.display = '';
    cartSummary.style.display = 'block';
    emptyMessage.style.display = 'none';
    clearCartBtn.style.display = 'block';
    
    this.setupCartItemEvents();
  }

  // Stock status function
  getStockStatus(stock, quantity) {
    if (stock === undefined || stock === null) {
      return 'In Stock'; // Default if stock info not available
    }
    
    if (stock <= 0) {
      return 'Out of Stock';
    } else if (stock < quantity) {
      return `Low Stock (${stock} available)`;
    } else {
      return 'In Stock';
    }
  }

  showEmptyCart() {
    document.getElementById('cart-table-body').style.display = 'none';
    document.getElementById('cart-summary').style.display = 'none';
    document.getElementById('empty-cart-message').style.display = 'block';
    document.getElementById('clear-cart-btn').style.display = 'none';
    document.getElementById('cart-count').textContent = '0';
  }

  setupEventListeners() {
    // Checkout button
    document.getElementById("checkout-btn").addEventListener("click", () => {
      this.handleCheckout();
    });

    // Clear cart button
    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        this.clearCart();
      });
    }
  }

  setupCartItemEvents() {
    // Quantity change events
    document.querySelectorAll(".quantity-input").forEach(input => {
      input.addEventListener("change", (e) => {
        this.updateQuantity(e.target);
      });
      
      input.addEventListener("blur", (e) => {
        if (e.target.value === "" || e.target.value < 1) {
          e.target.value = 1;
          this.updateQuantity(e.target);
        }
      });
    });

    // Remove button events
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.removeItem(e.currentTarget.dataset.id);
      });
    });
  }

  async updateQuantity(input) {
    const cartItemId = input.dataset.id;
    const newQuantity = parseInt(input.value);
    
    if (newQuantity < 1) {
      input.value = 1;
      return;
    }

    try {
      input.disabled = true;
      
      const response = await fetch(`${this.apiBase}/cart/${cartItemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({ quantity: newQuantity })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update quantity");
      }

      if (result.success) {
        await this.loadCart(); // Reload cart to reflect changes
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to update quantity: " + error.message);
      await this.loadCart(); // Reload to reset to correct values
    } finally {
      input.disabled = false;
    }
  }

  async removeItem(cartItemId) {
    if (!confirm("Are you sure you want to remove this item from your cart?")) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBase}/cart/${cartItemId}`, {
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
        await this.loadCart();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to remove item: " + error.message);
    }
  }

  async clearCart() {
    if (!confirm("Are you sure you want to clear your entire cart?")) {
      return;
    }

    try {
      // Get all cart items first
      const response = await fetch(`${this.apiBase}/cart`, {
        headers: { 
          "Authorization": `Bearer ${this.token}` 
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove each item individually
        for (const item of result.data) {
          await fetch(`${this.apiBase}/cart/${item.cart_item_id}`, {
            method: "DELETE",
            headers: { 
              "Authorization": `Bearer ${this.token}` 
            }
          });
        }
        
        await this.loadCart();
        this.showSuccessMessage("Cart cleared successfully!");
      }
    } catch (error) {
      this.showError("Failed to clear cart: " + error.message);
    }
  }

  // Handle checkout with screenshot verification
  async handleCheckout() {
    this.showCheckoutForm();
  }

  showCheckoutForm() {
    const checkoutModal = document.getElementById('checkout-modal');
    checkoutModal.style.display = 'flex';
    
    // Reset form
    document.getElementById('checkout-info-form').reset();
    document.getElementById('screenshot-preview').innerHTML = '';
    
    // Handle payment method change
    document.getElementById('payment_method').addEventListener('change', (e) => {
      this.toggleScreenshotSection(e.target.value);
    });

    // Handle screenshot preview
    document.getElementById('payment_screenshot').addEventListener('change', (e) => {
      this.handleScreenshotPreview(e);
    });
    
    // Handle form submission
    document.getElementById('checkout-info-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.processCheckout(new FormData(e.target));
    });

    // Handle cancel
    document.getElementById('cancel-checkout').addEventListener('click', () => {
      checkoutModal.style.display = 'none';
    });

    // Load previous shipping info if available
    this.loadPreviousShippingInfo();
  }

  toggleScreenshotSection(paymentMethod) {
    const screenshotSection = document.getElementById('screenshot-section');
    const screenshotInput = document.getElementById('payment_screenshot');
    
    if (paymentMethod === 'screenshot') {
      screenshotSection.style.display = 'block';
      screenshotInput.required = true;
    } else {
      screenshotSection.style.display = 'none';
      screenshotInput.required = false;
    }
  }

  handleScreenshotPreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('screenshot-preview');
    
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showError("File size too large. Please select an image smaller than 5MB.");
        e.target.value = '';
        preview.innerHTML = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showError("Please select a valid image file.");
        e.target.value = '';
        preview.innerHTML = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <div class="screenshot-preview-content">
            <img src="${e.target.result}" alt="Screenshot Preview">
            <button type="button" class="remove-screenshot" onclick="this.closest('.screenshot-preview').innerHTML=''">
              <i class="fas fa-times"></i> Remove
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    }
  }

  async loadPreviousShippingInfo() {
    try {
      const response = await fetch(`${this.apiBase}/shipping-info`, {
        headers: {
          "Authorization": `Bearer ${this.token}`
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        document.getElementById('full_name').value = data.full_name || '';
        document.getElementById('email').value = this.user.email || ''; // Use current user's email
        document.getElementById('phone_number').value = data.phone_number || '';
        document.getElementById('shipping_address').value = data.shipping_address || '';
        document.getElementById('billing_address').value = data.billing_address || data.shipping_address || '';
        document.getElementById('city').value = data.city || '';
        document.getElementById('zip_code').value = data.zip_code || '';
        
        if (data.payment_method) {
          document.getElementById('payment_method').value = data.payment_method;
          this.toggleScreenshotSection(data.payment_method);
        }
      } else {
        // Pre-fill with user info if no previous shipping info
        document.getElementById('email').value = this.user.email || '';
        document.getElementById('full_name').value = this.user.name || '';
      }
    } catch (error) {
      console.log("No previous shipping info found");
      // Pre-fill with user info
      document.getElementById('email').value = this.user.email || '';
      document.getElementById('full_name').value = this.user.name || '';
    }
  }

  async processCheckout(formData) {
    try {
      const paymentMethod = formData.get('payment_method');
      let screenshotData = null;

      // Handle screenshot upload
      if (paymentMethod === 'screenshot') {
        const screenshotFile = formData.get('payment_screenshot');
        if (screenshotFile && screenshotFile.size > 0) {
          screenshotData = await this.fileToBase64(screenshotFile);
        } else {
          throw new Error("Please upload a payment screenshot");
        }
      }

      const checkoutData = {
        full_name: formData.get('full_name'),
        email: formData.get('email'), // FIXED: Now included
        phone_number: formData.get('phone_number'),
        shipping_address: formData.get('shipping_address'),
        billing_address: formData.get('billing_address') || formData.get('shipping_address'),
        city: formData.get('city'),
        zip_code: formData.get('zip_code'),
        payment_method: paymentMethod,
        payment_screenshot: screenshotData
      };

      // Validate required fields
      if (!checkoutData.full_name || !checkoutData.email || !checkoutData.phone_number || !checkoutData.shipping_address || !checkoutData.city) {
        throw new Error("Please fill in all required fields");
      }

      const response = await fetch(`${this.apiBase}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify(checkoutData)
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle stock issues specifically
        if (result.error === "Insufficient stock" && result.details) {
          throw new Error("Insufficient stock: " + result.details.join(', '));
        }
        throw new Error(result.error || "Checkout failed");
      }

      if (result.success) {
        this.showSuccessMessage(`
          ✅ Order submitted for verification!
          Order ID: ${result.order_id}
          Total: $${result.total_price}
          Status: ${result.status}
          ${paymentMethod === 'screenshot' ? 'We will review your payment screenshot and update you soon.' : 'Your order has been placed successfully.'}

           <br><br>
  <a href="orders.html" style="color: white; text-decoration: underline;">
    View Your Orders
  </a>
        `);
        
        // Close checkout modal
        document.getElementById('checkout-modal').style.display = 'none';
        
        // Reload cart to reflect changes
        await this.loadCart();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Checkout failed: " + error.message);
    }
  }

  // Helper function to convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'notification success';
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 400px;
      white-space: pre-line;
    `;
    successDiv.innerHTML = `
      <strong><i class="fas fa-check-circle"></i> Success!</strong><br>${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (successDiv.parentElement) {
        document.body.removeChild(successDiv);
      }
    }, 10000);
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notification error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff6b6b;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
    `;
    errorDiv.innerHTML = `
      <strong><i class="fas fa-exclamation-triangle"></i> Error:</strong> ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentElement) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
    
    console.error("Cart Error:", message);
  }
}

// Initialize cart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const userInfoEl = document.getElementById("cart-user-info");

  // Get user from sessionStorage
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (user) {
    userInfoEl.innerHTML = `
      <p><strong>User:</strong> ${user.name || "Guest"}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
  } else {
    userInfoEl.innerHTML = `
      <p><strong>You are not logged in.</strong></p>
    `;
  }
    
  new CartManager();
});