class AdminOrders {
  constructor() {
    this.token = sessionStorage.getItem("token");
    this.user = JSON.parse(sessionStorage.getItem("user"));
    this.apiBase = "/api/orders";
    this.currentOrderId = null;
    this.currentTab = 'pending-verification';
    
    this.init();
  }

  async init() {
    // Check authentication and admin role
    if (!this.token || !this.user) {
      this.redirectToLogin();
      return;
    }

    if (this.user.role !== 'admin') {
      this.showAccessDenied();
      return;
    }

    await this.loadCurrentTab();
    this.setupAutoRefresh();
  }

  redirectToLogin() {
    alert("Please login to access the admin dashboard");
    window.location.href = "login.html";
  }

  showAccessDenied() {
    document.querySelector("main").innerHTML = `
      <div class="error-message">
        <h2><i class="fas fa-exclamation-triangle"></i> Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
        <a href="index.html" class="btn">Return to Home</a>
      </div>
    `;
  }

  showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected tab and activate button
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    this.currentTab = tabName;
    this.loadCurrentTab();
  }

  async loadCurrentTab() {
    switch (this.currentTab) {
      case 'pending-verification':
        await this.loadPendingVerifications();
        break;
      case 'all-orders':
        await this.loadAllOrders();
        break;
      case 'order-table':
        await this.loadOrdersTable();
        break;
    }
  }

  // Pending Verifications
  async loadPendingVerifications() {
    try {
      this.showLoading('pending-verification-list');
      
      const response = await fetch(`${this.apiBase}/pending-verification`, {
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.displayPendingVerifications(result.data);
        this.updatePendingBadge(result.data.length);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError('pending-verification-list', `Error loading verifications: ${error.message}`);
    }
  }

  displayPendingVerifications(orders) {
    const container = document.getElementById('pending-verification-list');
    
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div class="empty-state">No orders pending verification</div>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="verification-card">
        <div class="order-header">
          <h3>Order #${order.order_id} - $${order.total_price}</h3>
          <span class="order-status status-pending">Pending Verification</span>
        </div>
        
        <div class="order-details">
          <div>
            <p><strong>Customer:</strong> ${order.full_name || order.user_name}</p>
            <p><strong>Email:</strong> ${order.user_email}</p>
            <p><strong>Phone:</strong> ${order.phone_number}</p>
            <p><strong>Shipping:</strong> ${order.shipping_address}, ${order.city}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          
          <div>
            <h4>Items:</h4>
            <ul>
              ${(order.items || []).map(item => `
                <li>${item.title} - ${item.quantity} x $${item.price}</li>
              `).join('')}
            </ul>
            
            ${order.payment_screenshot ? `
              <h4>Payment Screenshot:</h4>
              <div class="screenshot-container">
                <img src="${order.payment_screenshot}" 
                     alt="Payment Screenshot" 
                     onclick="this.style.maxHeight='none'">
              </div>
            ` : '<p>No screenshot provided</p>'}
          </div>
        </div>
        
        <div class="verification-actions">
          <button class="btn btn-approve" onclick="adminOrders.openVerificationModal(${order.order_id})">
            <i class="fas fa-check-circle"></i> Verify Payment
          </button>
        </div>
      </div>
    `).join('');
  }

  // All Orders (Card View)
  async loadAllOrders() {
    try {
      this.showLoading('all-orders-list');
      
      const response = await fetch(`${this.apiBase}/admin/all-orders`, {
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        this.displayAllOrders(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError('all-orders-list', `Error loading orders: ${error.message}`);
    }
  }

  displayAllOrders(orders) {
    const container = document.getElementById('all-orders-list');
    
    if (!orders || orders.length === 0) {
      container.innerHTML = '<div class="empty-state">No orders found</div>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <h3>Order #${order.order_id} - $${order.total_price}</h3>
          <span class="order-status status-${order.status}">${order.status}</span>
        </div>
        
        <div class="order-details">
          <div>
            <p><strong>Customer:</strong> ${order.user_name}</p>
            <p><strong>Email:</strong> ${order.user_email}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          
          <div>
            <h4>Items (${order.items ? order.items.length : 0}):</h4>
            <ul>
              ${(order.items || []).slice(0, 3).map(item => `
                <li>${item.title} - ${item.quantity} x $${item.price}</li>
              `).join('')}
              ${order.items && order.items.length > 3 ? `<li>... +${order.items.length - 3} more</li>` : ''}
            </ul>
          </div>
        </div>
        
        <div class="order-actions">
          <button class="btn btn-view" onclick="adminOrders.viewOrderDetails(${order.order_id})">
            <i class="fas fa-eye"></i> View Details
          </button>
          ${order.status === 'pending_verification' ? `
            <button class="btn btn-approve" onclick="adminOrders.openVerificationModal(${order.order_id})">
              <i class="fas fa-check-circle"></i> Verify
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  // Orders Table View
  async loadOrdersTable() {
    try {
      this.showTableLoading();
      
      const response = await fetch(`${this.apiBase}/admin/all-orders`, {
        headers: { 
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        this.displayOrdersTable(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showTableError(`Error loading orders: ${error.message}`);
    }
  }

  displayOrdersTable(orders) {
    const tbody = document.getElementById("orders-table-body");
    
    if (!orders || orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <i class="fas fa-box-open"></i>
            <p>No orders found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const orderDate = new Date(order.created_at).toLocaleDateString();
      const itemsCount = order.items ? order.items.length : 0;
      const itemsPreview = order.items ? order.items.slice(0, 2).map(item => 
        `${item.title} (${item.quantity}x)`
      ).join(', ') + (itemsCount > 2 ? `... +${itemsCount - 2} more` : '') : 'No items';

      return `
        <tr>
          <td><strong>#${order.order_id}</strong></td>
          <td>
            <div><strong>${order.user_name}</strong></div>
            <small>ID: ${order.user_id}</small>
          </td>
          <td>${order.user_email}</td>
          <td title="${itemsPreview}">${itemsPreview}</td>
          <td><strong>$${parseFloat(order.total_price).toFixed(2)}</strong></td>
          <td>
            <select class="status-select" data-order-id="${order.order_id}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="pending_verification" ${order.status === 'pending_verification' ? 'selected' : ''}>Pending Verification</option>
              <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
              <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="payment_rejected" ${order.status === 'payment_rejected' ? 'selected' : ''}>Payment Rejected</option>
            </select>
          </td>
          <td>${orderDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-view" onclick="adminOrders.viewOrderDetails(${order.order_id})">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-edit" onclick="adminOrders.updateOrderStatus(${order.order_id})">
                <i class="fas fa-save"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Add event listeners to status selects
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.value;
        
        // Highlight changed status
        e.target.style.background = '#fff3cd';
        e.target.style.borderColor = '#ffc107';
      });
    });
  }

  // Modal Functions
  openVerificationModal(orderId) {
    this.currentOrderId = orderId;
    document.getElementById('verification-modal').style.display = 'flex';
    
    document.getElementById('verification-details').innerHTML = `
      <p>Are you sure you want to verify payment for Order #${orderId}?</p>
      <p>This will notify the customer via email.</p>
    `;
  }

  async verifyPayment(action) {
    if (!this.currentOrderId) return;

    try {
      const response = await fetch(`${this.apiBase}/verify-payment/${this.currentOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ action })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(
          `Payment ${action}ed successfully! ${result.email_sent ? 'Customer notified via email.' : ''}`,
          'success'
        );
        this.closeModal();
        await this.loadCurrentTab();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showNotification(`Error: ${error.message}`, 'error');
    }
  }

  closeModal() {
    document.getElementById('verification-modal').style.display = 'none';
    this.currentOrderId = null;
  }

  async viewOrderDetails(orderId) {
    try {
      const response = await fetch(`${this.apiBase}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        this.displayOrderDetails(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showNotification(`Error loading order details: ${error.message}`, 'error');
    }
  }

  displayOrderDetails(order) {
    document.getElementById('order-details-modal').style.display = 'flex';
    
    document.getElementById('order-details-content').innerHTML = `
      <div class="order-details">
        <div>
          <h4>Customer Information</h4>
          <p><strong>Name:</strong> ${order.full_name || order.user_name}</p>
          <p><strong>Email:</strong> ${order.user_email}</p>
          <p><strong>Phone:</strong> ${order.phone_number}</p>
        </div>
        
        <div>
          <h4>Order Information</h4>
          <p><strong>Status:</strong> ${order.status}</p>
          <p><strong>Total:</strong> $${order.total_price}</p>
          <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        
        <div>
          <h4>Shipping Address</h4>
          <p>${order.shipping_address}</p>
          <p>${order.city}, ${order.zip_code}</p>
        </div>
        
        <div>
          <h4>Items (${order.items ? order.items.length : 0})</h4>
          <ul>
            ${(order.items || []).map(item => `
              <li>${item.title} - ${item.quantity} x $${item.price} = $${(item.quantity * item.price).toFixed(2)}</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }

  closeOrderModal() {
    document.getElementById('order-details-modal').style.display = 'none';
  }

  // Status Management
  async updateOrderStatus(orderId) {
    const select = document.querySelector(`.status-select[data-order-id="${orderId}"]`);
    const newStatus = select.value;

    try {
      const response = await fetch(`${this.apiBase}/admin/update-status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification("Order status updated successfully!", "success");
        
        // Reset select styling
        select.style.background = '';
        select.style.borderColor = '';
        
        // Reload current tab
        await this.loadCurrentTab();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showNotification(`Failed to update order status: ${error.message}`, "error");
    }
  }

  // Utility Functions
  updatePendingBadge(count) {
    const badge = document.getElementById('pending-badge');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">Loading...</div>';
  }

  showError(containerId, message) {
    document.getElementById(containerId).innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i> ${message}
        <br><button onclick="adminOrders.loadCurrentTab()" class="btn" style="margin-top: 10px;">Retry</button>
      </div>
    `;
  }

  showTableLoading() {
    document.getElementById("orders-table-body").innerHTML = `
      <tr>
        <td colspan="8" class="loading">
          <div class="spinner"></div>
          Loading orders...
        </td>
      </tr>
    `;
  }

  showTableError(message) {
    document.getElementById("orders-table-body").innerHTML = `
      <tr>
        <td colspan="8" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> ${message}
          <br><button onclick="adminOrders.loadOrdersTable()" class="btn" style="margin-top: 10px;">Retry</button>
        </td>
      </tr>
    `;
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      z-index: 10000;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
      ${message}
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  setupAutoRefresh() {
    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadCurrentTab();
    }, 30000);
  }

  // Public method for refresh button
  loadOrders() {
    this.loadCurrentTab();
  }
}

// Initialize admin orders when DOM is loaded
let adminOrders;
document.addEventListener("DOMContentLoaded", () => {
  adminOrders = new AdminOrders();
});