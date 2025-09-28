class AdminDashboard {
  constructor() {
    this.token = sessionStorage.getItem("token");
    this.user = JSON.parse(sessionStorage.getItem("user"));
    this.apiBase = "http://localhost:3000/api/orders";
    
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

    await this.loadDashboard();
    this.setupEventListeners();
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

  async loadDashboard() {
    try {
      await this.loadOrders();
    } catch (error) {
      this.showError("Failed to load dashboard: " + error.message);
    }
  }

  async loadOrders() {
    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/admin/all-orders`, {
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
        this.updateStats(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to load orders: " + error.message);
    }
  }

  displayOrders(orders) {
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
          <td title="${itemsPreview}">
            ${itemsPreview}
          </td>
          <td><strong>$${parseFloat(order.total_price).toFixed(2)}</strong></td>
          <td>
            <select class="status-select" data-order-id="${order.order_id}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>${orderDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn btn-view" onclick="adminDashboard.viewOrder(${order.order_id})">
                <i class="fas fa-eye"></i> View
              </button>
              <button class="btn btn-edit" onclick="adminDashboard.updateStatus(${order.order_id})">
                <i class="fas fa-save"></i> Update
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

  updateStats(orders) {
    // Update statistics
    document.getElementById('total-orders').textContent = orders.length;
    
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    document.getElementById('pending-orders').textContent = pendingOrders;
    
    const totalRevenue = orders.reduce((total, order) => total + parseFloat(order.total_price), 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    
    // Count unique customers
    const uniqueCustomers = new Set(orders.map(order => order.user_id)).size;
    document.getElementById('total-customers').textContent = uniqueCustomers;
  }

  async updateStatus(orderId) {
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

      if (!response.ok) {
        throw new Error(result.error || "Failed to update status");
      }

      if (result.success) {
        this.showNotification("Order status updated successfully!", "success");
        
        // Reset select styling
        select.style.background = '';
        select.style.borderColor = '';
        
        // Reload orders to reflect changes
        await this.loadOrders();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      this.showError("Failed to update order status: " + error.message);
    }
  }

  viewOrder(orderId) {
    // You can implement a detailed order view modal here
    alert(`View order details for order #${orderId}\n\nThis would open a detailed order view with:\n- Customer information\n- Order items\n- Shipping address\n- Order history`);
    
    // For now, just show a simple alert
    // In a real implementation, you'd show a modal with order details
  }

  setupEventListeners() {
    // Refresh orders button
    document.getElementById("refresh-orders").addEventListener("click", () => {
      this.loadOrders();
    });

    // Auto-refresh every 30 seconds
    setInterval(() => {
      this.loadOrders();
    }, 30000);
  }

  showLoading() {
    document.getElementById("orders-table-body").innerHTML = `
      <tr>
        <td colspan="8" class="loading">
          <div class="spinner"></div>
          Loading orders...
        </td>
      </tr>
    `;
  }

  showError(message) {
    document.getElementById("orders-table-body").innerHTML = `
      <tr>
        <td colspan="8" class="error-message">
          <i class="fas fa-exclamation-triangle"></i> ${message}
          <br><button onclick="adminDashboard.loadOrders()" class="btn" style="margin-top: 10px;">Retry</button>
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
}

// Initialize admin dashboard when DOM is loaded
let adminDashboard;
document.addEventListener("DOMContentLoaded", () => {
  adminDashboard = new AdminDashboard();
});