const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("Email already exists");
  }

  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user
  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    role,
  });

  await newUser.save();
  res
    .status(201)
    .json({ message: "User registered successfully", user: newUser });
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

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.status(200).json({ message: "Login successful", token });
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
  const { username, email, password } = req.body;

  // Check if the user exists
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if password is provided and hash it
  let updatedPassword = user.password;
  if (password) {
    updatedPassword = await bcrypt.hash(password, 10);
  }

  // Update user details
  user.username = username || user.username;
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

// Export all controllers as an object
module.exports = {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,
};
