const mongoose = require("mongoose");

const votingOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    ballotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ballot",
      required: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Add timestamps to track creation and updates
  }
);

const VotingOption = mongoose.model("VotingOption", votingOptionSchema);

module.exports = VotingOption;
