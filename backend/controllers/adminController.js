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

exports.getElectionWiseStats = async (req, res) => {
  try {
    const filter = req.query.electionId ? { _id: req.query.electionId } : {};
    const elections = await Election.find(filter).sort({ date: 1 }).lean();

    if (!elections.length) {
      return res.json({ success: true, data: [] });
    }

    const electionIds = elections.map((election) => election._id);

    const [candidateGroups, voterGroups, voteGroups, voteParticipants] = await Promise.all([
      Candidate.aggregate([
        { $match: { electionId: { $in: electionIds } } },
        {
          $group: {
            _id: "$electionId",
            totalCandidates: { $sum: 1 },
            candidates: {
              $push: {
                id: "$_id",
                name: "$name",
                party: "$party",
                symbol: "$symbol",
                votes: "$votes"
              }
            }
          }
        }
      ]),
      User.aggregate([
        { $match: { role: "voter", electionId: { $in: electionIds } } },
        { $group: { _id: "$electionId", registeredVoters: { $sum: 1 } } }
      ]),
      Vote.aggregate([
        { $match: { electionId: { $in: electionIds } } },
        { $group: { _id: "$electionId", totalVotesCast: { $sum: 1 } } }
      ]),
      Vote.aggregate([
        { $match: { electionId: { $in: electionIds } } },
        { $group: { _id: { electionId: "$electionId", userId: "$userId" } } },
        { $group: { _id: "$_id.electionId", participantCount: { $sum: 1 } } }
      ])
    ]);

    const candidateMap = candidateGroups.reduce((acc, item) => {
      const sortedCandidates = item.candidates.sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));
      acc[item._id.toString()] = {
        totalCandidates: item.totalCandidates,
        candidates: sortedCandidates
      };
      return acc;
    }, {});

    const voterMap = voterGroups.reduce((acc, item) => {
      acc[item._id.toString()] = item.registeredVoters;
      return acc;
    }, {});

    const voteMap = voteGroups.reduce((acc, item) => {
      acc[item._id.toString()] = item.totalVotesCast;
      return acc;
    }, {});

    const participantMap = voteParticipants.reduce((acc, item) => {
      acc[item._id.toString()] = item.participantCount;
      return acc;
    }, {});

    const data = elections.map((election) => {
      const key = election._id.toString();
      const candidateInfo = candidateMap[key] || { totalCandidates: 0, candidates: [] };
      const totalVotesCast = voteMap[key] || 0;
      const registeredVoters = Math.max(voterMap[key] || 0, participantMap[key] || 0);
      const isCompleted = election.status === "Ended";
      const winnerCandidate = isCompleted && candidateInfo.candidates.length ? candidateInfo.candidates[0] : null;

      return {
        electionId: election._id,
        electionName: election.title,
        status: election.status,
        totalCandidates: candidateInfo.totalCandidates,
        registeredVoters,
        totalVotesCast,
        winner: winnerCandidate
          ? {
              name: winnerCandidate.name,
              party: winnerCandidate.party,
              votes: winnerCandidate.votes
            }
          : null,
        candidates: candidateInfo.candidates
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load election-wise stats." });
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
