const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  getDashboardStats,
  getElectionWiseStats,
  createElection,
  updateElection,
  addCandidate,
  getVoters,
  verifyVoter
} = require("../controllers/adminController");

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/stats", getDashboardStats);
router.get("/election-stats", getElectionWiseStats);
router.post("/elections", createElection);
router.put("/elections/:electionId", updateElection);
router.post("/candidates", addCandidate);
router.get("/voters", getVoters);
router.patch("/voters/:userId/verify", verifyVoter);

module.exports = router;
