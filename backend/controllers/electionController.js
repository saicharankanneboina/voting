const Election = require("../models/Election");
const Candidate = require("../models/Candidate");
const Vote = require("../models/Vote");

exports.getAllElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ date: 1 }).lean();
    const electionIds = elections.map((election) => election._id);

    const [candidateCounts, voteRecords] = await Promise.all([
      Candidate.aggregate([
        { $match: { electionId: { $in: electionIds } } },
        { $group: { _id: "$electionId", count: { $sum: 1 } } }
      ]),
      req.user
        ? Vote.find({ userId: req.user._id, electionId: { $in: electionIds } }).select("electionId")
        : []
    ]);

    const countMap = candidateCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});

    const votedMap = voteRecords.reduce((acc, vote) => {
      acc[vote.electionId.toString()] = true;
      return acc;
    }, {});

    const data = elections.map((election) => ({
      ...election,
      candidateCount: countMap[election._id.toString()] || 0,
      hasVoted: Boolean(votedMap[election._id.toString()])
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch elections." });
  }
};

exports.getCandidatesByElection = async (req, res) => {
  try {
    const candidates = await Candidate.find({ electionId: req.params.electionId }).sort({ name: 1 });
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch candidates." });
  }
};

exports.voteInElection = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;

    if (!electionId || !candidateId) {
      return res.status(400).json({ success: false, message: "Election and candidate are required." });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }

    if (election.status !== "Active") {
      return res.status(400).json({ success: false, message: "Voting is only open for active elections." });
    }

    const existingVote = await Vote.findOne({ userId: req.user._id, electionId });
    if (existingVote) {
      return res.status(409).json({ success: false, message: "You have already voted in this election." });
    }

    const candidate = await Candidate.findOne({ _id: candidateId, electionId });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found for this election." });
    }

    await Vote.create({
      userId: req.user._id,
      electionId,
      candidateId
    });

    candidate.votes += 1;
    await candidate.save();

    res.json({ success: true, message: "Vote cast successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already voted in this election." });
    }

    res.status(500).json({ success: false, message: "Failed to cast vote." });
  }
};

exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }

    if (election.status !== "Ended") {
      return res.status(403).json({ success: false, message: "Results are only visible after the election ends." });
    }

    const candidates = await Candidate.find({ electionId: election._id }).sort({ votes: -1, name: 1 });
    res.json({
      success: true,
      data: {
        election,
        candidates
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch results." });
  }
};
