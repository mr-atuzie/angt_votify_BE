const Voter = require("../models/voter");
const asyncHandler = require("express-async-handler");

const createVoter = asyncHandler(async (req, res) => {
  const { fullName, email, phone, electionId } = req.body;

  console.log({ fullName, email, phone, electionId });

  // Check if the email already exists
  const existingVoter = await Voter.findOne({ email });

  if (existingVoter) {
    res.status(400);
    throw new Error("A voter with this email already exists");
  }

  const newVoter = new Voter({
    fullName,
    email,
    phone,
    electionId,
  });

  await newVoter.save();

  res.status(201).json({
    message: "Voter created successfully",
    voter: newVoter,
  });
});

const getVoters = asyncHandler(async (req, res) => {
  const voters = await Voter.find().populate("electionId", "electionName");
  res.status(200).json({ voters });
});

const getVoterById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const voter = await Voter.findById(id).populate("electionId", "electionName");
  if (!voter) {
    res.status(404);
    throw new Error("Voter not found");
  }

  res.status(200).json({ voter });
});

const updateVoter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, isVerified } = req.body;

  const voter = await Voter.findById(id);
  if (!voter) {
    res.status(404);
    throw new Error("Voter not found");
  }

  voter.fullName = fullName || voter.fullName;
  voter.phone = phone || voter.phone;
  voter.isVerified = isVerified !== undefined ? isVerified : voter.isVerified;

  const updatedVoter = await voter.save();
  res
    .status(200)
    .json({ message: "Voter updated successfully", voter: updatedVoter });
});

const deleteVoter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const voter = await Voter.findById(id);
  if (!voter) {
    res.status(404);
    throw new Error("Voter not found");
  }

  await voter.remove();
  res.status(200).json({ message: "Voter deleted successfully" });
});

const getVotersByElectionId = asyncHandler(async (req, res) => {
  const { electionId } = req.params;

  // Find voters associated with the given electionId
  const voters = await Voter.find({ electionId }).populate(
    "electionId",
    "electionName"
  );

  res.status(200).json({ voters });
});

module.exports = {
  createVoter,
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getVotersByElectionId,
};
