const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    electionType: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Ended"],
      default: "Upcoming",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ballots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ballot",
      },
    ],
  },
  { timestamps: true }
);

const Election = mongoose.model("Election", electionSchema);
module.exports = Election;
