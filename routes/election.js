const express = require("express");
const router = express.Router();
const electionController = require("../controllers/election");

// Routes for elections
router.post("/create", electionController.createElection);
router.get("/", electionController.getAllElections);
router.get("/:id", electionController.getElectionById);
router.put("/:id", electionController.updateElection);
router.put("/close/:id", electionController.closeElection);

module.exports = router;
