const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const {
  createVoter,
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getVotersByElectionId,
} = require("../controllers/voter");

router.post("/", protect, createVoter);
router.get("/", protect, getVoters);
router.get("/election/:electionId", protect, getVotersByElectionId);
router.get("/:id", protect, getVoterById);
router.put("/:id", protect, updateVoter);
router.delete("/:id", protect, deleteVoter);

module.exports = router;
