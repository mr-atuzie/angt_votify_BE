const Voter = require("../models/voter");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Election = require("../models/election");
const sendEmail = require("../utils/sendEmail");
const VotingOption = require("../models/votingOptions");
const Ballot = require("../models/ballot");
const xlsx = require("xlsx");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createVoter = asyncHandler(async (req, res) => {
  const { fullName, email, phone, electionId } = req.body;

  const user = req.user._id;

  const { electionsAllowed, voterLimit } = user.subscription;

  // check the number of voters registered to election
  const electionVoters = await Voter.countDocuments({ electionId });

  console.log(electionVoters, voterLimit);

  // if (electionVoters >= voterLimit) {
  //   res.status(403); // Not Found
  //   throw new Error("Voters limit reached.");
  // }

  // // Check if the email already exists
  // const existingVoter = await Voter.findOne({ email });

  // if (existingVoter) {
  //   res.status(400);
  //   throw new Error("A voter with this email already exists");
  // }

  // const newVoter = new Voter({
  //   fullName,
  //   email,
  //   phone,
  //   electionId,
  // });

  // await newVoter.save();

  // res.status(201).json({
  //   message: "Voter created successfully",
  //   voter: newVoter,
  // });
});

const createVoterNew = asyncHandler(async (req, res) => {
  const { fullName, email, phone, electionId } = req.body;
  const user = req.user;

  const { voterLimit } = user.subscription;

  // check the number of voters registered to election
  const electionVoters = await Voter.countDocuments({ electionId });

  // if (electionVoters >= voterLimit) {
  //   res.status(403); // Not Found
  //   throw new Error("Voters limit reached.");
  // }

  const election = await Election.findById(electionId);

  if (!election) {
    res.status(404);
    throw new Error("Election not found");
  }

  // Check if a voter with the same email already exists for this election
  const existingVoter = await Voter.findOne({ email, electionId });
  if (existingVoter) {
    res.status(400);
    throw new Error(
      "A voter with this email is already registered for this election."
    );
  }

  // Generate unique voter code
  const voterCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create the new voter
  const newVoter = new Voter({
    fullName,
    email,
    phone,
    electionId,
  });

  await newVoter.save();

  election.voters.push(newVoter._id);
  await election.save();

  // Generate the voting link
  const votingLink = `${process.env.CLIENT_URL}/voting/${electionId}/voter/${newVoter._id}/login`;

  // Email content
  const subject = `You're Registered to Vote in ${election.title} Election`;
  const send_to = newVoter.email;
  const send_from = process.env.EMAIL_USER;

  const message = `
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; overflow: hidden;">
        <div style="background-color: #4A90E2; padding: 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0;">Election Notification</h1>
        </div>
        <div style="padding: 20px;">
          <p style="text-transform: capitalize;">Dear <strong>${fullName}</strong>,</p>
          <p>Welcome to the <strong>${election.title} Election</strong>. Below are your voter credentials:</p>
          <p><strong>Voter ID:</strong> ${newVoter.voterId}</p>
          <p><strong>Voter Code:</strong> ${newVoter.verificationCode}</p>
          <p style="margin: 20px 0; text-align: center;">
            <a href="${votingLink}"
               style="display: inline-block; background-color: #4A90E2; color: #ffffff; padding: 12px 20px; font-size: 16px; text-decoration: none; border-radius: 5px;">
              Go to Voting Portal
            </a>
          </p>
          <p>If you have any questions, please contact the election organizer.</p>
          <p>Best regards,<br>Election Team</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
          <p style="margin: 0;">&copy; 2024 Department of Medicine. All rights reserved.</p>
        </div>
      </div>
    </body>`;

  // Send email
  try {
    await sendEmail(subject, message, send_to, send_from);
    res.status(201).json({
      message: "Voter created and email sent successfully",
      voter: newVoter,
    });
  } catch (error) {
    console.log(error);

    res.status(500);
    throw new Error("Email not sent. Please try again.");
  }
});

// const addMultipleVoter = asyncHandler(async (req, res) => {
//   const { electionId } = req.params;
//   const user = req.user;

//   try {
//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();

//     // Validate election
//     const election = await Election.findById(electionId);
//     if (!election) {
//       res.status(404);
//       throw new Error("Election not found");
//     }

//     const { voterLimit } = user.subscription;
//     const currentVoters = await Voter.countDocuments({ electionId });

//     if (currentVoters >= voterLimit) {
//       res.status(403);
//       throw new Error("Voter limit reached for this election.");
//     }

//     let sheetData;

//     // Handle file based on its extension
//     if (ext === ".csv") {
//       const csvData = fs.readFileSync(filePath, "utf-8");

//       // Parse the CSV data into a JSON object
//       const workbook = xlsx.read(csvData, { type: "string" });
//       const sheetName = workbook.SheetNames[0]; // Get the first sheet
//       sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//       // For testing, use only the first 10 rows
//       // sheetData = sheetData.slice(80, 100);
//     } else {
//       return res.status(400).json({ message: "Unsupported file format" });
//     }

//     // Normalize keys and validate data
//     const votersToAdd = sheetData
//       .map((row) => {
//         const name = row.name?.trim();
//         const phone = row.phone ? String(row.phone).trim() : null;

//         // Skip invalid rows
//         if (!name || !phone) return null;

//         return {
//           fullName: name,
//           phone,
//           electionId,
//           verificationCode: Math.random()
//             .toString(36)
//             .substring(2, 8)
//             .toUpperCase(),
//         };
//       })
//       .filter(Boolean); // Remove null values

//     if (votersToAdd.length === 0) {
//       res.status(400);
//       throw new Error("No valid or new voters to upload.");
//     }

//     // Check for existing voters and filter duplicates by phone number
//     const existingVoterPhones = await Voter.find({
//       electionId,
//       phone: { $in: votersToAdd.map((voter) => voter.phone) },
//     }).distinct("phone");

//     const newVoters = votersToAdd.filter(
//       (voter) => !existingVoterPhones.includes(voter.phone)
//     );

//     if (newVoters.length === 0) {
//       res.status(400);
//       throw new Error("All voters in the file are already registered.");
//     }

//     // Insert voters into the database
//     const voters = await Voter.insertMany(newVoters);

//     election.voters.push(...voters.map((voter) => voter._id));
//     await election.save();

//     console.log("new engine");

//     // Clean up uploaded file
//     fs.unlinkSync(filePath);

//     res.status(201).json({
//       message: voters.length + " voters uploaded successfully",
//       voters,
//     });
//   } catch (error) {
//     // Clean up in case of error
//     if (req.file && req.file.path) fs.unlinkSync(req.file.path);

//     console.log(error.message);

//     res.status(500).json({ message: error.message, error: error.message });
//   }
// });

// const addMultipleVoter = asyncHandler(async (req, res) => {
//   const { electionId } = req.params;
//   const user = req.user;

//   console.log(electionId);

//   try {
//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();

//     console.log({ filePath, ext });

//     // Validate election
//     const election = await Election.findById(electionId);
//     if (!election) {
//       res.status(404);
//       throw new Error("Election not found");
//     }

//     const { voterLimit } = user.subscription;
//     const currentVoters = await Voter.countDocuments({ electionId });
//     if (currentVoters >= voterLimit) {
//       res.status(403);
//       throw new Error("Voter limit reached for this election.");
//     }

//     let sheetData;

//     // Handle file based on its extension
//     if (ext === ".csv") {
//       const csvData = fs.readFileSync(filePath, "utf-8");

//       // Parse the CSV data into a JSON object
//       const workbook = xlsx.read(csvData, { type: "string" });
//       const sheetName = workbook.SheetNames[0]; // Get the first sheet
//       sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
//     } else {
//       return res.status(400).json({ message: "Unsupported file format" });
//     }

//     // Validate and add voters
//     const votersToAdd = [];

//     console.log(sheetData);

//     for (const row of sheetData) {
//       const { name, email, phone } = row;

//       // Skip invalid rows
//       if (!name || !email) continue;

//       const existingVoter = await Voter.findOne({ email, electionId });
//       if (existingVoter) {
//         continue; // Skip duplicate voters
//       }

//       // Create new voter object
//       const voterCode = Math.random()
//         .toString(36)
//         .substring(2, 8)
//         .toUpperCase();

//       votersToAdd.push({
//         fullName: name,
//         email,
//         phone: phone || null,
//         electionId,
//         verificationCode: voterCode,
//       });
//     }

//     if (votersToAdd.length === 0) {
//       res.status(400);
//       throw new Error("No valid or new voters to upload.");
//     }

//     // Insert voters into the database
//     const voters = await Voter.insertMany(votersToAdd);

//     // Clean up uploaded file
//     fs.unlinkSync(filePath);

//     console.log(voters);
//     res.status(201).json({ message: "Voters uploaded successfully", voters });
//   } catch (error) {
//     // Clean up in case of error
//     if (req.file && req.file.path) fs.unlinkSync(req.file.path);
//     res.status(500).json({ message: "Error uploading voters", error });

//     console.log(error);
//   }
// });

const addMultipleVoter = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const user = req.user;

  try {
    // Validate Election
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Check voter limit
    const { voterLimit } = user.subscription;
    const currentVoters = await Voter.countDocuments({ electionId });

    console.log(voterLimit, currentVoters);

    if (currentVoters >= voterLimit) {
      return res
        .status(403)
        .json({ message: "Voter limit reached for this election" });
    }

    // File Validation
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== ".csv") {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Unsupported file format" });
    }

    // Parse CSV file
    const csvData = fs.readFileSync(filePath, "utf-8");
    const workbook = xlsx.read(csvData, { type: "string" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Normalize keys and validate data
    const votersToAdd = sheetData
      .map((row) => {
        const name = row.name?.trim();
        const phone = row.phone ? String(row.phone).trim() : null;
        if (!name || !phone) return null;
        return {
          fullName: name,
          phone,
          electionId,
          verificationCode: Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase(),
        };
      })
      .filter(Boolean);

    if (!votersToAdd.length) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "No valid or new voters to upload." });
    }

    // Check for existing voters
    const existingPhones = await Voter.find({
      electionId,
      phone: { $in: votersToAdd.map((voter) => voter.phone) },
    }).distinct("phone");

    const newVoters = votersToAdd.filter(
      (voter) => !existingPhones.includes(voter.phone)
    );

    if (!newVoters.length) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "All voters in the file are already registered." });
    }

    // Insert voters into the database
    const createdVoters = await Voter.insertMany(newVoters);

    // Update the election with voter IDs atomically
    const voterIds = createdVoters.map((voter) => voter._id);
    await Election.findByIdAndUpdate(
      electionId,
      { $addToSet: { voters: { $each: voterIds } } }, // Prevent duplicates
      { new: true }
    );

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      message: `${createdVoters.length} voters uploaded successfully`,
      voters: createdVoters,
    });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path); // Cleanup on error
    console.error(error.message);
    res.status(500).json({ message: error.message });
  }
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
  // const { fullName, phone, email } = req.body;

  const voter = await Voter.findById(id);
  if (!voter) {
    res.status(404);
    throw new Error("Voter not found");
  }

  // voter.fullName = fullName || voter.fullName;
  // voter.phone = phone || voter.phone;
  // voter.email = email || voter.isVerified;

  const updatedVoter = await Voter.findByIdAndUpdate(voter._id, req.body, {
    new: true,
    runValidators: true,
  });

  // const updatedVoter = await voter.save();
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

const loginVoter = asyncHandler(async (req, res) => {
  const { voterId, verificationCode, electionId, voterLoginId } = req.body;

  if (!voterId || !verificationCode || !voterLoginId) {
    res.status(400);
    throw new Error("Please provide both voter ID and voting code.");
  }

  // Normalize voterId: Check for prefix
  const normalizedVoterId = voterLoginId.startsWith("VOTER-")
    ? voterLoginId
    : `VOTER-${voterLoginId}`;

  const partOfElection = await Voter.findOne({
    _id: voterId,
    voterId: normalizedVoterId,
    electionId,
  });

  if (!partOfElection) {
    res.status(400);
    throw new Error("Voter  not registered for this election.");
  }
  console.log(normalizedVoterId);

  // Find voter by normalized voterId and verificationCode
  const voter = await Voter.findOne({
    voterId: normalizedVoterId,
    verificationCode,
    electionId,
  });

  if (!voter) {
    res.status(401);
    throw new Error("Invalid voter ID or voting code.");
  }

  // // Check if the voter is verified (optional)
  // if (!voter.isVerified) {
  //   res.status(403);
  //   throw new Error("Voter is not verified.");
  // }

  res.status(200).json({
    message: "Login successful",
    voter: {
      id: voter._id,
      fullName: voter.fullName,
      email: voter.email,
    },
  });
});

// Cast Vote API
const castVote = asyncHandler(async (req, res) => {
  const { votingOptionId, voterId, ballotId } = req.body;

  // Validate input
  if (!votingOptionId || !voterId || !ballotId) {
    res.status(400);
    throw new Error("Voting option ID, voter ID, and ballot ID are required.");
  }

  // Fetch the ballot and voting option
  const [ballot, votingOption, voter] = await Promise.all([
    Ballot.findById(ballotId),
    VotingOption.findById(votingOptionId),
    Voter.findById(voterId),
  ]);

  // Validate existence
  if (!ballot) {
    res.status(404);
    throw new Error("Ballot not found.");
  }
  if (!votingOption) {
    res.status(404);
    throw new Error("Voting option not found.");
  }
  if (!voter) {
    res.status(404);
    throw new Error("Voter not found.");
  }

  // Ensure the voter hasn't already voted for this option
  if (votingOption.votes.includes(voterId)) {
    res.status(400);
    throw new Error("Voter has already voted for this option.");
  }

  // Optionally, ensure the voter hasn't voted in this ballot
  if (ballot.voters.includes(voterId)) {
    res.status(400);
    throw new Error("Voter has already voted in this ballot.");
  }

  // Record the vote
  votingOption.votes.push(voterId);
  ballot.voters.push(voterId);
  voter.isVerified = true;

  await Promise.all([votingOption.save(), ballot.save(), voter.save()]);

  // Respond with success
  res.status(200).json({
    message: "Vote cast successfully.",
    votingOption,
  });
});

module.exports = {
  createVoter,
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getVotersByElectionId,

  createVoterAndSendSMS,
  createVoterNew,
  loginVoter,
  castVote,

  addMultipleVoter,
};
