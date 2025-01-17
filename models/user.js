const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enetr yor fullname"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please use a valid email address",
      ],
    },
    phone: { type: String, required: [true, "Please ente your phone number"] },
    subscription: {
      tier: { type: String, default: "Free" }, // "Free", "Tier1", "Tier2", "Custom"
      voterLimit: { type: Number, default: 0 }, // Default for Free Tier
      electionsAllowed: { type: Number, default: 0 }, // Default for Free Tier
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date }, // Set for paid tiers
    },
    password: {
      type: String,
      required: [true, "Please enter password"],
      minlength: [8, "Password must be up to 8 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "voter"],
      default: "voter",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: null, // Store the URL or file path of the profile picture
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
