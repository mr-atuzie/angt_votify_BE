const Ballot = require("../models/ballot");
const Election = require("../models/election");
const asyncHandler = require("express-async-handler");
const Voter = require("../models/voter");
const moment = require("moment");

// Create a new election
const createElection = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, electionType } = req.body;

  if (!title || !description || !startDate || !endDate || !electionType) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  const user = req.user._id;

  // Check if election name already exists
  const existingElection = await Election.findOne({ title });
  if (existingElection) {
    res.status(400);
    throw new Error("Election name has already been taken");
  }

  const newElection = new Election({
    title,
    description,
    startDate,
    endDate,
    electionType,
    user,
  });

  await newElection.save();

  res.status(201).json({
    message: "Election created successfully",
    election: newElection,
    test: "123456789",
  });
});

// Get all elections
const getAllElections = asyncHandler(async (req, res) => {
  const elections = await Election.find();
  res.status(200).json(elections);
});

// Get an election by ID
const getElectionById = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    res.status(404);
    throw new Error("Election not found");
  }
  res.status(200).json(election);
});

// Update an election by ID
const updateElection = asyncHandler(async (req, res) => {
  const updatedElection = await Election.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!updatedElection) {
    res.status(404);
    throw new Error("Election not found");
  }
  res.status(200).json({
    message: "Election updated successfully",
    election: updatedElection,
  });
});

const deleteElection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const election = await Election.findByIdAndDelete(id);

  if (!election) {
    res.status(404);
    throw new Error("Voting option not found");
  }

  res.status(200).json({
    message: "Voting option deleted successfully",
  });
});

// Close an election
const closeElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);
  if (!election) {
    res.status(404);
    throw new Error("Election not found");
  }

  election.status = "closed";
  await election.save();
  res.status(200).json({ message: "Election closed successfully", election });
});

// Create a new election
const createElectionBallot = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const electionId = req.params;

  if (!title || !description) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  const user = req.userId;

  // Check if election  exists
  const existingElection = await Election.findOne({ _id: electionId });
  if (!existingElection) {
    res.status(400);
    throw new Error("Invalid Operation");
  }

  const newBallot = new Ballot({
    title,
    description,
    electionId,
  });

  await newBallot.save();

  res.status(201).json({ ballot: newBallot });
});

// Controller to get the total number of voters in an election
const getTotalVoters = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("Election ID is required");
  }

  try {
    const totalVoters = await Voter.countDocuments({ id });

    res.status(200).json(totalVoters);
  } catch (error) {
    res.status(500);
    throw new Error("Failed to fetch the total number of voters");
  }
});

// API to check if an election has started or ended

const getElectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("Election ID is required");
  }

  // Fetch election details
  const election = await Election.findById(id);

  if (!election) {
    return res
      .status(404)
      .json({ success: false, message: "Election not found" });
  }

  const now = moment(); // Current time

  const hasStarted = moment(election.startDate).isBefore(now);
  const hasEnded = moment(election.endDate).isBefore(now);

  res.status(200).json({ hasStarted, hasEnded, election });
});

// Export all controllers as an object
module.exports = {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  closeElection,
  deleteElection,

  createElectionBallot,
  getTotalVoters,
  getElectionStatus,
};
