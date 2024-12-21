const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const Election = require("../models/election");

const validateSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id); // Assuming user is authenticated
  const { electionsAllowed, voterLimit } = user.subscription;

  const userElections = await Election.countDocuments({ user: user._id });

  if (userElections >= electionsAllowed) {
    res.status(403); // Not Found
    throw new Error("Election limit reached.");
  }

  if (req.body.voters && req.body.voters.length > voterLimit) {
    return res.status(403).json({ message: "Voter limit exceeded." });
  }

  next();
});

module.exports = { validateSubscription };
