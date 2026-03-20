import { api, showToast } from "../services/api.js";

const tabs = ["Ongoing Elections", "Upcoming Elections", "Past Elections"];
const statusMap = {
  "Ongoing Elections": "Active",
  "Upcoming Elections": "Upcoming",
  "Past Elections": "Ended"
};

export async function renderElectionsPage({ authStore, openAuthModal }) {
  const grid = document.getElementById("elections-grid");
  const tabsRoot = document.getElementById("tabs-root");
  const drawerRoot = document.getElementById("drawer-root");
  let activeTab = tabs[0];
  let elections = [];

  function renderTabs() {
    tabsRoot.innerHTML = tabs
      .map(
        (tab) => `
          <button class="tab-chip ${tab === activeTab ? "active" : ""}" data-tab="${tab}" type="button">${tab}</button>
        `
      )
      .join("");

    tabsRoot.querySelectorAll(".tab-chip").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.tab;
        renderTabs();
        renderCards();
      });
    });
  }

  function renderCards() {
    const currentUser = authStore.getUser();
    const filtered = elections.filter((election) => election.status === statusMap[activeTab]);

    if (!filtered.length) {
      grid.innerHTML = `<div class="surface-card empty-state">No elections found in this category.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (election) => `
          <article class="surface-card election-card">
            <div class="card-topline">
              <span class="status-badge status-${election.status.toLowerCase()}">${election.status}</span>
              <span class="muted">${new Date(election.date).toLocaleDateString()}</span>
            </div>
            <h3>${election.title}</h3>
            <p>${election.description}</p>
            <div class="card-meta">
              <span>Type: ${election.type}</span>
              <span>Candidates: ${election.candidateCount}</span>
            </div>
            <div class="card-actions">
              <button class="btn btn-primary" data-action="vote" data-id="${election._id}" type="button">
                ${
                  currentUser?.role === "voter" && election.status === "Active"
                    ? election.hasVoted
                      ? "Vote Recorded"
                      : "Vote Now"
                    : "Login to Vote"
                }
              </button>
              <button class="btn btn-secondary" data-action="candidates" data-id="${election._id}" type="button">View Candidates</button>
              <button class="btn btn-secondary" data-action="results" data-id="${election._id}" type="button">View Results</button>
            </div>
          </article>
        `
      )
      .join("");

    grid.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleCardAction(button.dataset.action, button.dataset.id));
    });
  }

  async function openDrawer(title, body) {
    drawerRoot.innerHTML = `
      <div class="drawer-backdrop">
        <aside class="drawer surface-card">
          <div class="drawer-header">
            <h2>${title}</h2>
            <button class="modal-close" id="drawer-close" type="button">&times;</button>
          </div>
          <div class="drawer-content">${body}</div>
        </aside>
      </div>
    `;

    drawerRoot.querySelector("#drawer-close")?.addEventListener("click", () => {
      drawerRoot.innerHTML = "";
    });

    drawerRoot.querySelector(".drawer-backdrop")?.addEventListener("click", (event) => {
      if (event.target.classList.contains("drawer-backdrop")) {
        drawerRoot.innerHTML = "";
      }
    });
  }

  async function handleCardAction(action, electionId) {
    const user = authStore.getUser();
    const election = elections.find((item) => item._id === electionId);

    if (!election) return;

    if (action === "vote") {
      if (!user) {
        openAuthModal("login");
        return;
      }

      if (user.role !== "voter") {
        showToast("Only voter accounts can cast votes.", "error");
        return;
      }

      if (election.status !== "Active") {
        showToast("Voting is only available for active elections.", "error");
        return;
      }

      if (election.hasVoted) {
        showToast("Your vote has already been recorded for this election.");
        return;
      }

      const candidatesResponse = await api.getCandidates(electionId);
      const candidatesMarkup = candidatesResponse.data
        .map(
          (candidate) => `
            <label class="candidate-option symbol-choice">
              <input type="radio" name="candidateId" value="${candidate._id}" />
              <span class="symbol-card">
                <img src="${candidate.symbol || "/images/default-party.svg"}" alt="${candidate.party} symbol" class="party-symbol-image" />
                <span class="candidate-copy">
                  <strong>${candidate.name}</strong>
                  <small>${candidate.party}</small>
                </span>
              </span>
            </label>
          `
        )
        .join("");

      await openDrawer(
        election.title,
        `
          <form id="vote-form" class="stack-form">
            <p class="muted">Select one candidate. SmartVote enforces one vote per election.</p>
            ${candidatesMarkup}
            <button class="btn btn-primary" type="submit">Submit Vote</button>
          </form>
        `
      );

      document.getElementById("vote-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const selected = new FormData(event.currentTarget).get("candidateId");
        if (!selected) {
          showToast("Choose a candidate before submitting.", "error");
          return;
        }

        try {
          await api.vote({ electionId, candidateId: selected });
          showToast("Vote cast successfully.", "success");
          drawerRoot.innerHTML = "";
          await loadElections();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    }

    if (action === "candidates") {
      try {
        const response = await api.getCandidates(electionId);
        const body = response.data.length
          ? response.data
              .map(
                (candidate) => `
                  <div class="list-item">
                    <span class="candidate-with-symbol">
                      <img src="${candidate.symbol || "/images/default-party.svg"}" alt="${candidate.party} symbol" class="party-symbol-image small" />
                      <span class="candidate-copy">
                        <strong>${candidate.name}</strong>
                        <small>${candidate.party}</small>
                      </span>
                    </span>
                    <span>${candidate.votes} votes</span>
                  </div>
                `
              )
              .join("")
          : `<div class="empty-state">No candidates added yet.</div>`;
        await openDrawer(`${election.title} Candidates`, body);
      } catch (error) {
        showToast(error.message, "error");
      }
    }

    if (action === "results") {
      try {
        const response = await api.getResults(electionId);
        const body = response.data.candidates
          .map((candidate, index) => {
            const winnerLabel = index === 0 ? `<span class="status-badge status-ended">Leading</span>` : "";
            return `
              <div class="list-item">
                <span class="candidate-with-symbol">
                  <img src="${candidate.symbol || "/images/default-party.svg"}" alt="${candidate.party} symbol" class="party-symbol-image small" />
                  <span class="candidate-copy">
                    <strong>${candidate.name}</strong>
                    <small>${candidate.party}</small>
                    ${winnerLabel}
                  </span>
                </span>
                <span>${candidate.votes} votes</span>
              </div>
            `;
          })
          .join("");
        await openDrawer(`${election.title} Results`, body);
      } catch (error) {
        showToast(error.message, "error");
      }
    }
  }

  async function loadElections() {
    try {
      const response = await api.getElections();
      elections = response.data;
      renderTabs();
      renderCards();
    } catch (error) {
      grid.innerHTML = `<div class="surface-card empty-state">${error.message}</div>`;
    }
  }

  await loadElections();
}
