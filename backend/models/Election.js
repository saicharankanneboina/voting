const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ["General", "Local", "University"],
      required: true
    },
    status: {
      type: String,
      enum: ["Active", "Upcoming", "Ended"],
      default: "Upcoming"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Election", electionSchema);
