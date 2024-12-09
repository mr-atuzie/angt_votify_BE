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
  votingOptions: [
    {
      type: Schema.Types.ObjectId,
      ref: "VotingOption",
    },
  ],
});

const Ballot = mongoose.model("Ballot", ballotSchema);
module.exports = Ballot;
