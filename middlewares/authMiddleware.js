const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Middleware to protect routes that require authentication
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(400);
    throw new Error("Not authorized,no token");
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, data) => {
    if (err) {
      res.status(400);
      throw new Error("Not authorized,invaid token");
    } else {
      // Attach the user ID and role to the request object
      req.userId = data.userId;
      req.role = data.role;

      next();
    }
  });
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
