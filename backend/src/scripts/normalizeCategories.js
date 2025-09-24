// src/scripts/normalizeBooks.js
import pool from "../db.js";

// Map any Google/extra categories to your main 35 categories
const categoryMap = {
  "Science Fiction and Fantasy Literature": "Science Fiction & Fantasy",
  "Fictional Space in the Modernist and Post-modernist American Novel": "Fiction",
  "Boys' Life": "Fiction",
  "The Central Literary Magazine": "Fiction",
  "Critical Survey of Long Fiction": "Fiction",
  "Catalogue of books in the lending library. 2nd 10,000": "Fiction",
  "A Catalogue of the Bibliographies of Special Subjects in the Library": "Fiction",
  "Annual Report of the Pomona Public Library": "Fiction",
  "Bookseller & Stationer and Office Equipment Journal": "Fiction",
  "The Bohemian": "Fiction",
  "Wiseman Review": "Fiction",
  "Bulletin of the Public Library of the City of Boston": "Fiction",
  // add other weird categories here if needed
};

async function normalizeBooks() {
  try {
    const booksRes = await pool.query("SELECT * FROM books");
    const books = booksRes.rows;

    for (let book of books) {
      const currentCategoryId = book.category_id;

      // Get category name
      const catRes = await pool.query(
        "SELECT name FROM categories WHERE category_id=$1",
        [currentCategoryId]
      );
      if (!catRes.rows.length) continue;

      const currentName = catRes.rows[0].name;

      // Map to main category if exists
      const mainCategoryName = categoryMap[currentName] || currentName;

      // Get main category_id
      const mainCatRes = await pool.query(
        "SELECT category_id FROM categories WHERE name=$1",
        [mainCategoryName]
      );
      if (!mainCatRes.rows.length) continue;

      const mainCategoryId = mainCatRes.rows[0].category_id;

      // Update book if needed
      if (currentCategoryId !== mainCategoryId) {
        await pool.query(
          "UPDATE books SET category_id=$1 WHERE book_id=$2",
          [mainCategoryId, book.book_id]
        );
        console.log(`✅ Updated "${book.title}" to category "${mainCategoryName}"`);
      }
    }

    console.log("\n🎉 All books normalized successfully!");
  } catch (err) {
    console.error("❌ Error normalizing books:", err);
  } finally {
    pool.end();
  }
}

normalizeBooks();
