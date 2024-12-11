const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const Election = require("../models/election");

const characters = "0123456789";
// "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateString(length) {
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    res.status(400);
    throw new Error("Please enter all required fields");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already exists");
  }

  // Hash password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create a new user
  const newUser = await User.create({
    fullName,
    email,
    password: hashedPassword,
    phone,
  });

  if (newUser) {
    // Generate JWT token with 1-hour expiration
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Set JWT token to expire in 1 hour
    });

    // Set the cookie to expire in 1 hour
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in milliseconds
      sameSite: "none",
      secure: true,
    });

    console.log("new engine");

    const subject = "Verify your Email";
    const send_to = newUser.email;
    const send_from = process.env.EMAIL_USER;
    const verificationCode = generateString(7);
    // const verificationMessage = VerifyEmail(newUser.fullName, verificationCode);

    const hashedCode = await bcrypt.hash(verificationCode, salt);

    //find and remove old token
    let oldToken = await Token.findOne({ userId: newUser._id });

    if (oldToken) {
      await oldToken.deleteOne();
    }

    // create new token
    const newToken = await new Token({
      userId: newUser._id,
      token: hashedCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * (60 * 1000),
    }).save();

    const message = `
             <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
        <div style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 5px; overflow: hidden;">
            <div style="background-color: #FF5D2E; padding: 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0;">Welcome!</h1>
            </div>
            <div style="padding: 20px;">
                <p style="text-transform: capitalize;">Hi <strong>${newUser.fullName}</strong>,</p>
                <p> Please use the following verification code to complete your sign-up process:</p>
                <p style="font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0;">${verificationCode}</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Best regards,<br>Secure Auth</p>
            </div>
            <div style="background-color: #f4f4f4; padding: 10px; text-align: center; color: #777777;">
                <p style="margin: 0;">&copy; 2024 Secure Auth. All rights reserved.</p>
            </div>
        </div>
    </body>`;

    try {
      await sendEmail(subject, message, send_to, send_from);
      res.status(201).json({
        newUser,
        token,
        msg: "Email has been sent",
        verificationCode,
        newToken,
      });
    } catch (error) {
      res.status(500);
      throw new Error("Email not sent , Please try Again.");
    }
  } else {
    res.status(400);
    throw new Error("unable to register user");
  }
});

// Login user and return a JWT token
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  // Check if password is correct
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  if (user) {
    // Generate JWT token with 1-hour expiration
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Set JWT token to expire in 1 hour
    });

    // Set the cookie to expire in 1 hour
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in milliseconds
      sameSite: "none",
      secure: true,
    });

    console.log("new engine");

    res.status(201).json({ message: "Login successfully", user, token });
  } else {
    res.status(400);
    throw new Error("Something went wrong, Please try again.");
  }
});

// Get user details by ID
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  // Check if the user exists
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if password is provided and hash it
  let updatedPassword = user.password;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updatedPassword = await bcrypt.hash(password, salt);
  }

  // Update user details
  user.fullName = fullName || user.fullName;
  user.email = email || user.email;
  user.password = updatedPassword;

  await user.save();
  res.status(200).json({ message: "User profile updated successfully", user });
});

// Delete user account
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.remove();
  res.status(200).json({ message: "User account deleted successfully" });
});

const getElectionsByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch elections created by the user
  const elections = await Election.find({ user: userId }).sort("-createdAt");

  // if (!elections.length) {
  //   return res
  //     .status(404)
  //     .json({ message: "No elections found for this user" });
  // }

  res.status(200).json(elections);
});

module.exports = {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,

  getElectionsByUser,
};
