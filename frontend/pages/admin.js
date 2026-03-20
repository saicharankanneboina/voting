import { api, showToast } from "../services/api.js";
import { renderNavbar } from "../components/navbar.js";

const statCards = [
  { key: "electionName", label: "Election Name" },
  { key: "totalCandidates", label: "Total Candidates" },
  { key: "registeredVoters", label: "Registered Voters" },
  { key: "totalVotesCast", label: "Total Votes Cast" },
  { key: "winnerText", label: "Winner" }
];

export async function renderAdminPage({ authStore, openAuthModal }) {
  const user = authStore.getUser();
  if (!user || user.role !== "admin") {
    openAuthModal("login");
    return;
  }

  const statsGrid = document.getElementById("stats-grid");
  const statsElectionSelect = document.getElementById("stats-election-select");
  const electionSummaryRoot = document.getElementById("election-summary-root");
  const electionRoot = document.getElementById("manage-elections-root");
  const votersRoot = document.getElementById("voters-root");
  const electionSelect = document.getElementById("candidate-election-select");
  const countsChartCanvas = document.getElementById("counts-chart");
  const votesChartCanvas = document.getElementById("votes-chart");
  const createElectionForm = document.getElementById("create-election-form");
  const addCandidateForm = document.getElementById("add-candidate-form");
  let elections = [];
  let countsChart = null;
  let votesChart = null;
  let electionStats = [];

  function getSelectedStats() {
    if (!electionStats.length) return null;
    return electionStats.find((item) => item.electionId === statsElectionSelect.value) || electionStats[0];
  }

  function renderElectionSelect() {
    statsElectionSelect.innerHTML = electionStats
      .map((item) => `<option value="${item.electionId}">${item.electionName}</option>`)
      .join("");
  }

  function renderStatsCards() {
    const selected = getSelectedStats();

    if (!selected) {
      statsGrid.innerHTML = `<div class="surface-card empty-state">No election stats available.</div>`;
      return;
    }

    const statsData = {
      ...selected,
      winnerText: selected.winner ? `${selected.winner.name} (${selected.winner.votes} votes)` : "Voting in progress"
    };

    statsGrid.innerHTML = statCards
      .map(
        (stat) => `
          <article class="surface-card stat-card">
            <span>${stat.label}</span>
            <strong>${statsData[stat.key]}</strong>
          </article>
        `
      )
      .join("");
  }

  function renderElectionSummaries() {
    electionSummaryRoot.innerHTML = electionStats
      .map(
        (item) => `
          <div class="list-item list-item-stack">
            <div>
              <strong>${item.electionName}</strong>
              <span class="muted">
                Candidates: ${item.totalCandidates} | Voters: ${item.registeredVoters} | Votes: ${item.totalVotesCast}
              </span>
            </div>
            <div>
              <span class="status-badge ${item.winner ? "status-ended" : "status-upcoming"}">
                ${item.winner ? `Winner: ${item.winner.name}` : "Winner pending"}
              </span>
            </div>
          </div>
        `
      )
      .join("");
  }

  function destroyCharts() {
    if (countsChart) {
      countsChart.destroy();
      countsChart = null;
    }

    if (votesChart) {
      votesChart.destroy();
      votesChart = null;
    }
  }

  function renderCharts() {
    const selected = getSelectedStats();
    if (!selected || !window.Chart) return;

    destroyCharts();

    countsChart = new window.Chart(countsChartCanvas, {
      type: "bar",
      data: {
        labels: ["Candidates", "Voters", "Votes"],
        datasets: [
          {
            label: selected.electionName,
            data: [selected.totalCandidates, selected.registeredVoters, selected.totalVotesCast],
            backgroundColor: ["#5b8cff", "#8f5dff", "#57c3a2"],
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
            text: `Election Counts - ${selected.electionName}`
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

    votesChart = new window.Chart(votesChartCanvas, {
      type: "pie",
      data: {
        labels: selected.candidates.map((candidate) => candidate.party || candidate.name),
        datasets: [
          {
            data: selected.candidates.map((candidate) => candidate.votes),
            backgroundColor: ["#5b8cff", "#8f5dff", "#57c3a2", "#ff9b6a", "#6f78ff"],
            borderColor: "#ffffff",
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Vote Distribution - ${selected.electionName}`
          }
        }
      }
    });
  }

  async function loadElectionStats() {
    const response = await api.getElectionStats();
    electionStats = response.data;
    renderElectionSelect();
    renderStatsCards();
    renderElectionSummaries();
    renderCharts();
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
          await Promise.all([loadElections(), loadElectionStats()]);
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
      await Promise.all([loadElections(), loadElectionStats()]);
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
      await Promise.all([loadElections(), loadElectionStats()]);
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  statsElectionSelect.addEventListener("change", () => {
    renderStatsCards();
    renderCharts();
  });

  try {
    await Promise.all([loadElections(), loadElectionStats(), loadVoters()]);
    renderNavbar("admin", user);
  } catch (error) {
    showToast(error.message, "error");
  }
}
