const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    dob: {
      type: Date
    },
    age: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"]
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "voter"],
      required: true
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election"
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
