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
        window.location.href = "index.html";
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    }
  });
});
