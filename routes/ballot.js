const express = require("express");
const router = express.Router();
const ballotController = require("../controllers/ballot");
const { protect } = require("../middlewares/authMiddleware");

// Routes for ballot
router.post("/create-ballot", protect, ballotController.createBallot);

// Route to get all ballots for a specific election
router.get("/election/:electionId", ballotController.getBallotsByElection);

router.get("/results/:electionId", protect, ballotController.getResults);

// Route to get a single ballot by ID
router.get("/:id", protect, ballotController.getBallotById);

// Route to update a ballot by ID
router.patch("/:id", protect, ballotController.updateBallot);

// Route to delete a ballot by ID
router.delete("/:id", protect, ballotController.deleteBallot);

// routes for voting option

// Route to create a new voting option
router.post(
  "/create-ballot-option",
  protect,
  ballotController.createVotingOption
);

// Route to get all voting options for a specific ballot
router.get(
  "/ballot/:ballotId",
  protect,
  ballotController.getVotingOptionsByBallot
);

// Route to get a single voting option by ID
router.get("/voting-option/:id", protect, ballotController.getVotingOptionById);

// Route to update a voting option by ID
router.put("/voting-option/:id", protect, ballotController.updateVotingOption);

// Route to update a voting option by ID
router.put(
  "/clearAllOptions/:id",
  protect,
  ballotController.clearAllVotingOptions
);

// Route to delete a voting option by ID
router.delete(
  "/voting-option/:id",
  protect,
  ballotController.deleteVotingOption
);

module.exports = router;
