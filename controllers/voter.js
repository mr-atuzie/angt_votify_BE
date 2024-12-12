const Voter = require("../models/voter");
const asyncHandler = require("express-async-handler");
const axios = require("axios");

const createVoter = asyncHandler(async (req, res) => {
  const { fullName, email, phone, electionId } = req.body;

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

const createVoterAndSendSMS = asyncHandler(async (req, res) => {
  const { fullName, email, phone, electionId } = req.body;

  // console.log({ fullName, email, phone, electionId });

  // Check if the email already exists
  const existingVoter = await Voter.findOne({ email });

  if (existingVoter) {
    res.status(400);
    throw new Error("A voter with this email already exists");
  }

  // Create a new voter instance
  const newVoter = new Voter({
    fullName,
    email,
    phone,
    electionId,
  });

  // Save the voter to the database
  await newVoter.save();

  // Prepare the SMS content
  const verificationMessage = `Hello ${newVoter.fullName}, your verification code is ${newVoter.verificationCode}. Use this code to verify your account.`;

  // Send SMS via Termii
  // to: "2348160853127",
  //  to: newVoter.phone,
  //from:  process.env.TERMINII_SMS_FROM,

  // "https://BASE_URL/api/sms/send

  try {
    const response = await axios.post(
      "https://v3.api.termii.com/api/sms/send",
      {
        to: "2349119276054",
        from: "2ruevote", // Your sender name or number
        sms: verificationMessage,
        type: "plain",
        channel: "generic",
        api_key: process.env.TERMINII_API_KEY,
      }
    );

    console.log("SMS Response:", response);
  } catch (error) {
    console.error(
      "Error sending SMS:",
      error.response ? error.response : error.message
    );
    // Optionally, you can choose to delete the voter if SMS sending fails
    // await Voter.findByIdAndDelete(newVoter._id);
    res.status(500);
    throw new Error("Voter created but failed to send verification SMS");
  }

  res.status(201).json({
    message: "Voter created successfully. Verification SMS sent.",
    voter: newVoter,
  });
});

// Verify voter
const verifyVoter = asyncHandler(async (req, res) => {
  const { voterId, verificationCode } = req.body;

  // Find the voter by voterId
  const voter = await Voter.findOne({ voterId });

  if (!voter) {
    res.status(404);
    throw new Error("Voter not found");
  }

  if (voter.isVerified) {
    res.status(400);
    throw new Error("Voter is already verified");
  }

  if (voter.verificationCode !== verificationCode) {
    res.status(400);
    throw new Error("Invalid verification code");
  }

  // Update voter's verification status
  voter.isVerified = true;
  voter.verificationCode = undefined; // Remove the code after verification
  await voter.save();

  res.status(200).json({ message: "Voter verified successfully" });
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

  createVoterAndSendSMS,
};
