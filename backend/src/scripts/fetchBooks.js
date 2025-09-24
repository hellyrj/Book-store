// src/scripts/fetchBooks.js
import axios from "axios";
import pool from "../db.js";

// -------------------------
// 1️⃣ Main categories
// -------------------------
const mainCategories = [
  "Fiction",
  "Contemporary",
  "Classics",
  "Mystery & Thriller",
  "Science Fiction & Fantasy",
  "Romance",
  "Historical Fiction",
  "Non-Fiction",
  "Biographies & Memoirs",
  "History & Politics",
  "Self-Help & Personal Growth",
  "Business & Economics",
  "Science & Technology",
  "Philosophy & Religion",
  "Health, Wellness & Fitness",
  "Travel & Adventure",
  "Children & Young Adults",
  "Picture Books",
  "Middle Grade",
  "Young Adult Fiction",
  "Educational Books",
  "Comics & Graphic Novels",
  "Academic & Professional",
  "Textbooks",
  "Reference",
  "Law",
  "Medicine",
  "Engineering & Technology",
  "Social Sciences",
  "Special Collections"
];

// -------------------------
// 2️⃣ Special categories
// -------------------------
const specialCategories = {
  "Best Sellers": "best+sellers",
  "Award Winners": "award+winning",
  "Staff Picks": "editor's+choice"
};

// -------------------------
// 3️⃣ Config
// -------------------------
const booksPerCategory = 60;
const maxResultsPerRequest = 40;
const minYear = 2019; // filter books by year

// -------------------------
// 4️⃣ Helpers
// -------------------------
function getBestCover(links) {
  return links?.extraLarge || links?.large || links?.medium || links?.thumbnail || null;
}

// Dynamic category matcher
function dynamicCategoryMapper(rawCategory, defaultCategory) {
  if (!rawCategory) return defaultCategory;

  const normalized = rawCategory.trim().toLowerCase();
  // exact match with main categories
  const match = mainCategories.find(c => c.toLowerCase() === normalized);
  if (match) return match;

  // keyword-based match: try fuzzy matching with main categories
  for (let cat of mainCategories) {
    if (normalized.includes(cat.toLowerCase().split(" ")[0])) return cat;
  }

  // fallback to default (the one we are fetching)
  return defaultCategory;
}

// -------------------------
// 5️⃣ Main fetch function
// -------------------------
async function fetchBooks() {
  try {
    const allCategories = [...mainCategories, ...Object.keys(specialCategories)];

    for (let category of allCategories) {
      console.log(`\n📚 Fetching books for category: ${category}`);
      let fetched = 0;

      while (fetched < booksPerCategory) {
        const queryStr = specialCategories[category] || category;
        const response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            queryStr
          )}&startIndex=${fetched}&maxResults=${maxResultsPerRequest}`
        );

        const books = response.data.items;
        if (!books || books.length === 0) break;

        for (let book of books) {
          const info = book.volumeInfo;
          const publishedYear = info.publishedDate?.split("-")[0];
          if (publishedYear && parseInt(publishedYear) < minYear) continue;

          const title = (info.title || "Unknown Title").substring(0, 300);
          const author = info.authors ? info.authors.join(", ").substring(0, 300) : "Unknown Author";
          const isbn =
            info.industryIdentifiers && info.industryIdentifiers[0]
              ? info.industryIdentifiers[0].identifier.replace(/-/g, "")
              : "N/A";
          const price = info.pageCount ? info.pageCount * 0.5 : 10;
          const stock = Math.floor(Math.random() * 20) + 1;
          const description = info.description || "No description available";
          const coverUrl = getBestCover(info.imageLinks);

          const rawCategory = info.categories ? info.categories[0] : category;
          const categoryName = dynamicCategoryMapper(rawCategory, category);

          let catRes = await pool.query(
            "SELECT category_id FROM categories WHERE name=$1",
            [categoryName]
          );
          let categoryId;
          if (catRes.rows.length) {
            categoryId = catRes.rows[0].category_id;
          } else {
            const insertCat = await pool.query(
              "INSERT INTO categories (name) VALUES ($1) RETURNING category_id",
              [categoryName]
            );
            categoryId = insertCat.rows[0].category_id;
          }

          await pool.query(
            `INSERT INTO books 
              (title, author, isbn, price, stock, category_id, description, cover_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (isbn) DO NOTHING`,
            [title, author, isbn, price, stock, categoryId, description, coverUrl]
          );
        }

        fetched += books.length;
        console.log(`✅ Fetched ${fetched} books for category: ${category}`);
      }
    }

    console.log("\n🎉 All categories processed successfully!");
  } catch (err) {
    console.error("❌ Error fetching books:", err.message);
  } finally {
    pool.end();
  }
}

fetchBooks();
