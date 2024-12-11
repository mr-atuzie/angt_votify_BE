const mongoose = require("mongoose");
const { Schema } = mongoose;

const ballotSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
  },
  votingOptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VotingOption",
    },
  ],
});

const Ballot = mongoose.model("Ballot", ballotSchema);
module.exports = Ballot;
