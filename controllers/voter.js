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

function sanitizeValue(value) {
  if (typeof value === "string") {
    // Remove surrounding quotes if present
    return value.replace(/^['"]|['"]$/g, "").trim();
  }
  return value;
}

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

// const addMultipleVoter = asyncHandler(async (req, res) => {
//   const { electionId } = req.params;
//   const user = req.user;

//   try {
//     // Validate Election
//     const election = await Election.findById(electionId);
//     if (!election) {
//       return res.status(404).json({ message: "Election not found" });
//     }

//     // Check voter limit
//     const { voterLimit } = user.subscription;
//     const currentVoters = await Voter.countDocuments({ electionId });

//     console.log(voterLimit, currentVoters);

//     if (currentVoters >= voterLimit) {
//       return res
//         .status(403)
//         .json({ message: "Voter limit reached for this election" });
//     }

//     // File Validation
//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();
//     if (ext !== ".csv") {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "Unsupported file format" });
//     }

//     // Parse CSV file
//     const csvData = fs.readFileSync(filePath, "utf-8");
//     const workbook = xlsx.read(csvData, { type: "string" });
//     const sheetName = workbook.SheetNames[0];
//     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Normalize keys and validate data
//     const votersToAdd = sheetData
//       .map((row) => {
//         const name = row.name?.trim();
//         const phone = row.phone ? String(row.phone).trim() : null;
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
//       .filter(Boolean);

//     if (!votersToAdd.length) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(400)
//         .json({ message: "No valid or new voters to upload." });
//     }

//     // Check for existing voters
//     const existingPhones = await Voter.find({
//       electionId,
//       phone: { $in: votersToAdd.map((voter) => voter.phone) },
//     }).distinct("phone");

//     const newVoters = votersToAdd.filter(
//       (voter) => !existingPhones.includes(voter.phone)
//     );

//     if (!newVoters.length) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(400)
//         .json({ message: "All voters in the file are already registered." });
//     }

//     // Insert voters into the database
//     const createdVoters = await Voter.insertMany(newVoters);

//     // Update the election with voter IDs atomically
//     const voterIds = createdVoters.map((voter) => voter._id);
//     await Election.findByIdAndUpdate(
//       electionId,
//       { $addToSet: { voters: { $each: voterIds } } }, // Prevent duplicates
//       { new: true }
//     );

//     // Clean up the uploaded file
//     fs.unlinkSync(filePath);

//     res.status(201).json({
//       message: `${createdVoters.length} voters uploaded successfully`,
//       voters: createdVoters,
//     });
//   } catch (error) {
//     if (req.file?.path) fs.unlinkSync(req.file.path); // Cleanup on error
//     console.error(error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// const addMultipleVoter = asyncHandler(async (req, res) => {
//   const { electionId } = req.params;
//   const user = req.user;

//   console.log("new wngine");

//   try {
//     const election = await Election.findById(electionId);
//     if (!election) {
//       return res.status(404).json({ message: "Election not found" });
//     }

//     const { voterLimit } = user.subscription;
//     const currentVoters = await Voter.countDocuments({ electionId });

//     if (currentVoters >= voterLimit) {
//       return res
//         .status(403)
//         .json({ message: "Voter limit reached for this election" });
//     }

//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();
//     if (ext !== ".csv") {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "Unsupported file format" });
//     }

//     const csvData = fs.readFileSync(filePath, "utf-8");
//     const workbook = xlsx.read(csvData, { type: "string" });
//     const sheetName = workbook.SheetNames[0];
//     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     console.log("Headers:", Object.keys(sheetData[0]));
//     console.log("Row Data:", sheetData.slice(1)); // Logs all rows except the header

//     // After trimming and normalizing
//     const votersToAdd = sheetData
//       .map((row) => {
//         console.log("Row Data:", row); // Log each row to debug

//         const name = sanitizeValue(row.name);
//         const phone = sanitizeValue(row.phone);
//         const email = sanitizeValue(row.email);
//         // Log after trimming to check the values
//         console.log(
//           "Trimmed Values - Name:",
//           name,
//           "Phone:",
//           phone,
//           "Email:",
//           email
//         );

//         // If any field is missing or invalid, return null for this row
//         if (!name || !phone || !email) {
//           console.log("Skipping invalid row:", row); // Log the skipped row for debugging
//           return null;
//         }

//         // Return the voter object if all fields are valid
//         return {
//           fullName: name,
//           phone,
//           email,
//           electionId,
//           verificationCode: Math.random()
//             .toString(36)
//             .substring(2, 8)
//             .toUpperCase(),
//         };
//       })
//       .filter(Boolean);

//     console.log("Voters to add:", votersToAdd); // Log final votersToAdd array

//     if (!votersToAdd.length) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(400)
//         .json({ message: "No valid or new voters to upload." });
//     }

//     // Check for existing phone numbers and emails
//     const existingVoters = await Voter.find({
//       electionId,
//       $or: [
//         { phone: { $in: votersToAdd.map((voter) => voter.phone) } },
//         { email: { $in: votersToAdd.map((voter) => voter.email) } },
//       ],
//     }).select("phone email");

//     const existingPhones = existingVoters.map((voter) => voter.phone);
//     const existingEmails = existingVoters.map((voter) => voter.email);

//     const newVoters = votersToAdd.filter(
//       (voter) =>
//         !existingPhones.includes(voter.phone) &&
//         !existingEmails.includes(voter.email)
//     );

//     if (!newVoters.length) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(400)
//         .json({ message: "All voters in the file are already registered." });
//     }

//     const createdVoters = await Voter.insertMany(newVoters);

//     await Election.findByIdAndUpdate(
//       electionId,
//       {
//         $addToSet: {
//           voters: { $each: createdVoters.map((voter) => voter._id) },
//         },
//       },
//       { new: true }
//     );

//     fs.unlinkSync(filePath);

//     for (const newVoter of createdVoters) {
//       const votingLink = `${process.env.CLIENT_URL}/voting/${electionId}/voter/${newVoter._id}/login`;
//       const subject = `You're Registered to Vote in ${election.title} Election`;
//       const send_to = newVoter.email;
//       const send_from = process.env.EMAIL_USER;
//       const message = `
//         <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
//           <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; overflow: hidden;">
//             <div style="background-color: #4A90E2; padding: 20px; text-align: center; color: #ffffff;">
//               <h1 style="margin: 0;">Election Notification</h1>
//             </div>
//             <div style="padding: 20px;">
//               <p style="text-transform: capitalize;">Dear <strong>${newVoter.fullName}</strong>,</p>
//               <p>Welcome to the <strong>${election.title} Election</strong>. Below are your voter credentials:</p>
//               <p><strong>Voter ID:</strong> ${newVoter._id}</p>
//               <p><strong>Voter Code:</strong> ${newVoter.verificationCode}</p>
//               <p style="margin: 20px 0; text-align: center;">
//                 <a href="${votingLink}" style="display: inline-block; background-color: #4A90E2; color: #ffffff; padding: 12px 20px; font-size: 16px; text-decoration: none; border-radius: 5px;">
//                   Go to Voting Portal
//                 </a>
//               </p>
//               <p>If you have any questions, please contact the election organizer.</p>
//               <p>Best regards,<br>Election Team</p>
//             </div>
//             <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
//               <p style="margin: 0;">&copy; 2024 Election System. All rights reserved.</p>
//             </div>
//           </div>
//         </body>`;

//       try {
//         await sendEmail(subject, message, send_to, send_from);
//       } catch (error) {
//         console.log(`Failed to send email to ${send_to}:`, error);
//       }
//     }

//     res.status(201).json({
//       message: `${createdVoters.length} voters uploaded successfully and emails sent`,
//       voters: createdVoters,
//     });
//   } catch (error) {
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     console.error(error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

// const addMultipleVoter = asyncHandler(async (req, res) => {
//   const { electionId } = req.params;
//   const user = req.user;

//   try {
//     // Retrieve the election by ID
//     const election = await Election.findById(electionId);
//     if (!election) {
//       return res.status(404).json({ message: "Election not found" });
//     }

//     // const { voterLimit } = user.subscription;
//     // const currentVoters = await Voter.countDocuments({ electionId });

//     const { voterLimit, startDate, endDate } = user.subscription;
//     const currentVoters = await Voter.countDocuments({ electionId });

//     // Convert start and end dates to Date objects
//     const subscriptionStart = new Date(startDate);
//     const subscriptionEnd = new Date(endDate);
//     const today = new Date();

//     // Check if subscription is active
//     if (today < subscriptionStart || today > subscriptionEnd) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(403)
//         .json({ message: "Your subscription is inactive or expired." });
//     }

//     // Check if voter limit is reached
//     // if (currentVoters >= voterLimit) {
//     //   return res
//     //     .status(403)
//     //     .json({ message: "Voter limit reached for this election" });
//     // }

//     // Validate file format (CSV)
//     const filePath = req.file.path;
//     const ext = path.extname(req.file.originalname).toLowerCase();
//     if (ext !== ".csv") {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "Unsupported file format" });
//     }

//     // Read and parse the CSV file
//     const csvData = fs.readFileSync(filePath, "utf-8");
//     const workbook = xlsx.read(csvData, { type: "string" });
//     const sheetName = workbook.SheetNames[0];
//     let sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     console.log({ sheetData });

//     if (!sheetData.length) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "CSV file is empty." });
//     }

//     // Check if voter limit will be exceeded
//     const sheetVotersCount = sheetData.length;
//     if (currentVoters + sheetVotersCount > voterLimit) {
//       fs.unlinkSync(filePath);
//       return res.status(403).json({
//         message: `Uploading ${sheetVotersCount} voters would exceed your limit of ${voterLimit}. You have ${
//           voterLimit - currentVoters
//         } slots left.`,
//       });
//     }

//     // Normalize headers to lowercase
//     const normalizedSheetData = sheetData.map((row) => {
//       let formattedRow = {};
//       Object.keys(row).forEach((key) => {
//         formattedRow[key.trim().toLowerCase()] = row[key];
//       });
//       return formattedRow;
//     });

//     console.log("Normalized Data:", normalizedSheetData);

//     // Identify headers dynamically (case-insensitive)
//     const firstRow = normalizedSheetData[0];
//     const nameKey = Object.keys(firstRow).find((key) => key.includes("name"));
//     const phoneKey = Object.keys(firstRow).find((key) => key.includes("phone"));
//     const emailKey = Object.keys(firstRow).find((key) => key.includes("email"));

//     if (!nameKey || !phoneKey || !emailKey) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({
//         message: "CSV is missing required headers (Name, Phone, Email).",
//       });
//     }

//     // Process the rows and sanitize values
//     // const votersToAdd = normalizedSheetData
//     //   .map((row, index) => {
//     //     const name = row[nameKey] ? String(row[nameKey]).trim() : null;
//     //     const phone = row[phoneKey] ? String(row[phoneKey]).trim() : null;
//     //     const email = row[emailKey] ? String(row[emailKey]).trim() : null;

//     //     if (!name || !phone || !email) {
//     //       console.log(`Invalid data in row ${index + 1}:`, {
//     //         name,
//     //         phone,
//     //         email,
//     //       });
//     //       return null;
//     //     }

//     //     return {
//     //       fullName: name,
//     //       phone,
//     //       email,
//     //       electionId,
//     //       verificationCode: Math.random()
//     //         .toString(36)
//     //         .substring(2, 8)
//     //         .toUpperCase(),
//     //     };
//     //   })
//     //   .filter(Boolean);

//     const votersToAdd = normalizedSheetData
//       .map((row, index) => {
//         const name = row[nameKey] ? String(row[nameKey]).trim() : null;
//         const phone = row[phoneKey]
//           ? String(row[phoneKey]).trim() || null
//           : null; // Allow null for phone
//         const email = row[emailKey]
//           ? String(row[emailKey]).trim() || null
//           : null; // Allow null for email

//         if (!name) {
//           // Only name is required
//           console.log(`Invalid data in row ${index + 1}:`, {
//             name,
//             phone,
//             email,
//           });
//           return null;
//         }

//         return {
//           fullName: name,
//           phone, // Can be null
//           email, // Can be null
//           electionId,
//           verificationCode: Math.random()
//             .toString(36)
//             .substring(2, 8)
//             .toUpperCase(),
//         };
//       })
//       .filter(Boolean);

//     // console.log({ votersToAdd });

//     if (!votersToAdd.length) {
//       fs.unlinkSync(filePath);
//       return res.status(400).json({ message: "No valid voters to upload." });
//     }

//     // Check for existing phone numbers and emails
//     const existingVoters = await Voter.find({
//       electionId,
//       $or: [
//         { phone: { $in: votersToAdd.map((voter) => voter.phone) } },
//         { email: { $in: votersToAdd.map((voter) => voter.email) } },
//       ],
//     }).select("phone email");

//     const existingPhones = existingVoters.map((voter) => voter.phone);
//     const existingEmails = existingVoters.map((voter) => voter.email);

//     // Filter out already registered voters
//     const newVoters = votersToAdd.filter(
//       (voter) =>
//         !existingPhones.includes(voter.phone) &&
//         !existingEmails.includes(voter.email)
//     );

//     if (!newVoters.length) {
//       fs.unlinkSync(filePath);
//       return res
//         .status(400)
//         .json({ message: "All voters are already registered." });
//     }

//     // Insert new voters
//     const createdVoters = await Voter.insertMany(newVoters);

//     // Update the Election document with new voters
//     await Election.findByIdAndUpdate(
//       electionId,
//       {
//         $addToSet: {
//           voters: { $each: createdVoters.map((voter) => voter._id) },
//         },
//       },
//       { new: true }
//     );

//     // Remove the uploaded file after processing
//     fs.unlinkSync(filePath);

//     // Send email notifications for each new voter
//     const emailPromises = createdVoters.map(async (newVoter) => {
//       const votingLink = `${process.env.CLIENT_URL}/voting/${electionId}/voter/${newVoter._id}/login`;
//       const subject = `You're Registered to Vote in ${election.title} Election`;
//       const message = `
//         <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
//           <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; overflow: hidden;">
//             <div style="background-color: #4A90E2; padding: 20px; text-align: center; color: #ffffff;">
//               <h1 style="margin: 0;">Election Notification</h1>
//             </div>
//             <div style="padding: 20px;">
//               <p style="text-transform: capitalize;">Dear <strong>${newVoter.fullName}</strong>,</p>
//               <p>Welcome to the <strong>${election.title} Election</strong>. Below are your voter credentials:</p>
//               <p><strong>Voter ID:</strong> ${newVoter._id}</p>
//               <p><strong>Voter Code:</strong> ${newVoter.verificationCode}</p>
//               <p style="margin: 20px 0; text-align: center;">
//                 <a href="${votingLink}" style="display: inline-block; background-color: #4A90E2; color: #ffffff; padding: 12px 20px; font-size: 16px; text-decoration: none; border-radius: 5px;">
//                   Go to Voting Portal
//                 </a>
//               </p>
//               <p>If you have any questions, please contact the election organizer.</p>
//               <p>Best regards,<br>Election Team</p>
//             </div>
//             <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
//               <p style="margin: 0;">&copy; 2024 Election System. All rights reserved.</p>
//             </div>
//           </div>
//         </body>`;

//       try {
//         await sendEmail(
//           subject,
//           message,
//           newVoter.email,
//           process.env.EMAIL_USER
//         );
//       } catch (error) {
//         console.log(`Failed to send email to ${newVoter.email}:`, error);
//       }
//     });

//     await Promise.all(emailPromises);

//     res.status(201).json({
//       message: `${createdVoters.length} voters uploaded successfully and emails sent.`,
//       voters: createdVoters,
//     });
//   } catch (error) {
//     if (req.file?.path) fs.unlinkSync(req.file.path);
//     console.error("Error:", error.message);
//     res.status(500).json({ message: error.message });
//   }
// });

const addMultipleVoter = asyncHandler(async (req, res) => {
  const { electionId } = req.params;
  const user = req.user;

  try {
    // Retrieve the election by ID
    const election = await Election.findById(electionId);
    if (!election)
      return res.status(404).json({ message: "Election not found" });

    const { voterLimit, startDate, endDate } = user.subscription;
    const currentVoters = await Voter.countDocuments({ electionId });

    // Convert start and end dates to Date objects
    const today = new Date();
    if (today < new Date(startDate) || today > new Date(endDate)) {
      return res
        .status(403)
        .json({ message: "Your subscription is inactive or expired." });
    }

    // Ensure a file is uploaded
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    if (ext !== ".csv") {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Unsupported file format" });
    }

    // Read and parse CSV file
    const csvData = fs.readFileSync(filePath, "utf-8");
    const workbook = xlsx.read(csvData, { type: "string" });
    const sheetData = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );

    if (!sheetData.length) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "CSV file is empty." });
    }

    // Check voter limit
    if (currentVoters + sheetData.length > voterLimit) {
      fs.unlinkSync(filePath);
      return res.status(403).json({
        message: `Uploading ${
          sheetData.length
        } voters would exceed your limit of ${voterLimit}. You have ${
          voterLimit - currentVoters
        } slots left.`,
      });
    }

    // Normalize headers (lowercase)
    const normalizedSheetData = sheetData.map((row) => {
      return Object.keys(row).reduce((formattedRow, key) => {
        formattedRow[key.trim().toLowerCase()] = row[key];
        return formattedRow;
      }, {});
    });

    // Identify required headers
    const firstRow = normalizedSheetData[0];
    const nameKey = Object.keys(firstRow).find((key) => key.includes("name"));
    const phoneKey = Object.keys(firstRow).find((key) => key.includes("phone"));
    const emailKey = Object.keys(firstRow).find((key) => key.includes("email"));

    if (!nameKey || !phoneKey || !emailKey) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "CSV is missing required headers (Name, Phone, Email).",
      });
    }

    // Process voters
    const votersToAdd = normalizedSheetData
      .map((row, index) => {
        const name = row[nameKey]?.trim() || null;
        // const phone = row[phoneKey]?.trim() || null;
        // const email = row[emailKey]?.trim() || null;
        const phone = row[phoneKey]
          ? String(row[phoneKey]).trim() || null
          : null;
        const email = row[emailKey]
          ? String(row[emailKey]).trim() || null
          : null;

        if (!name) {
          console.log(`Invalid data in row ${index + 1}:`, {
            name,
            phone,
            email,
          });
          return null;
        }

        return {
          fullName: name,
          phone,
          email,
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
      return res.status(400).json({ message: "No valid voters to upload." });
    }

    // Check for existing voters
    const existingVoters = await Voter.find({
      electionId,
      $or: [
        { phone: { $in: votersToAdd.map((v) => v.phone) } },
        { email: { $in: votersToAdd.map((v) => v.email) } },
      ],
    }).select("phone email");

    const existingPhones = new Set(existingVoters.map((v) => v.phone));
    const existingEmails = new Set(existingVoters.map((v) => v.email));

    // Filter out existing voters
    const newVoters = votersToAdd.filter(
      (voter) =>
        !existingPhones.has(voter.phone) && !existingEmails.has(voter.email)
    );

    if (!newVoters.length) {
      fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "All voters are already registered." });
    }

    // Insert new voters
    const createdVoters = await Voter.insertMany(newVoters);

    // Update Election document with new voters
    await Election.findByIdAndUpdate(
      electionId,
      { $addToSet: { voters: { $each: createdVoters.map((v) => v._id) } } },
      { new: true }
    );

    // Cleanup file
    fs.unlinkSync(filePath);

    // Send email notifications
    await Promise.all(
      createdVoters.map(async (newVoter) => {
        const votingLink = `${process.env.CLIENT_URL}/voting/${electionId}/voter/${newVoter._id}/login`;
        const subject = `You're Registered to Vote in ${election.title} Election`;
        const message = `
          <div style="font-family: Arial, sans-serif; text-align: center;">
            <h1 style="color: #4A90E2;">Election Notification</h1>
            <p>Dear <strong>${newVoter.fullName}</strong>,</p>
            <p>You are now registered for the <strong>${election.title}</strong> election.</p>
            <p><strong>Voter ID:</strong> ${newVoter._id}</p>
            <p><strong>Verification Code:</strong> ${newVoter.verificationCode}</p>
            <a href="${votingLink}" style="display: inline-block; background: #4A90E2; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Voting Portal</a>
            <p>If you have any questions, contact the election organizer.</p>
          </div>
        `;

        try {
          await sendEmail(
            subject,
            message,
            newVoter.email,
            process.env.EMAIL_USER
          );
        } catch (error) {
          console.log(`Failed to send email to ${newVoter.email}:`, error);
        }
      })
    );

    res.status(201).json({
      message: `${createdVoters.length} voters uploaded successfully and emails sent.`,
      voters: createdVoters,
    });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    console.error("Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
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

const searchVoterByFullName = asyncHandler(async (req, res) => {
  const { fullName } = req.query; // Get the full name from query parameters
  const { electionId } = req.params;

  if (!fullName) {
    return res.status(400).json({ message: "Full name is required" });
  }

  // Search for users whose fullName matches (case-insensitive)
  const voters = await Voter.find({
    electionId,
    fullName: { $regex: new RegExp(fullName, "i") },
  }).populate("electionId", "electionName");

  if (voters.length === 0) {
    return res.status(404).json({ message: "No users found" });
  }

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

  const voter = await Voter.findByIdAndDelete(id);

  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }

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
  searchVoterByFullName,
  createVoterAndSendSMS,
  createVoterNew,
  loginVoter,
  castVote,

  addMultipleVoter,
};
