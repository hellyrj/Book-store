// Load a few categories on homepage
async function loadHomeCategories() {
  try {
    const res = await fetch("./api/categories");
    const categories = await res.json();

    const container = document.getElementById("home-categories");
    // Show only first 4 categories
    const preview = categories.slice(0, 4);

    container.innerHTML = preview
      .map(
        (cat) => `
        <div class="category-card">
          <h3>${cat.name}</h3>
          <p>${cat.description || "Explore our ${cat.name} collection"}</p>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Error loading categories", err);
  }
}

document.addEventListener("DOMContentLoaded", loadHomeCategories);
