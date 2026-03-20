export function renderNavbar(page, user) {
  const root = document.getElementById("navbar-root");
  if (!root) return;

  const authLinks = user
    ? `
      <div class="nav-auth">
        <span class="nav-user-chip">${user.role === "admin" ? "Admin" : "Voter"}</span>
        <button class="btn btn-secondary" onclick="handleLogout()">Logout</button>
      </div>
    `
    : `
      <div class="nav-auth">
        <button class="btn btn-secondary" onclick="openAuthModal('login')">Login</button>
        <button class="btn btn-primary" onclick="openAuthModal('register')">Register</button>
      </div>
    `;

  root.innerHTML = `
    <nav class="navbar surface-card">
      <a class="nav-logo" href="/">Online Voting Management System</a>
      <div class="nav-links">
        <a class="${page === "home" ? "active" : ""}" href="/">Home</a>
        <a href="/#about">About</a>
        <a class="${page === "elections" ? "active" : ""}" href="/elections">Elections</a>
        ${user && user.role === "admin" ? `<a class="${page === "admin" ? "active" : ""}" href="/admin-dashboard">Dashboard</a>` : ""}
      </div>
      ${authLinks}
    </nav>
  `;
}
