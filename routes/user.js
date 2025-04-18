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
  forgetPassword,
  resetPassword,
  subscribe,
  verifyEmail,
  searchUserByFullName,
  contactUs,
} = require("../controllers/user");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-email", protect, verifyEmail);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:resetToken", resetPassword);

router.get("/logout", logout);

router.get("/loginStatus", loginStatus);

router.post("/contact-us", contactUs);

// Protected routes (must be authenticated)
router.get("/profile", protect, getUserDetails);
router.put("/profile", protect, updateUserProfile);
router.put("/profile/change-password", protect, updateUserPassword);
router.delete("/profile", protect, deleteUser);

router.get("/search", protect, searchUserByFullName);

router.patch("/subscribe", protect, subscribe);

router.get("/election", protect, getElectionsByUser);

router.get("/dashboard", protect, userDashboard);

module.exports = router;
