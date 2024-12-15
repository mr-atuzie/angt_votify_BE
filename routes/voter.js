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
  createVoterAndSendSMS,
  createVoterNew,
  loginVoter,
} = require("../controllers/voter");

router.post("/", protect, createVoterNew);
router.post("/create-voter2", protect, createVoterAndSendSMS);

router.get("/", protect, getVoters);
router.get("/election/:electionId", protect, getVotersByElectionId);

router.post("/login", loginVoter);

router.get("/:id", protect, getVoterById);
router.put("/:id", protect, updateVoter);
router.delete("/:id", protect, deleteVoter);

module.exports = router;
