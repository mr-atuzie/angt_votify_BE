const Ballot = require("../models/ballot");
const Election = require("../models/election");
const asyncHandler = require("express-async-handler");
const Voter = require("../models/voter");
const moment = require("moment");
const sendEmail = require("../utils/sendEmail");

// Create a new election
const createElection = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, electionType, image } =
    req.body;

  // Validate required fields
  if (!title || !description || !startDate || !endDate || !electionType) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Validate date range
  if (new Date(startDate) >= new Date(endDate)) {
    res.status(400);
    throw new Error("The start date must be before the end date");
  }

  const user = req.user;
  const { electionsAllowed } = user.subscription;

  // Validate subscription and election limits
  const userElections = await Election.countDocuments({ user: user._id });

  if (electionsAllowed === 0) {
    res.status(403);
    throw new Error("Please subscribe to create an election");
  }

  if (userElections >= electionsAllowed) {
    res.status(403);
    throw new Error("Election limit reached. Please upgrade your subscription");
  }

  // Check for duplicate election title
  const existingElection = await Election.findOne({ title });
  if (existingElection) {
    res.status(400);
    throw new Error("Election title is already taken");
  }

  // Create and save the new election
  const newElection = new Election({
    title,
    image: image || "default_image_url", // Set a default image if none provided
    description,
    startDate,
    endDate,
    electionType,
    user,
  });

  await newElection.save();

  const admin_MsgSubject = "New election was registered";
  const admin_SendTo = "Idrisoluwabunmi@gmail.com";
  const send_from = process.env.EMAIL_USER;

  const adminMessage = `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
    
    <!-- Header Section -->
    <div style="background-color: #1e40af; padding: 20px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 24px;">Election Registration</h1>
    </div>
    
    <!-- Content Section -->
    <div style="padding: 20px; color: #333333;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hello Admin,</p>
      
      <p style="font-size: 16px; margin-bottom: 20px;">A new election was created on the app. Here are the details:</p>
      
      <ul style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 20px; padding: 0;">
        <li><strong>Election Title:</strong> ${title}</li>
        <li><strong>Description:</strong> ${description}</li>
        <li><strong>Start Date:</strong> ${moment(startDate).format(
          "MMM DD, YYYY hh:mm A"
        )}</li>
        <li><strong>End Date:</strong> ${moment(endDate).format(
          "MMM DD, YYYY hh:mm A"
        )}</li>
       
      </ul>
      
      <p style="font-size: 16px;">Please verify the election information and take any necessary actions.</p>
    </div>
    
    <!-- Footer Section -->
    <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
      <p style="margin: 0; font-size: 12px;">&copy; 2024 Your App Name. All rights reserved.</p>
    </div>
  </div>
</body>
`;

  try {
    await sendEmail(admin_MsgSubject, adminMessage, admin_SendTo, send_from);
    res.status(201).json({
      message: "Election created successfully",
      election: newElection,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent , Please try Again.");
  }
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

  const now = moment(); // Current time

  const hasStarted = moment(election.startDate).isBefore(now);
  const hasEnded = moment(election.endDate).isBefore(now);

  // Determine the election status
  let status = "Upcoming"; // Default status
  if (hasEnded) {
    status = "Ended";
  }

  // Update the election status in the database
  if (election.status !== status) {
    election.status = status;
    await election.save(); // Save changes to the database
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
    // Get total voters for the given election ID
    const totalVoters = await Voter.countDocuments({ electionId: id });

    // Get the count of verified voters
    const verifiedVoters = await Voter.countDocuments({
      electionId: id,
      isVerified: true,
    });

    // Calculate the percentage of verified voters
    const verifiedPercentage =
      totalVoters > 0 ? ((verifiedVoters / totalVoters) * 100).toFixed(2) : 0;

    // Return both total voters and verified percentage
    res.status(200).json({
      totalVoters,
      // verifiedPercentage: parseFloat(verifiedPercentage),
      verifiedPercentage: verifiedVoters,
    });
  } catch (error) {
    res.status(500);
    throw new Error("Failed to fetch voter data");
  }
});

// API to check if an election has started or ended
// const getElectionStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     res.status(400);
//     throw new Error("Election ID is required");
//   }

//   // Fetch election details
//   const election = await Election.findById(id);

//   if (!election) {
//     return res
//       .status(404)
//       .json({ success: false, message: "Election not found" });
//   }

//   const now = moment(); // Current time

//   const hasStarted = moment(election.startDate).isBefore(now);
//   const hasEnded = moment(election.endDate).isBefore(now);

//   // Determine the election status
//   let status = "Upcoming"; // Default status
//   if (hasStarted && !hasEnded) {
//     status = "Ongoing";
//   } else if (hasEnded && ha) {
//     status = "Ended";
//   }

//   // Update the election status in the database
//   if (election.status !== status) {
//     election.status = status;
//     await election.save(); // Save changes to the database
//   }

//   res.status(200).json({
//     hasStarted,
//     hasEnded,
//     election,
//     start: moment(election.startDate).format("MMM DD, YYYY hh:mm A"),
//     end: moment(election.endDate).format("MMM DD, YYYY hh:mm A"),
//   });
// });
// const getElectionStatus = asyncHandler(async (req, res) => {
//   const { id } = req.params;

//   if (!id) {
//     res.status(400);
//     throw new Error("Election ID is required");
//   }

//   const election = await Election.findById(id);

//   if (!election) {
//     res.status(404);
//     throw new Error("Election not found");

//     // .json({
//     //   success: false,
//     //   message: "Election not found",
//     // });
//   }

//   const now = moment(); // Current time
//   const startDate = moment(election.startDate);
//   const endDate = moment(election.endDate);

//   const hasStarted = now.isSameOrAfter(startDate);
//   const hasEnded = now.isAfter(endDate);

//   let status = "Upcoming"; // Default status
//   if (hasStarted && !hasEnded) {
//     status = "Ongoing";
//   } else if (hasEnded) {
//     status = "Ended";
//   }

//   if (election.status !== status) {
//     election.status = status;
//     await election.save();
//   }

//   res.status(200).json({
//     hasStarted,
//     hasEnded,
//     election,
//     start: startDate.format("MMM DD, YYYY hh:mm A"),
//     end: endDate.format("MMM DD, YYYY hh:mm A"),
//   });
// });

const getElectionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("Election ID is required");
  }

  const election = await Election.findById(id);

  if (!election) {
    return res
      .status(404)
      .json({ success: false, message: "Election not found" });
  }

  const now = moment();
  const startDate = moment(election.startDate);
  const endDate = moment(election.endDate);

  // Update logic to ensure hasStarted is false if the election has ended
  const hasStarted = now.isSameOrAfter(startDate) && now.isBefore(endDate);
  const hasEnded = now.isSameOrAfter(endDate);

  let status = "Upcoming";
  if (hasEnded) {
    status = "Ended";
  }

  if (election.status !== status) {
    election.status = status;
    await election.save();
  }

  res.status(200).json({
    hasStarted,
    hasEnded,
    election,
    start: startDate.format("MMM DD, YYYY hh:mm A"),
    end: endDate.format("MMM DD, YYYY hh:mm A"),
  });
});

const startElection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch the election and populate necessary fields
  const election = await Election.findById(id)
    .populate("ballots")
    .populate("voters");

  if (!election) {
    res.status(404);
    throw new Error("Election not found");
  }

  const user = req.user;
  const { electionsAllowed } = user.subscription;

  // Validate subscription and election limits
  const userElections = await Election.countDocuments({ user: user._id });

  if (electionsAllowed === 0) {
    res.status(403);
    throw new Error("Please subscribe to create an election");
  }

  if (userElections >= electionsAllowed) {
    res.status(403);
    throw new Error("Election limit reached. Please upgrade your subscription");
  }

  // Ensure the election is not already ongoing or ended
  if (election.status !== "Upcoming") {
    res.status(400);
    throw new Error(
      `Cannot start election. Current status: ${election.status}`
    );
  }

  // Validate presence of ballots and voters
  if (election.ballots.length === 0) {
    res.status(400);
    throw new Error("Cannot start election without ballots.");
  }

  if (election.voters.length === 0) {
    res.status(400);
    throw new Error("Cannot start election without voters.");
  }

  // Update election status to 'Ongoing'
  election.status = "Ongoing";
  election.startDate = new Date();
  await election.save();

  res.status(200).json({
    message: "Election started successfully.",
    election,
  });
});

const endElection = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Fetch the election by ID
  const election = await Election.findById(id);

  if (!election) {
    res.status(404);
    throw new Error("Election not found");
  }

  console.log(id);

  console.log(election);

  // Ensure the election is ongoing before ending it
  // if (election.status !== "Ongoing") {
  //   res.status(400);
  //   throw new Error(`Cannot end election. Current status: ${election.status}`);
  // }

  // Update status to 'Ended'
  election.status = "Ended";
  election.endDate = new Date();
  await election.save();

  res.status(200).json({
    message: "Election ended successfully.",
    election,
  });
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

  startElection,
  endElection,
};
