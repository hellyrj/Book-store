// Mobile Menu Toggle for Review Page
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initReviewForm();
    updateCartWishlistCounts();
});

// Mobile menu functionality
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const navOverlay = document.getElementById('navOverlay');

    if (!menuToggle || !mainNav || !navOverlay) {
        console.error('Mobile menu elements not found');
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

// Update cart and wishlist counts
async function updateCartWishlistCounts() {
    try {
        const token = sessionStorage.getItem("token");
        if (!token) return;

        const baseUrl = 'http://localhost:3000/api';

        // Update cart count
        const cartResponse = await fetch(`${baseUrl}/orders/cart`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (cartResponse.ok) {
            const cartResult = await cartResponse.json();
            if (cartResult.success) {
                const totalItems = cartResult.data.reduce((total, item) => total + item.quantity, 0);
                const cartCountElement = document.getElementById('cart-count');
                if (cartCountElement) {
                    cartCountElement.textContent = totalItems;
                }
            }
        }

        // Update wishlist count
        const wishlistResponse = await fetch(`${baseUrl}/wishlist`, {
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (wishlistResponse.ok) {
            const wishlistResult = await wishlistResponse.json();
            if (wishlistResult.success) {
                const wishlistCountElement = document.getElementById('wishlist-count');
                if (wishlistCountElement) {
                    wishlistCountElement.textContent = wishlistResult.data.length;
                }
            }
        }
    } catch (error) {
        console.error("Error updating counts:", error);
    }
}

// Review form functionality
function initReviewForm() {
    // Character counters
    const titleInput = document.getElementById('review_title');
    const commentInput = document.getElementById('comment');
    const titleCharCount = document.getElementById('titleCharCount');
    const commentCharCount = document.getElementById('commentCharCount');

    if (titleInput && titleCharCount) {
        titleInput.addEventListener('input', function() {
            const count = this.value.length;
            titleCharCount.textContent = `${count}/200 characters`;
            updateCharCountStyle(this, count, 200, titleCharCount);
        });
    }

    if (commentInput && commentCharCount) {
        commentInput.addEventListener('input', function() {
            const count = this.value.length;
            commentCharCount.textContent = `${count}/1000 characters`;
            updateCharCountStyle(this, count, 1000, commentCharCount);
        });
    }

    // Form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            // Get form data
            const formData = {
                review_title: document.getElementById('review_title').value.trim(),
                comment: document.getElementById('comment').value.trim(),
                guest_name: document.getElementById('guest_name').value.trim(),
                guest_email: document.getElementById('guest_email').value.trim()
            };

            // Validation
            const validation = validateFormData(formData);
            if (!validation.isValid) {
                showMessage(validation.message, 'error');
                return;
            }

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage('✅ Review submitted successfully! It will be visible after admin approval.', 'success');
                    reviewForm.reset();
                    resetCharCounters();
                } else {
                    showMessage('❌ ' + (data.error || 'Error submitting review. Please try again.'), 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('❌ Network error. Please check your connection and try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
            }
        });
    }
}

// Update character count style
function updateCharCountStyle(input, count, maxLength, charCountElement) {
    if (count > maxLength * 0.9) {
        charCountElement.style.color = '#e74c3c';
        input.style.borderColor = '#e74c3c';
    } else if (count > maxLength * 0.75) {
        charCountElement.style.color = '#f39c12';
        input.style.borderColor = '#f39c12';
    } else {
        charCountElement.style.color = 'var(--charcoal)';
        charCountElement.style.opacity = '0.7';
        input.style.borderColor = 'var(--beige)';
    }
}

// Validate form data
function validateFormData(formData) {
    if (!formData.guest_name || formData.guest_name.length < 2) {
        return { isValid: false, message: 'Please enter a valid name with at least 2 characters.' };
    }

    if (!formData.guest_email || !isValidEmail(formData.guest_email)) {
        return { isValid: false, message: 'Please enter a valid email address.' };
    }

    if (!formData.review_title || formData.review_title.length < 5) {
        return { isValid: false, message: 'Please enter a review title with at least 5 characters.' };
    }

    if (!formData.comment || formData.comment.length < 10) {
        return { isValid: false, message: 'Please write a review with at least 10 characters.' };
    }

    if (formData.review_title.length > 200) {
        return { isValid: false, message: 'Review title must be less than 200 characters.' };
    }

    if (formData.comment.length > 1000) {
        return { isValid: false, message: 'Review comment must be less than 1000 characters.' };
    }

    return { isValid: true, message: '' };
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Reset character counters
function resetCharCounters() {
    const titleCharCount = document.getElementById('titleCharCount');
    const commentCharCount = document.getElementById('commentCharCount');
    
    if (titleCharCount) titleCharCount.textContent = '0/200 characters';
    if (commentCharCount) commentCharCount.textContent = '0/1000 characters';
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    // Auto-hide success message after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }

    // Scroll to message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Add CSS for additional styling
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .char-count.warning {
        color: #f39c12 !important;
    }
    
    .char-count.error {
        color: #e74c3c !important;
    }
    
    input.warning, textarea.warning {
        border-color: #f39c12 !important;
    }
    
    input.error, textarea.error {
        border-color: #e74c3c !important;
    }
    
    /* Smooth transitions for all interactive elements */
    .nav a, .badge, .login-btn, .form-group input, 
    .form-group textarea, #submitBtn, .social-links a {
        transition: var(--transition);
    }
`;
document.head.appendChild(additionalStyles);