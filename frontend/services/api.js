const API_BASE = "/api";
const TOKEN_KEY = "smartvote_token";
const USER_KEY = "smartvote_user";

export const authStore = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request(path, options = {}) {
  const token = authStore.getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  register(payload) {
    return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
  },
  login(payload) {
    return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
  },
  getElections() {
    return request("/elections");
  },
  getCandidates(electionId) {
    return request(`/elections/${electionId}/candidates`);
  },
  getResults(electionId) {
    return request(`/elections/${electionId}/results`);
  },
  vote(payload) {
    return request("/elections/vote", { method: "POST", body: JSON.stringify(payload) });
  },
  getAdminStats() {
    return request("/admin/stats");
  },
  getElectionStats(electionId = "") {
    const query = electionId ? `?electionId=${encodeURIComponent(electionId)}` : "";
    return request(`/admin/election-stats${query}`);
  },
  createElection(payload) {
    return request("/admin/elections", { method: "POST", body: JSON.stringify(payload) });
  },
  updateElection(id, payload) {
    return request(`/admin/elections/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  addCandidate(payload) {
    return request("/admin/candidates", { method: "POST", body: JSON.stringify(payload) });
  },
  getVoters() {
    return request("/admin/voters");
  },
  verifyVoter(userId) {
    return request(`/admin/voters/${userId}/verify`, { method: "PATCH" });
  }
};

export function showToast(message, variant = "default") {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.dataset.variant = variant;
  toast.classList.add("visible");

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2800);
}

export function handleLogout() {
  authStore.clearSession();
  window.location.href = "/";
}
