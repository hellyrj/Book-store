// categories.js
export const categories = [
  {
    name: "Fiction",
    subcategories: [
      "Contemporary",
      "Classics",
      "Mystery & Thriller",
      "Science Fiction & Fantasy",
      "Romance",
      "Historical Fiction"
    ]
  },
  {
    name: "Non-Fiction",
    subcategories: [
      "Biographies & Memoirs",
      "History & Politics",
      "Self-Help & Personal Growth",
      "Business & Economics",
      "Science & Technology",
      "Philosophy & Religion",
      "Health, Wellness & Fitness",
      "Travel & Adventure"
    ]
  },
  {
    name: "Children & Young Adults",
    subcategories: [
      "Picture Books",
      "Middle Grade",
      "Young Adult Fiction",
      "Educational Books",
      "Comics & Graphic Novels"
    ]
  },
  {
    name: "Academic & Professional",
    subcategories: [
      "Textbooks",
      "Reference",
      "Law",
      "Medicine",
      "Engineering & Technology",
      "Social Sciences"
    ]
  },
  {
    name: "Special Collections",
    subcategories: [
      "Best Sellers",
      "New Releases",
      "Award Winners",
      "Staff Picks",
      "Limited Editions",
      "Signed Copies"
    ]
  }
];

// simple mapping from Google API categories or keywords to your subcategories
export const categoryMap = {
  "Science Fiction": "Science Fiction & Fantasy",
  "Fantasy": "Science Fiction & Fantasy",
  "Mystery": "Mystery & Thriller",
  "Thriller": "Mystery & Thriller",
  "Romance": "Romance",
  "Biography": "Biographies & Memoirs",
  "History": "History & Politics",
  "Self-Help": "Self-Help & Personal Growth",
  "Business": "Business & Economics",
  "Technology": "Science & Technology",
  "Health": "Health, Wellness & Fitness",
  "Travel": "Travel & Adventure",
  "Children": "Picture Books",
  "Young Adult": "Young Adult Fiction",
  "Education": "Educational Books",
  "Comic": "Comics & Graphic Novels"
};
