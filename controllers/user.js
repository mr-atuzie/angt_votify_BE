const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password) {
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
    role,
  });

  if (newUser) {
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser, token });
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
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400),
      sameSite: "none",
      secure: true,
    });

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

module.exports = {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,
};
