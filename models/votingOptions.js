const mongoose = require("mongoose");
const { Schema } = mongoose;

const VotingOptionSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  votes: {
    type: Number,
    default: 0,
  },
});

const votingOptions = mongoose.model("VotingOption", VotingOptionSchema);
module.exports = votingOptions;
