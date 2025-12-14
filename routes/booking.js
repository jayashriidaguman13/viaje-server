/*****************
BOOKING ROUTE
******************/
const express = require("express");
const bookingController = require("../controllers/bookings.js");

const { auth, isLoggedIn, admin } = require('../auth.js');

//[SECTION] Routing Component
const router = express.Router();

router.post("/create", auth, isLoggedIn, bookingController.createBooking);

router.get("/my-bookings", auth, isLoggedIn, bookingController.getMyBookings);

router.get("/all", auth, admin, bookingController.getAllBookings);

router.patch("/cancel/:bookingId", auth, isLoggedIn, bookingController.cancelBooking);

module.exports = router;