const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
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
    voterId: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        return this.role === "voter" ? `VOTER-${Date.now()}` : null;
      },
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
