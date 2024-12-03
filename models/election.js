const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    electionName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    electionType: {
      type: String,
      enum: ["single-choice", "multiple-choice", "ranked-choice"],
      required: true,
    },
    votingFormat: {
      type: String,
      enum: ["public", "private", "confidential"],
      required: true,
    },
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate", // Assuming you have a Candidate schema
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Election = mongoose.model("Election", electionSchema);
module.exports = Election;
