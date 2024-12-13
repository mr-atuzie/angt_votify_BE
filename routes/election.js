const express = require("express");
const router = express.Router();
const electionController = require("../controllers/election");
const { protect } = require("../middlewares/authMiddleware");

// Routes for elections
router.post("/create", protect, electionController.createElection);
router.get("/", protect, electionController.getAllElections);
router.get("/:id", protect, electionController.getElectionById);

router.get("/:id/status", electionController.getElectionStatus);
router.get("/:id/total", protect, electionController.getTotalVoters);

router.put("/:id", protect, electionController.updateElection);
router.put("/close/:id", protect, electionController.closeElection);

router.delete("/:id", protect, electionController.deleteElection);

router.post("/create-ballot", protect, electionController.createElectionBallot);

module.exports = router;
