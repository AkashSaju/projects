document.addEventListener("DOMContentLoaded", () => {
    // Login form handler
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
  
        const messageEl = document.getElementById("loginMessage");
  
        if (!email || !password) {
          messageEl.textContent = "All fields are required.";
          messageEl.className = "message error";
          return;
        }
  
        // Simulate API call
        fetch("/api/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
          headers: { "Content-Type": "application/json" }
        })
        .then(() => {
          messageEl.textContent = "Login successful! (Simulated)";
          messageEl.className = "message success";
        })

        // Simulate delay, then redirect
        setTimeout(() => {
            window.location.href = "product_listing.html";
          }, 1000); // wait 1 second before redirect
        })
        .catch(() => {
          messageEl.textContent = "Login failed. (Simulated)";
          messageEl.className = "message error";
        });
      });
    }
  
    // Register form handler
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      const userTypeInputs = document.querySelectorAll("input[name='userType']");
      const farmerFields = document.getElementById("farmerFields");
  
      // Toggle farmer-specific fields
      userTypeInputs.forEach(input => {
        input.addEventListener("change", () => {
          if (input.value === "farmer") {
            farmerFields.style.display = "block";
          } else {
            farmerFields.style.display = "none";
          }
        });
      });
  
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const contact = document.getElementById("contact").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const terms = document.getElementById("terms").checked;
        const userType = [...userTypeInputs].find(i => i.checked)?.value;
  
        const messageEl = document.getElementById("registerMessage");
  
        if (!userType || !fullName || !email || !contact || !password || !confirmPassword) {
          messageEl.textContent = "Please fill all required fields.";
          messageEl.className = "message error";
          return;
        }
  
        if (password !== confirmPassword) {
          messageEl.textContent = "Passwords do not match.";
          messageEl.className = "message error";
          return;
        }
  
        if (!terms) {
          messageEl.textContent = "You must accept the Terms & Conditions.";
          messageEl.className = "message error";
          return;
        }
  
        // Simulate API call
        fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({ userType, fullName, email, contact }),
          headers: { "Content-Type": "application/json" }
        })
        .then(() => {
          messageEl.textContent = "Registration successful! (Simulated)";
          messageEl.className = "message success";
        })
        .catch(() => {
          messageEl.textContent = "Registration failed. (Simulated)";
          messageEl.className = "message error";
        });
      });
    }
  });
  