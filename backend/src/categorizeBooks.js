// categorizeBooks.js
import pool from "./db.js"; // your database connection
import { categories, categoryMap } from "./categories.js";

function categorizeBook(book) {
  let mainCategory = null;
  let subCategory = null;

  // First try Google API category
  if (book.google_categories && book.google_categories.length > 0) {
    for (const cat of book.google_categories) {
      if (categoryMap[cat]) {
        subCategory = categoryMap[cat];
        break;
      }
    }
  }

  // If no match, try title/description keywords
  if (!subCategory) {
    const text = `${book.title} ${book.description || ""}`.toLowerCase();
    for (const key in categoryMap) {
      if (text.includes(key.toLowerCase())) {
        subCategory = categoryMap[key];
        break;
      }
    }
  }

  // Get main category from subcategory
  if (subCategory) {
    mainCategory = categories.find(c => c.subcategories.includes(subCategory))?.name || null;
  }

  return { mainCategory, subCategory };
}

async function categorizeAllBooks() {
  try {
    const res = await pool.query("SELECT * FROM books");
    const books = res.rows;

    for (const book of books) {
      const { mainCategory, subCategory } = categorizeBook(book);

      await pool.query(
        "UPDATE books SET main_category=$1, sub_category=$2 WHERE book_id=$3",
        [mainCategory, subCategory, book.book_id]
      );

      console.log(`Book "${book.title}" categorized as: ${mainCategory} > ${subCategory}`);
    }

    console.log("All books categorized successfully!");
  } catch (err) {
    console.error("Error categorizing books:", err);
  } finally {
    pool.end();
  }
}

categorizeAllBooks();
