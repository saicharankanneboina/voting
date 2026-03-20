import { renderNavbar } from "./components/navbar.js";
import { setupAuthModal, openAuthModal } from "./components/authModal.js";
import { api, authStore, handleLogout } from "./services/api.js";
import { renderHomePage } from "./pages/home.js";
import { renderElectionsPage } from "./pages/elections.js";
import { renderAdminPage } from "./pages/admin.js";

window.openAuthModal = openAuthModal;
window.handleLogout = handleLogout;

function boot() {
  const page = document.body.dataset.page;
  setupAuthModal();
  renderNavbar(page, authStore.getUser());

  if (page === "home") {
    renderHomePage();
  }

  if (page === "elections") {
    renderElectionsPage({ api, authStore, openAuthModal });
  }

  if (page === "admin") {
    renderAdminPage({ api, authStore, openAuthModal });
  }
}

boot();
