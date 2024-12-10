const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    // Check if the token is present
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, please login");
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user based on the decoded token
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(404); // Not Found
      throw new Error("User not found");
    }

    // Attach the user to the request object for further use
    req.user = user;

    next(); // Pass control to the next middleware
  } catch (error) {
    console.error("Authentication Error:", error.message);

    // Check for specific JWT errors
    if (error.name === "TokenExpiredError") {
      res.status(401);
      throw new Error("Token has expired, please login again");
    } else if (error.name === "JsonWebTokenError") {
      res.status(401);
      throw new Error("Invalid token, please login");
    } else {
      // Generic error response
      res.status(500);
      throw new Error("Authentication failed");
    }
  }
});

module.exports = { protect };
