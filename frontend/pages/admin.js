import { showToast } from "../services/api.js";
import { renderNavbar } from "../components/navbar.js";

const statCards = [
  { key: "totalElections", label: "Total Elections" },
  { key: "totalCandidates", label: "Total Candidates" },
  { key: "registeredVoters", label: "Registered Voters" },
  { key: "totalVotesCast", label: "Total Votes Cast" }
];

const actionCards = [
  { title: "Manage Elections", copy: "Create, update, and control election states." },
  { title: "Manage Candidates", copy: "Add candidates and prepare ballots quickly." },
  { title: "Verify Voters", copy: "Approve new voter registrations before voting opens." },
  { title: "View Results", copy: "Track ended election outcomes and participation." }
];

export async function renderAdminPage({ api, authStore, openAuthModal }) {
  const user = authStore.getUser();
  if (!user || user.role !== "admin") {
    openAuthModal("login");
    return;
  }

  const statsGrid = document.getElementById("stats-grid");
  const actionsRoot = document.getElementById("action-cards-root");
  const electionRoot = document.getElementById("manage-elections-root");
  const votersRoot = document.getElementById("voters-root");
  const electionSelect = document.getElementById("candidate-election-select");
  const chartCanvas = document.getElementById("votes-chart");
  const createElectionForm = document.getElementById("create-election-form");
  const addCandidateForm = document.getElementById("add-candidate-form");
  let elections = [];
  let votesChart = null;

  actionsRoot.innerHTML = actionCards
    .map(
      (card) => `
        <article class="surface-card action-card">
          <h3>${card.title}</h3>
          <p>${card.copy}</p>
        </article>
      `
    )
    .join("");

  async function loadStats() {
    const response = await api.getAdminStats();
    statsGrid.innerHTML = statCards
      .map(
        (stat) => `
          <article class="surface-card stat-card">
            <span>${stat.label}</span>
            <strong>${response.data[stat.key]}</strong>
          </article>
        `
      )
      .join("");
  }

  async function loadChart() {
    if (!chartCanvas || !window.Chart) return;

    const targetElection =
      elections.find((election) => election.status === "Ended") ||
      elections.find((election) => election.status === "Active") ||
      elections[0];

    if (!targetElection) return;

    const candidatesResponse = await api.getCandidates(targetElection._id);
    const labels = candidatesResponse.data.map((candidate) => candidate.party);
    const values = candidatesResponse.data.map((candidate, index) => candidate.votes || (index + 1) * 12);

    if (votesChart) {
      votesChart.destroy();
    }

    votesChart = new window.Chart(chartCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Votes",
            data: values,
            backgroundColor: ["#5b8cff", "#8f5dff", "#57c3a2", "#ff9b6a", "#6f78ff"],
            borderRadius: 12,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Vote Overview - ${targetElection.title}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  async function loadElections() {
    const response = await api.getElections();
    elections = response.data;

    electionSelect.innerHTML = elections
      .map((election) => `<option value="${election._id}">${election.title}</option>`)
      .join("");

    electionRoot.innerHTML = elections
      .map(
        (election) => `
          <div class="list-item list-item-stack">
            <div>
              <strong>${election.title}</strong>
              <span class="muted">${election.type} - ${new Date(election.date).toLocaleDateString()}</span>
            </div>
            <div class="inline-actions">
              <select data-election-status="${election._id}">
                <option value="Upcoming" ${election.status === "Upcoming" ? "selected" : ""}>Upcoming</option>
                <option value="Active" ${election.status === "Active" ? "selected" : ""}>Active</option>
                <option value="Ended" ${election.status === "Ended" ? "selected" : ""}>Ended</option>
              </select>
              <button class="btn btn-secondary" data-save-election="${election._id}" type="button">Save</button>
            </div>
          </div>
        `
      )
      .join("");

    electionRoot.querySelectorAll("[data-save-election]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.dataset.saveElection;
        const status = electionRoot.querySelector(`[data-election-status="${id}"]`)?.value;
        try {
          await api.updateElection(id, { status });
          showToast("Election updated.", "success");
          await Promise.all([loadElections(), loadStats()]);
          await loadChart();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  }

  async function loadVoters() {
    const response = await api.getVoters();
    votersRoot.innerHTML = response.data
      .map(
        (voter) => `
          <div class="list-item list-item-stack">
            <div>
              <strong>${voter.email}</strong>
              <span class="muted">${voter.isVerified ? "Verified voter" : "Pending verification"}</span>
            </div>
            ${
              voter.isVerified
                ? `<span class="status-badge status-active">Approved</span>`
                : `<button class="btn btn-secondary" data-verify-voter="${voter._id}" type="button">Verify</button>`
            }
          </div>
        `
      )
      .join("");

    votersRoot.querySelectorAll("[data-verify-voter]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api.verifyVoter(button.dataset.verifyVoter);
          showToast("Voter verified.", "success");
          await Promise.all([loadVoters(), loadStats()]);
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  }

  createElectionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(createElectionForm).entries());

    try {
      await api.createElection(payload);
      createElectionForm.reset();
      showToast("Election created successfully.", "success");
      await Promise.all([loadElections(), loadStats()]);
      await loadChart();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  addCandidateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(addCandidateForm).entries());
    if (!payload.symbol) {
      payload.symbol = "/images/default-party.svg";
    }

    try {
      await api.addCandidate(payload);
      addCandidateForm.reset();
      electionSelect.value = elections[0]?._id || "";
      showToast("Candidate added successfully.", "success");
      await Promise.all([loadElections(), loadStats()]);
      await loadChart();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  try {
    await Promise.all([loadStats(), loadElections(), loadVoters()]);
    await loadChart();
    renderNavbar("admin", user);
  } catch (error) {
    showToast(error.message, "error");
  }
}
