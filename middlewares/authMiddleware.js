const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Middleware to protect routes that require authentication
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in the request header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from the header
      token = req.headers.authorization.split(" ")[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user ID and role to the request object
      req.userId = decoded.userId;
      req.role = decoded.role;

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  }

  // If no token, return an error
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Middleware to check if the user is an admin
const isAdmin = asyncHandler(async (req, res, next) => {
  // Check if the user has 'admin' role
  if (req.role !== "admin") {
    res.status(403); // Forbidden
    throw new Error("Access denied, admin only");
  }

  // Proceed if user is admin
  next();
});

// Export the middleware
module.exports = { protect, isAdmin };
