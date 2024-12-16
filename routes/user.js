const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserDetails,
  updateUserProfile,
  deleteUser,
  getElectionsByUser,
  userDashboard,
  updateUserPassword,
  logout,
  loginStatus,
} = require("../controllers/user");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/logout", logout);

router.get("/loginStatus", loginStatus);

// Protected routes (must be authenticated)
router.get("/profile", protect, getUserDetails);
router.put("/profile", protect, updateUserProfile);
router.put("/profile/change-password", protect, updateUserPassword);
router.delete("/profile", protect, deleteUser);

router.get("/election", protect, getElectionsByUser);

router.get("/dashboard", protect, userDashboard);

module.exports = router;
