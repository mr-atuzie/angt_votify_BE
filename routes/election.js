const express = require("express");
const router = express.Router();
const electionController = require("../controllers/election");
const { protect } = require("../middlewares/authMiddleware");

// Routes for elections
router.post("/create", protect, electionController.createElection);
router.get("/", protect, electionController.getAllElections);
router.get("/:id", protect, electionController.getElectionById);
router.put("/:id", protect, electionController.updateElection);
router.put("/close/:id", protect, electionController.closeElection);

router.post("/create-ballot", protect, electionController.createElectionBallot);

module.exports = router;
