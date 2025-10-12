//mobile menu toggle 
document.addEventListener('DOMContentLoaded', function () {

  initMobileMenu();
}
);

function initMobileMenu() {

  const menuToggle = document.getElementById('menuToggle');
  const mainNav = document.getElementById('mainNav');
  const navOverlay = document.getElementById('navOverlay');
  const navLinks = document.querySelectorAll('.nav a');

  if (!menuToggle || !mainNav || !navOverlay) {
    console.error('mobile menu elements not found');
  }

  menuToggle.addEventListener('click', function () {
    this.classList.toggle('active');
    mainNav.classList.toggle('active');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';


  });

  navOverlay.addEventListener('click', function () {
    menuToggle.classList.remove('active');
    mainNav.classList.remove('active');
    this.classList.remove('active');
    document.body.this.style.overflow = '';
  });

  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      menuToggle.classList.remove('active');
      mainNav.classList.remove('active');
      navOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

}











document.addEventListener("DOMContentLoaded", () => {


  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default form submission

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      console.log("login response fromm backend:", data);

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ Store JWT token in sessionStorage
      sessionStorage.setItem("token", data.token);

      // ✅ Store user info
      sessionStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "admin-order.html";
      } else {
        window.location.href = "categories.html";
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  });
});
