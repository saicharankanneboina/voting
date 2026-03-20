const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const Vote = require("../models/Vote");

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalElections, totalCandidates, registeredVoters, totalVotesCast] = await Promise.all([
      Election.countDocuments(),
      Candidate.countDocuments(),
      User.countDocuments({ role: "voter" }),
      Vote.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalElections,
        totalCandidates,
        registeredVoters,
        totalVotesCast
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load dashboard stats." });
  }
};

exports.createElection = async (req, res) => {
  try {
    const { title, description, date, type, status } = req.body;

    if (!title || !description || !date || !type || !status) {
      return res.status(400).json({ success: false, message: "All election fields are required." });
    }

    const election = await Election.create({ title, description, date, type, status });
    res.status(201).json({ success: true, message: "Election created.", data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create election." });
  }
};

exports.updateElection = async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(req.params.electionId, req.body, {
      new: true,
      runValidators: true
    });

    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }

    res.json({ success: true, message: "Election updated.", data: election });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update election." });
  }
};

exports.addCandidate = async (req, res) => {
  try {
    const { name, party, symbol, electionId } = req.body;

    if (!name || !party || !electionId) {
      return res.status(400).json({ success: false, message: "Candidate name, party, and election are required." });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }

    const candidate = await Candidate.create({ name, party, symbol, electionId });
    res.status(201).json({ success: true, message: "Candidate added.", data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add candidate." });
  }
};

exports.getVoters = async (req, res) => {
  try {
    const voters = await User.find({ role: "voter" }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: voters });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch voters." });
  }
};

exports.verifyVoter = async (req, res) => {
  try {
    const voter = await User.findOneAndUpdate(
      { _id: req.params.userId, role: "voter" },
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!voter) {
      return res.status(404).json({ success: false, message: "Voter not found." });
    }

    res.json({ success: true, message: "Voter verified.", data: voter });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to verify voter." });
  }
};
