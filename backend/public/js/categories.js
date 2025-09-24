// Load all categories
async function loadAllCategories() {
  try {
    const res = await fetch("/api/categories");
    const categories = await res.json();

    const container = document.getElementById("all-categories");

    container.innerHTML = categories
      .map(
        (cat) => `
        <div class="category-card" onclick="window.location.href='/shop.html?category=${cat.name}'">
          <h3>${cat.name}</h3>
          <p>${cat.description || "Books in " + cat.name}</p>
        </div>
      `
      )
      .join("");

      //add click listener to each category card
      document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
          const category = card.querySelector('h3').innerText;
          window.location.href = `/shop.html?category=${category}`;
        });
      });
  } catch (err) {
    console.error("Error loading categories", err);
  }
}
// Load books for a specific category
async function loadBooksByCategory(category) {
  try {
    const res = await fetch(`/api/books?category=${encodeURIComponent(category)}`);
    const books = await res.json();

    const container = document.getElementById("books-container");
    const title = document.getElementById("books-title");
    title.innerText = `Books in "${category}" Category`;

    if (books.length) {
      container.innerHTML = `<p> No books found in ${category} category.</p>`;
      return;

    }

    container.innerHTML = books 
    .map (
      (book) => `
      <div class="category-card">
      <img src="${book.coverImage || '/images/default-book.png'}" alt="${book.title} cover" />
      <h3>${book.title}</h3>
      <p>by ${book.author}</p>
      <p><strong>$${book.price}</strong></p>
      </div>
      `
    )
    .join("");
  } catch (err) {
    console.error("Error loading books by category", err);
  }
}
document.addEventListener("DOMContentLoaded", loadAllCategories);
