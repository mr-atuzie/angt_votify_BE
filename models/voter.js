const mongoose = require("mongoose");

const { customAlphabet } = require("nanoid");

// Create a custom nanoid generator for alphanumeric IDs of length 8
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

const voterSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please enetr voter fullname"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enetr voter email"],
      unique: [true, "Email has already been register"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address",
      ],
    },
    phone: { type: String, required: [true, "Please ente your phone number"] },
    voterId: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        return `VOTER-${nanoid()}`;
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
    },
  },
  { timestamps: true }
);

const Voter = mongoose.model("Voter", voterSchema);
module.exports = Voter;
