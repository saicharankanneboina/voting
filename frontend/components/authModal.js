import { api, authStore, showToast } from "../services/api.js";

let mode = "login";

export function setupAuthModal() {
  const root = document.getElementById("auth-modal-root");
  if (!root) return;

  root.innerHTML = `
    <div class="modal-backdrop hidden" id="auth-backdrop">
      <div class="auth-modal surface-card">
        <button class="modal-close" id="auth-close" type="button">&times;</button>
        <div class="modal-copy">
          <span class="eyebrow">Secure Access</span>
          <h2 id="auth-title">Login to SmartVote</h2>
          <p id="auth-subtitle">Access your role-based dashboard with secure credentials.</p>
        </div>
        <form id="auth-form" class="stack-form">
          <div id="register-fields" class="stack-form register-fields hidden">
            <input type="text" name="fullName" id="register-fullname" placeholder="Full name" />
            <input type="tel" name="phone" id="register-phone" placeholder="Phone number" />
            <input type="date" name="dob" id="register-dob" />
            <input type="number" name="age" id="register-age" placeholder="Age" min="0" />
            <select name="gender" id="register-gender">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <input type="email" name="email" placeholder="Email address" required />
          <input type="password" name="password" placeholder="Password" required />
          <input type="password" name="confirmPassword" id="register-confirm-password" placeholder="Confirm password" class="hidden" />
          <div class="role-select">
            <label><input type="radio" name="role" value="voter" checked /> Voter</label>
            <label><input type="radio" name="role" value="admin" /> Admin</label>
          </div>
          <button class="btn btn-primary full-width" type="submit" id="auth-submit">Login</button>
        </form>
        <button class="text-link" id="auth-toggle" type="button">Register here</button>
      </div>
    </div>
  `;

  const backdrop = document.getElementById("auth-backdrop");
  const form = document.getElementById("auth-form");
  const closeBtn = document.getElementById("auth-close");
  const toggleBtn = document.getElementById("auth-toggle");

  closeBtn.addEventListener("click", closeAuthModal);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeAuthModal();
  });
  toggleBtn.addEventListener("click", () => {
    mode = mode === "login" ? "register" : "login";
    updateModalContent();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = document.getElementById("auth-submit");
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const confirmPassword = payload.confirmPassword;

    try {
      if (mode === "register") {
        if (!payload.fullName || !payload.phone) {
          throw new Error("Full name and phone number are required.");
        }

        if (payload.password !== confirmPassword) {
          throw new Error("Password and confirm password must match.");
        }
      }

      delete payload.confirmPassword;
      submitBtn.disabled = true;
      submitBtn.textContent = mode === "login" ? "Signing in..." : "Creating account...";

      const response = mode === "login" ? await api.login(payload) : await api.register(payload);
      authStore.setSession(response.token, response.user);
      showToast(response.message, "success");

      if (mode === "login") {
        window.location.href = response.redirectTo;
      } else {
        closeAuthModal();
        window.location.href = response.user.role === "admin" ? "/admin-dashboard" : "/elections";
      }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = mode === "login" ? "Login" : "Create Account";
    }
  });
}

function updateModalContent() {
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const submit = document.getElementById("auth-submit");
  const toggle = document.getElementById("auth-toggle");
  const registerFields = document.getElementById("register-fields");
  const fullNameInput = document.getElementById("register-fullname");
  const phoneInput = document.getElementById("register-phone");
  const dobInput = document.getElementById("register-dob");
  const ageInput = document.getElementById("register-age");
  const genderInput = document.getElementById("register-gender");
  const confirmPasswordInput = document.getElementById("register-confirm-password");

  if (mode === "login") {
    title.textContent = "Login to SmartVote";
    subtitle.textContent = "Access your role-based dashboard with secure credentials.";
    submit.textContent = "Login";
    toggle.textContent = "Register here";
    registerFields.classList.add("hidden");
    confirmPasswordInput.classList.add("hidden");
    fullNameInput.required = false;
    phoneInput.required = false;
    dobInput.required = false;
    ageInput.required = false;
    genderInput.required = false;
    confirmPasswordInput.required = false;
  } else {
    title.textContent = "Create your SmartVote account";
    subtitle.textContent = "Register with your details and create a secure SmartVote account.";
    submit.textContent = "Create Account";
    toggle.textContent = "Already have an account? Login here";
    registerFields.classList.remove("hidden");
    confirmPasswordInput.classList.remove("hidden");
    fullNameInput.required = true;
    phoneInput.required = true;
    dobInput.required = true;
    ageInput.required = true;
    genderInput.required = true;
    confirmPasswordInput.required = true;
  }
}

export function openAuthModal(nextMode = "login") {
  mode = nextMode;
  updateModalContent();
  document.getElementById("auth-backdrop")?.classList.remove("hidden");
}

export function closeAuthModal() {
  document.getElementById("auth-backdrop")?.classList.add("hidden");
}
