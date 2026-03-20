const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    party: {
      type: String,
      required: true,
      trim: true
    },
    symbol: {
      type: String,
      default: "/images/default-party.svg",
      trim: true
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);
