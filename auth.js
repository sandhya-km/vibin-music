const supabase = window.supabase.createClient(
  "https://qusuysieongbzlgczsha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1c3V5c2llb25nYnpsZ2N6c2hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzQxNDcsImV4cCI6MjA3NDkxMDE0N30.IREkltYFK65lH9BfQjUL4kUWmW7faGc6eGMRfUqyyd8"
);

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");

  // ✅ Register logic
  if (registerForm) {
    registerForm.onsubmit = async (e) => {
      e.preventDefault();
      const rawEmail = document.getElementById("email").value;
      const email = rawEmail.trim().toLowerCase();
      const password = document.getElementById("password").value;

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        alert("Signup failed: " + error.message);
        return;
      }

      alert("Check your email to confirm your account!");
      window.location.href = "index.html";
    };
  }

  // ✅ Login logic with admin email redirect
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const rawEmail = document.getElementById("email").value;
      const email = rawEmail.trim().toLowerCase();
      const password = document.getElementById("password").value;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        alert("Login failed: " + (error?.message || "Unknown error"));
        return;
      }

      // ✅ Redirect based on email
      if (email === "sandhyakm.24mca@jyotinivas.org") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "homepage.html";
      }
    };
  }
});