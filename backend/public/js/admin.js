document.addEventListener("DOMContentLoaded", () => {
  // DOM
  const addForm = document.getElementById("add-book-form");
  const categorySelect = document.getElementById("category-select");
  const booksBody = document.getElementById("books-table-body");
  const searchBar = document.getElementById("search-bar");
  const logoutBtn = document.getElementById("logout-btn");

  // Modal DOM
  const editModal = document.getElementById("edit-modal");
  const editForm = document.getElementById("edit-book-form");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const closeEdit = document.getElementById("close-edit");

  // Auth
  const token = sessionStorage.getItem("token");
  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem("user")); } catch(e){ return null; }
  })();

  if (!token || !user || user.role !== "admin") {
    alert("Admin access only.");
    window.location.href = "login.html";
    return;
  }

  // state
  let categories = [];
  let books = [];

  // ----- helpers -----
  const API = {
    BOOKS: "http://localhost:3000/api/books",
    CATS: "http://localhost:3000/api/categories"
  };

  function fmtPrice(v){
    return (Number(v) || 0).toFixed(2);
  }

  // fetch categories -> populate add & reuse for edit
  async function loadCategories(){
    try {
      const res = await fetch(API.CATS);
      if (!res.ok) throw new Error("Failed categories");
      categories = await res.json();
      // populate add form select
      categorySelect.innerHTML = `<option value="">Select Category</option>`;
      categories.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.category_id;
        opt.textContent = c.name;
        categorySelect.appendChild(opt);
      });
    } catch (err) {
      console.error("loadCategories:", err);
      categorySelect.innerHTML = `<option value="">(failed to load categories)</option>`;
    }
  }

  // fetch all books
  async function loadBooks(){
    try {
      const res = await fetch(API.BOOKS, { headers: { Authorization: `Bearer ${token}` }});
      if (!res.ok) throw new Error("Failed books");
      books = await res.json();
      renderBooks(books);
    } catch (err) {
      console.error("loadBooks:", err);
      booksBody.innerHTML = `<tr><td colspan="7">Failed to load books. See console.</td></tr>`;
    }
  }

  // render rows
  function renderBooks(list){
    booksBody.innerHTML = "";
    if (!list || !list.length) {
      booksBody.innerHTML = `<tr><td colspan="7">No books found</td></tr>`;
      return;
    }

    list.forEach(book => {
      const tr = document.createElement("tr");

      const catName = (categories.find(c => c.category_id == book.category_id) || {}).name || "Uncategorized";
      const cover = book.cover_url ? sanitizeUrl(book.cover_url) : "images/no-cover.png";

      tr.innerHTML = `
        <td><img class="thumb" src="${cover}" alt="cover"></td>
        <td>${escapeHtml(book.title)}</td>
        <td>${escapeHtml(book.author)}</td>
        <td>${escapeHtml(catName)}</td>
        <td>$${fmtPrice(book.price)}</td>
        <td>${book.stock ?? 0}</td>
        <td class="actions-col">
          <button class="action-btn edit" data-id="${book.book_id}">Edit</button>
          <button class="action-btn delete" data-id="${book.book_id}">Delete</button>
        </td>
      `;
      booksBody.appendChild(tr);
    });

    // attach event delegation
    booksBody.querySelectorAll(".edit").forEach(b => b.addEventListener("click", e => openEditModal(e.target.dataset.id)));
    booksBody.querySelectorAll(".delete").forEach(b => b.addEventListener("click", e => handleDelete(e.target.dataset.id)));
  }

  // small sanitize helper for HTML (prevent injection)
  function escapeHtml(text = ""){
    return String(text).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]);
  }

  // naive URL sanitizer for img src (keeps http/https)
  function sanitizeUrl(url){
    try {
      const u = new URL(url);
      if (u.protocol === "http:" || u.protocol === "https:") return url;
    } catch(e){}
    return "images/no-cover.png";
  }

  // ----- Add Book -----
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
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

    if (!payload.title || !payload.author || !payload.isbn || !payload.category_id) {
      alert("Please fill required fields (title, author, isbn, category).");
      return;
    }

    try {
      const res = await fetch(API.BOOKS, {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      addForm.reset();
      await loadBooks();
      alert(`Added: ${data.title || "book"}`);
    } catch (err) {
      console.error("Add book:", err);
      alert("Failed to add book. See console.");
    }
  });

  // ----- Delete -----
  async function handleDelete(id){
    if (!confirm("Delete this book? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API.BOOKS}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      await loadBooks();
      alert("Deleted.");
    } catch (err) {
      console.error("Delete:", err);
      alert("Failed to delete. See console.");
    }
  }

  // ----- Edit modal -----
  function openEditModal(id){
    const book = books.find(b => String(b.book_id) === String(id));
    if (!book) { alert("Book not found"); return; }

    // populate fields
    document.getElementById("edit-book-id").value = book.book_id;
    document.getElementById("edit-title").value = book.title || "";
    document.getElementById("edit-author").value = book.author || "";
    document.getElementById("edit-isbn").value = book.isbn || "";
    document.getElementById("edit-price").value = book.price ?? "";
    document.getElementById("edit-stock").value = book.stock ?? "";
    document.getElementById("edit-cover_url").value = book.cover_url || "";
    document.getElementById("edit-description").value = book.description || "";

    // populate category select (reuse categories loaded)
    const editCat = document.getElementById("edit-category");
    editCat.innerHTML = `<option value="">Select Category</option>`;
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.category_id;
      opt.textContent = c.name;
      if (String(c.category_id) === String(book.category_id)) opt.selected = true;
      editCat.appendChild(opt);
    });

    // show modal
    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
    // focus first input for keyboard UX
    setTimeout(() => document.getElementById("edit-title").focus(), 40);
  }

  // cancel / close modal
  cancelEditBtn.addEventListener("click", () => {
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
  });
  closeEdit.addEventListener("click", () => {
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
  });
  // close when clicking outside modal content
  editModal.addEventListener("click", (ev) => {
    if (ev.target === editModal) {
      editModal.classList.add("hidden");
      editModal.setAttribute("aria-hidden", "true");
    }
  });

  // edit submit
  editForm.addEventListener("submit", async (e) =>{
    e.preventDefault();
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

    try {
      const res = await fetch(`${API.BOOKS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      editModal.classList.add("hidden");
      editModal.setAttribute("aria-hidden", "true");
      await loadBooks();
      alert("Book updated.");
    } catch (err) {
      console.error("Update:", err);
      alert("Failed to update book. See console.");
    }
  });

  // ----- Search -----
  searchBar.addEventListener("input", () => {
    const q = searchBar.value.trim().toLowerCase();
    if (!q) return renderBooks(books);
    const filtered = books.filter(b =>
      (b.title || "").toLowerCase().includes(q) ||
      (b.author || "").toLowerCase().includes(q) ||
      (b.isbn || "").toLowerCase().includes(q)
    );
    renderBooks(filtered);
  });

  // ----- Logout -----
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    window.location.href = "login.html";
  });

  // ----- Init -----
  (async function init(){
    await loadCategories();
    await loadBooks();
  })();
});
