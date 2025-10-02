document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const addForm = document.getElementById("add-book-form");
  const categorySelect = document.getElementById("category-select");
  const booksBody = document.getElementById("books-table-body");
  const searchBar = document.getElementById("search-bar");
  const logoutBtn = document.getElementById("logoutBtn");
  
  // Stats elements
  const totalBooksElement = document.getElementById("total-books");
  const lowStockCountElement = document.getElementById("low-stock-count");
  const categoriesCountElement = document.getElementById("categories-count");

  // Modal DOM
  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-book-form");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const closeEdit = document.getElementById("close-edit");

  // Mobile menu elements
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const navOverlay = document.getElementById("navOverlay");

  // Auth check
  const token = sessionStorage.getItem("token");
  const user = (() => {
    try { 
      return JSON.parse(sessionStorage.getItem("user")); 
    } catch(e){ 
      console.error("Error parsing user data:", e);
      return null; 
    }
  })();

  // Check authentication and admin role
  if (!token || !user || user.role !== "admin") {
    console.error("Access denied - Token:", !!token, "User:", !!user, "Role:", user?.role);
    alert("Admin access only. Please log in as administrator.");
    window.location.href = "login.html";
    return;
  }

  // Initialize mobile menu
  initMobileMenu();

  // State
  let categories = [];
  let books = [];

  // API endpoints
  const API = {
    BOOKS: "http://localhost:3000/api/books",
    CATS: "http://localhost:3000/api/categories"
  };

  // Helper functions
  function fmtPrice(v) {
    return (Number(v) || 0).toFixed(2);
  }

  function escapeHtml(text = "") {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function sanitizeUrl(url) {
    if (!url) return "images/no-cover.png";
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:") return url;
    } catch(e) {
      console.warn("Invalid URL:", url);
    }
    return "images/no-cover.png";
  }

  // Get category name by ID
  function getCategoryName(categoryId) {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(c => c.category_id == categoryId || c.id == categoryId);
    return category ? category.name : "Uncategorized";
  }

  // Mobile menu functionality
  function initMobileMenu() {
    if (!menuToggle || !mainNav || !navOverlay) {
      console.error("Mobile menu elements not found");
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

  // Load categories
  async function loadCategories() {
    try {
      console.log("Loading categories...");
      const res = await fetch(API.CATS);
      if (!res.ok) {
        throw new Error(`Failed to load categories: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      
      // Check if data is an array
      if (!Array.isArray(data)) {
        throw new Error("Categories data is not an array");
      }
      
      categories = data;
      console.log("Loaded categories:", categories);

      // Populate add form select
      categorySelect.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.category_id || c.id;
        opt.textContent = c.name || 'Unnamed Category';
        categorySelect.appendChild(opt);
      });

      // Update categories count
      if (categoriesCountElement) {
        categoriesCountElement.textContent = categories.length;
      }

    } catch (err) {
      console.error("loadCategories error:", err);
      categorySelect.innerHTML = '<option value="">Failed to load categories</option>';
      if (categoriesCountElement) {
        categoriesCountElement.textContent = '0';
      }
    }
  }

  // Load books
  async function loadBooks() {
    try {
      console.log("Loading books...");
      booksBody.innerHTML = `
        <tr>
          <td colspan="7" class="loading-cell">
            <div class="loading">
              <div class="spinner"></div>
              Loading books...
            </div>
          </td>
        </tr>
      `;

      const res = await fetch(API.BOOKS, { 
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        } 
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      
      // Check if data is an array
      if (!Array.isArray(data)) {
        throw new Error("Books data is not an array");
      }

      books = data;
      console.log("Loaded books:", books);

      // Update stats
      updateStats(books);
      renderBooks(books);

    } catch (err) {
      console.error("loadBooks error:", err);
      booksBody.innerHTML = `
        <tr>
          <td colspan="7" class="error-cell">
            <div class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error Loading Books</h3>
              <p>${err.message}</p>
              <button onclick="location.reload()" class="btn btn-secondary">
                <i class="fas fa-redo"></i> Try Again
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  }

  // Update statistics
  function updateStats(booksList) {
    if (totalBooksElement) {
      totalBooksElement.textContent = booksList.length;
    }

    if (lowStockCountElement) {
      const lowStockCount = booksList.filter(book => (book.stock || 0) < 10).length;
      lowStockCountElement.textContent = lowStockCount;
    }

    if (categoriesCountElement) {
      const uniqueCategories = new Set(booksList.map(book => book.category_id).filter(Boolean));
      categoriesCountElement.textContent = uniqueCategories.size;
    }
  }

  // Render books table 
  function renderBooks(list) {
    booksBody.innerHTML = "";
    
    if (!list || list.length === 0) {
      booksBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-cell">
            <div class="empty-state">
              <i class="fas fa-book"></i>
              <h3>No Books Found</h3>
              <p>Add your first book to get started</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    list.forEach(book => {
      const tr = document.createElement("tr");
      
      // Get category name using the helper function
      const catName = getCategoryName(book.category_id);
      
      // Handle cover image
      const coverUrl = sanitizeUrl(book.cover_url);
      
      // Stock status class
      const stockClass = (book.stock || 0) < 10 ? 'stock-low' : 'stock-ok';
      const stockText = book.stock || 0;

      tr.innerHTML = `
        <td>
          <img class="thumb" src="${coverUrl}" alt="${escapeHtml(book.title)}" 
               onerror="this.src='images/no-cover.png'">
        </td>
        <td>${escapeHtml(book.title || 'No Title')}</td>
        <td>${escapeHtml(book.author || 'Unknown Author')}</td>
        <td>${escapeHtml(catName)}</td>
        <td>$${fmtPrice(book.price)}</td>
        <td class="${stockClass}">${stockText}</td>
        <td class="actions-col">
          <div class="action-buttons">
            <button class="action-btn edit" data-id="${book.book_id || book.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete" data-id="${book.book_id || book.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;
      
      booksBody.appendChild(tr);
    });

    // Attach event listeners
    attachBookEventListeners();
  }

  // Use event delegation for dynamic content
  function attachBookEventListeners() {
    booksBody.addEventListener('click', (e) => {
      const target = e.target;
      const editBtn = target.closest('.action-btn.edit');
      const deleteBtn = target.closest('.action-btn.delete');
      
      if (editBtn) {
        e.stopPropagation();
        const bookId = editBtn.dataset.id;
        openEditModal(bookId);
      }
      
      if (deleteBtn) {
        e.stopPropagation();
        const bookId = deleteBtn.dataset.id;
        handleDelete(bookId);
      }
    });
  }

  // Add Book Form
  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = addForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;

        const payload = {
          title: document.getElementById("title").value.trim(),
          author: document.getElementById("author").value.trim(),
          isbn: document.getElementById("isbn").value.trim(),
          price: parseFloat(document.getElementById("price").value) || 0,
          stock: parseInt(document.getElementById("stock").value) || 0,
          category_id: categorySelect.value || null,
          cover_url: document.getElementById("cover_url").value.trim() || null,
          description: document.getElementById("description").value.trim() || null
        };

        // Validation
        if (!payload.title || !payload.author || !payload.isbn || !payload.category_id) {
          alert("Please fill in all required fields: Title, Author, ISBN, and Category.");
          return;
        }

        const res = await fetch(API.BOOKS, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Failed to add book: ${res.status}`);
        }

        // Success
        addForm.reset();
        await loadBooks();
        
        alert(`Book "${data.title}" added successfully!`);

      } catch (err) {
        console.error("Add book error:", err);
        alert(`Failed to add book: ${err.message}`);
      } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Delete Book
  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this book? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`${API.BOOKS}/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to delete: ${res.status}`);
      }

      await loadBooks();
      alert("Book deleted successfully!");

    } catch (err) {
      console.error("Delete error:", err);
      alert(`Failed to delete book: ${err.message}`);
    }
  }

  // Edit Modal Functions
  function openEditModal(id) {
    const book = books.find(b => String(b.book_id || b.id) === String(id));
    if (!book) {
      alert("Book not found");
      return;
    }

    // Populate form fields
    document.getElementById("edit-book-id").value = book.book_id || book.id;
    document.getElementById("edit-title").value = book.title || "";
    document.getElementById("edit-author").value = book.author || "";
    document.getElementById("edit-isbn").value = book.isbn || "";
    document.getElementById("edit-price").value = book.price || "";
    document.getElementById("edit-stock").value = book.stock || "";
    document.getElementById("edit-cover_url").value = book.cover_url || "";
    document.getElementById("edit-description").value = book.description || "";

    // Populate category select
    const editCat = document.getElementById("edit-category");
    editCat.innerHTML = '<option value="">Select Category</option>';
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.category_id || c.id;
      opt.textContent = c.name || 'Unnamed Category';
      if (String(c.category_id || c.id) === String(book.category_id)) {
        opt.selected = true;
      }
      editCat.appendChild(opt);
    });

    // Show modal
    editModal.style.display = 'flex';
    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
    
    // Focus first input
    setTimeout(() => document.getElementById("edit-title").focus(), 100);
  }

  // Close modal functions
  function closeEditModal() {
    editModal.style.display = 'none';
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", closeEditModal);
  }
  
  if (closeEdit) {
    closeEdit.addEventListener("click", closeEditModal);
  }
  
  if (editModal) {
    editModal.addEventListener("click", (ev) => {
      if (ev.target === editModal) {
        closeEditModal();
      }
    });
  }

  // Edit form submission
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = editForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      try {
        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        const id = document.getElementById("edit-book-id").value;
        const payload = {
          title: document.getElementById("edit-title").value.trim(),
          author: document.getElementById("edit-author").value.trim(),
          isbn: document.getElementById("edit-isbn").value.trim(),
          price: parseFloat(document.getElementById("edit-price").value) || 0,
          stock: parseInt(document.getElementById("edit-stock").value) || 0,
          category_id: document.getElementById("edit-category").value || null,
          cover_url: document.getElementById("edit-cover_url").value.trim() || null,
          description: document.getElementById("edit-description").value.trim() || null
        };

        const res = await fetch(`${API.BOOKS}/${id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Failed to update: ${res.status}`);
        }

        closeEditModal();
        await loadBooks();
        alert("Book updated successfully!");

      } catch (err) {
        console.error("Update error:", err);
        alert(`Failed to update book: ${err.message}`);
      } finally {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Search functionality
  if (searchBar) {
    searchBar.addEventListener("input", () => {
      const query = searchBar.value.trim().toLowerCase();
      if (!query) {
        renderBooks(books);
        return;
      }

      const filtered = books.filter(book =>
        (book.title || "").toLowerCase().includes(query) ||
        (book.author || "").toLowerCase().includes(query) ||
        (book.isbn || "").toLowerCase().includes(query) ||
        getCategoryName(book.category_id).toLowerCase().includes(query)
      );
      
      renderBooks(filtered);
    });
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        window.location.href = "login.html";
      }
    });
  }

  // Initialize the application
  async function init() {
    try {
      console.log("Initializing admin panel...");
      await loadCategories();
      await loadBooks();
      console.log("Admin panel initialized successfully");
    } catch (err) {
      console.error("Initialization error:", err);
      alert("Failed to initialize admin panel. Please check the console for details.");
    }
  }

  // Start the application
  init();
});