const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,
} = require("../controllers/user");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (must be authenticated)
router.get("/profile", protect, getUserDetails);
router.put("/profile", protect, updateUserProfile);
router.delete("/profile", protect, deleteUser);

module.exports = router;
