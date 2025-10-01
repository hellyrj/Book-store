document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  // Password strength indicator
  passwordInput.addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    let strength = 0;
    let text = 'Weak';
    let className = 'weak';
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    switch(strength) {
      case 0:
      case 1:
        text = 'Weak';
        className = 'weak';
        break;
      case 2:
        text = 'Fair';
        className = 'fair';
        break;
      case 3:
        text = 'Good';
        className = 'good';
        break;
      case 4:
        text = 'Strong';
        className = 'strong';
        break;
    }
    
    strengthFill.className = 'strength-fill ' + className;
    strengthText.className = 'strength-text ' + className;
    strengthText.textContent = text;
  });

  // Real-time password confirmation check
  confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
      this.style.borderColor = '#e74c3c';
      this.style.boxShadow = '0 0 0 3px rgba(231, 76, 60, 0.1)';
    } else {
      this.style.borderColor = '';
      this.style.boxShadow = '';
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const termsAccepted = document.getElementById("terms").checked;

    // Client-side validation
    if (!name) {
      alert("Please enter your full name");
      return;
    }

    if (!email) {
      alert("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!password) {
      alert("Please enter a password");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match. Please check your password confirmation.");
      confirmPasswordInput.focus();
      return;
    }

    if (!termsAccepted) {
      alert("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('.register-btn-primary');
    const originalText = submitBtn.querySelector('.btn-text').textContent;
    submitBtn.querySelector('.btn-text').textContent = 'Creating Account...';
    submitBtn.disabled = true;

    try {
      // Use relative URL or environment-based URL
      const apiUrl = '/api/users/register'; // Adjust this to your actual API endpoint
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      alert("Registration successful! Redirecting to login...");

      // Redirect to login page after successful registration
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (err) {
      console.error("Registration error:", err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      // Reset button state
      submitBtn.querySelector('.btn-text').textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Email validation function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});

// Add this CSS for better error states
const errorStyles = `
.form-input.error {
  border-color: #e74c3c !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
}

.error-message {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}
`;

// Inject error styles
const styleSheet = document.createElement('style');
styleSheet.textContent = errorStyles;
document.head.appendChild(styleSheet);