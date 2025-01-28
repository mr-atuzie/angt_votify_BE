const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  // Extract the token from cookies
  const token = req.cookies?.token;

  // Check if the token exists
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Fetch the user from the database
  const user = await User.findById(decoded.userId).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Attach the user to the request object
  req.user = user;

  // Proceed to the next middleware
  next();
});

module.exports = { protect };
