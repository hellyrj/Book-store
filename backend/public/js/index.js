 // Mobile menu toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
      document.getElementById('mainNav').classList.toggle('active');
    });
    
    // Cart count (sample data)
    document.getElementById('cart-count').textContent = '0';
    
   // Add to cart functionality for index.html
document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', async function() {
        const bookTitle = this.parentElement.querySelector('.book-title').textContent;
        
        // For demo purposes - in real implementation, you'd need book_id
        // This is a temporary solution until you have proper book data
        try {
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("user"));
            
            if (!token || !user) {
                alert("Please login to add items to your cart");
                window.location.href = "login.html";
                return;
            }

            // Since we don't have real book IDs in the index page,
            // this is a demo implementation
            alert(`"${bookTitle}" would be added to cart (requires proper book ID implementation)`);
            
            // For now, just update the cart count
            let count = parseInt(document.getElementById('cart-count').textContent);
            document.getElementById('cart-count').textContent = count + 1;
            
        } catch (error) {
            console.error("Error adding to cart:", error);
            alert("Error adding to cart. Please try again.");
        }
    });
});
    
    // Newsletter form submission
    document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input').value;
      alert(`Thank you for subscribing with ${email}!`);
      this.reset();
    });
    
    // Animation on scroll
    const observerOptions = {
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.category-card, .book-card').forEach(el => {
      observer.observe(el);
    });