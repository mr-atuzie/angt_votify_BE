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

// Export the middleware
module.exports = { protect };
