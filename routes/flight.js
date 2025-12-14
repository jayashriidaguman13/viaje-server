/*****************
FLIGHT ROUTE
******************/
const express = require("express");
const flightController = require("../controllers/flights.js");

const { auth, isLoggedIn, admin } = require('../auth.js');

//[SECTION] Routing Component
const router = express.Router();

router.post("/create-flight",auth, admin, flightController.createFlight);

router.get("/search", flightController.searchFlights);

router.get("/all-flights",auth, admin, flightController.getAllFlights);

router.get("/:flightId", auth, flightController.getFlightById);

router.put("/update/:flightId",auth, admin, flightController.updateFlight);

router.patch("/archive/:flightId", auth, admin, flightController.archiveFlight);

router.patch("/activate/:flightId", auth, admin, flightController.activateFlight);

module.exports = router;