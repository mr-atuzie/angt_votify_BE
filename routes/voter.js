const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middlewares/authMiddleware");
const {
  getVoters,
  getVoterById,
  updateVoter,
  deleteVoter,
  getVotersByElectionId,
  createVoterAndSendSMS,
  createVoterNew,
  loginVoter,
  castVote,
  addMultipleVoter,
  searchVoterByFullName,
} = require("../controllers/voter");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post("/", protect, createVoterNew);
router.post(
  "/upload-voters/:electionId",
  upload.single("file"),
  protect,
  addMultipleVoter
);
router.post("/create-voter2", protect, createVoterAndSendSMS);

router.post("/cast-vote", castVote);

router.get("/", protect, getVoters);
router.get("/election/:electionId", protect, getVotersByElectionId);

router.get("/election/:electionId/search", protect, searchVoterByFullName);

router.post("/login", loginVoter);

router.get("/:id", getVoterById);
router.put("/:id", protect, updateVoter);
router.delete("/:id", protect, deleteVoter);

module.exports = router;
