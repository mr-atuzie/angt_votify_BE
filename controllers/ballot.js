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

  const newElection = await Election.findByIdAndUpdate(
    electionId,
    { $push: { ballots: newBallot._id } },
    { new: true }
  );

  res.status(201).json({
    message: "Ballot created successfully",
    ballot: newBallot,
    election: newElection,
  });
});

// Get all ballots for a specific election
const getBallotsByElection = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  const ballots = await Ballot.find({ electionId }).populate("votingOptions");

  const populatedBallots = await Ballot.find({ electionId }).populate({
    path: "votingOptions",
    select: "name description image votes", // Fields to retrieve
  });

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
  console.log("it is here");

  if (!updatedBallot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  res.status(200).json({
    message: "Ballot updated successfully",
    ballot: updatedBallot,
  });
});

const deleteBallot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the ballot and its related voting options
  const deletedBallot = await Ballot.findById(id).populate("votingOptions");

  if (!deletedBallot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  // Delete the related voting options
  await VotingOption.deleteMany({ _id: { $in: deletedBallot.votingOptions } });

  await Election.updateMany({ ballots: id }, { $pull: { ballots: id } });

  // Delete the ballot itself
  await Ballot.findByIdAndDelete(id);

  res.status(200).json({
    message: "Ballot and its related voting options deleted successfully",
    ballot: deletedBallot, // Send back the deleted ballot to update the state
  });
});

const createVotingOption = asyncHandler(async (req, res) => {
  const { name, description, image, ballotId } = req.body;

  // Validate required fields
  if (!name || !image || !ballotId) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if the Ballot exists
  const ballot = await Ballot.findById(ballotId);
  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  // Create and save the new VotingOption
  const newVotingOption = new VotingOption({
    name,
    description,
    image,
    ballotId,
  });

  const savedVotingOption = await newVotingOption.save();

  // Add the new VotingOption to the Ballot's votingOptions array
  ballot.votingOptions.push(savedVotingOption._id);

  // Save the updated Ballot
  await ballot.save();

  // Respond with the created VotingOption
  res.status(201).json({
    message: "Voting option created successfully",
    votingOption: savedVotingOption,
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

const getBallotWithVotingOptions = asyncHandler(async (req, res) => {
  const { ballotId } = req.params;

  // Find ballot and populate its votingOptions
  const ballot = await Ballot.findById(ballotId).populate("votingOptions");

  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  res.status(200).json(ballot);
});

const clearAllVotingOptions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find ballot and populate its votingOptions
  const ballot = await Ballot.findById(id).populate("votingOptions");

  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found");
  }

  // Find the ballot by ID and clear the voting options
  const updatedBallot = await Ballot.findByIdAndUpdate(
    id,
    { $set: { votingOptions: [] } }, // Assuming 'votingOptions' is an array in your ballot
    { new: true } // Return the updated document
  );

  res.status(200).json({
    message: "Voting options cleared successfully",
    ballot: updatedBallot,
  });
});

// Export all controllers as an object
module.exports = {
  createBallot,
  getBallotsByElection,
  getBallotWithVotingOptions,
  getBallotById,
  updateBallot,
  deleteBallot,

  createVotingOption,
  getVotingOptionsByBallot,
  getVotingOptionById,
  updateVotingOption,
  deleteVotingOption,
  clearAllVotingOptions,
};
