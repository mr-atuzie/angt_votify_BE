const Ballot = require("../models/ballot");
const VotingOption = require("../models/votingOptions"); // Adjust path as needed
const Election = require("../models/election");
const asyncHandler = require("express-async-handler");

// Create a new ballot
const createBallot = asyncHandler(async (req, res) => {
  const { title, description, electionId } = req.body;

  // Check for required fields
  if (!title || !electionId) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if election exists
  const election = await Election.findById(electionId);
  if (!election) {
    res.status(404);
    throw new Error("Election not found");
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
  });

  await newBallot.save();

  res
    .status(201)
    .json({ message: "Ballot created successfully", ballot: newBallot });
});

// Get all ballots for a specific election
const getBallotsByElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  // Find ballots by electionId
  const ballots = await Ballot.find({ electionId });

  if (!ballots || ballots.length === 0) {
    res.status(404);
    throw new Error("No ballots found for this election");
  }

  res.status(200).json(ballots);
});

// Get a single ballot by ID
const getBallotById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ballot = await Ballot.findById(id).populate("votingOptions");

  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  res.status(200).json(ballot);
});

// Update a ballot
const updateBallot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, electionId } = req.body;

  const updatedBallot = await Ballot.findByIdAndUpdate(
    id,
    { title, description, electionId },
    { new: true, runValidators: true }
  );

  if (!updatedBallot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  res.status(200).json({
    message: "Ballot updated successfully",
    ballot: updatedBallot,
  });
});

// Delete a ballot
const deleteBallot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedBallot = await Ballot.findByIdAndDelete(id);

  if (!deletedBallot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  res.status(200).json({
    message: "Ballot deleted successfully",
    ballot: deletedBallot,
  });
});

// Create a new voting option
const createVotingOption = asyncHandler(async (req, res) => {
  const { name, description, image, ballotId } = req.body;

  if (!name || !image || !ballotId) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if the ballot exists
  const ballot = await Ballot.findById(ballotId);
  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  const newVotingOption = new VotingOption({
    name,
    description,
    image,
    ballotId,
  });

  await newVotingOption.save();

  res.status(201).json({
    message: "Voting option created successfully",
    votingOption: newVotingOption,
  });
});

// Get all voting options for a specific ballot
const getVotingOptionsByBallot = asyncHandler(async (req, res) => {
  const { ballotId } = req.params;

  // Find voting options associated with the ballotId
  const votingOptions = await VotingOption.find({ ballotId });

  if (!votingOptions) {
    res.status(404);
    throw new Error("No voting options found for this ballot");
  }

  res.status(200).json(votingOptions);
});

// Get a single voting option by ID
const getVotingOptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const votingOption = await VotingOption.findById(id);

  if (!votingOption) {
    res.status(404);
    throw new Error("Voting option not found");
  }

  res.status(200).json(votingOption);
});

// Update a voting option
const updateVotingOption = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, image } = req.body;

  const updatedVotingOption = await VotingOption.findByIdAndUpdate(
    id,
    { name, description, image },
    { new: true, runValidators: true }
  );

  if (!updatedVotingOption) {
    res.status(404);
    throw new Error("Voting option not found");
  }

  res.status(200).json({
    message: "Voting option updated successfully",
    votingOption: updatedVotingOption,
  });
});

// Delete a voting option
const deleteVotingOption = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedVotingOption = await VotingOption.findByIdAndDelete(id);

  if (!deletedVotingOption) {
    res.status(404);
    throw new Error("Voting option not found");
  }

  res.status(200).json({
    message: "Voting option deleted successfully",
    votingOption: deletedVotingOption,
  });
});

// Export all controllers as an object
module.exports = {
  createBallot,
  getBallotsByElection,
  getBallotById,
  updateBallot,
  deleteBallot,

  createVotingOption,
  getVotingOptionsByBallot,
  getVotingOptionById,
  updateVotingOption,
  deleteVotingOption,
};
