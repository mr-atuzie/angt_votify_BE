const Ballot = require("../models/ballot");
const Election = require("../models/election");
const asyncHandler = require("express-async-handler");

// Create a new ballot
const createBallot = asyncHandler(async (req, res) => {
  const { title, description, electionId, votingOptions } = req.body;

  // Check for required fields
  if (!title || !electionId) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if the ballot title already exists for the given election
  const existingBallot = await Ballot.findOne({ title, electionId });
  if (existingBallot) {
    res.status(400);
    throw new Error("Ballot title has already been taken for this election");
  }

  // Create a new ballot
  const newBallot = new Ballot({
    title,
    description,
    electionId,
    votingOptions,
  });

  await newBallot.save();

  res
    .status(201)
    .json({ message: "Ballot created successfully", ballot: newBallot });
});

// Export all controllers as an object
module.exports = {
  createBallot,
};
