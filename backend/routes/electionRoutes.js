const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getAllElections,
  getCandidatesByElection,
  voteInElection,
  getElectionResults
} = require("../controllers/electionController");

const router = express.Router();

router.get("/", optionalAuthMiddleware, getAllElections);
router.get("/:electionId/candidates", getCandidatesByElection);
router.get("/:electionId/results", getElectionResults);
router.post("/vote", authMiddleware, roleMiddleware("voter"), voteInElection);

module.exports = router;
