/*****************
BOOKING CONTROLLER
******************/

const bcrypt = require("bcrypt");

const Booking = require("../models/Booking");
const User = require("../models/User");
const Passenger = require("../models/Passenger");
const Flight = require("../models/Flight");

const auth = require("../auth");

const { errorHandler } = require("../auth.js");

module.exports.createBooking = async (req, res) => {
	try {
		const userId = req.user.id;
		const {flightId, passengers, bookingType, totalAmount, paymentMethod, flightNumber, departureDate, returnDate} = req.body;

		if(!flightId || !passengers || !bookingType || !totalAmount || !paymentMethod || !flightNumber || !departureDate) {
			return res.status(400).json({message: "All booking fields are required"})
		}

		if(bookingType === "roundTrip" && !returnDate) {
			return res.status(400).json({message: "Return date is required for round trip bookings"})
		}

		if(!Array.isArray(passengers) || passengers.length === 0) {
			return res.status(400).json({message: "Passengers must be a non-empty array"})
		}

		const allowedBookingTypes = ["oneWay", "roundTrip"];
		if (!allowedBookingTypes.includes(bookingType)) {
			return res.status(400).json({message: "Booking Type must be either one-way or round trip"})
		}

		const allowedPaymentMethods = ["credit_card", "debit_card", "digital_wallet", "paypal", "bank_transfer"];
		if (!allowedPaymentMethods.includes(paymentMethod)) {
			return res.status(400).json({message: `Payment Method must be one of ${allowedPaymentMethods}`})
		}

		if (passengers.length > 4) {
			return res.status(400).json({message: "Maximum 4 passengers allowed per booking"})
		}

		const newBooking = new Booking({
			userId,
			flightId,
			passengers,
			bookingType,
			totalAmount,
			paymentMethod,
			flightNumber,
			departureDate: new Date(departureDate),
			returnDate: returnDate ? new Date(returnDate) : undefined,
			status: "pending",
			bookingDate: new Date() 
		});

		const savedBooking = await newBooking.save();

		const passengerDocs = await Promise.all(
			passengers.map(passenger => {
				return Passenger.create({
					userId,
					bookingId: savedBooking._id,
					firstName: passenger.firstName,
					lastName: passenger.lastName,
					email: passenger.email,
					phoneNumber: passenger.phoneNumber
				});
			})
		);

		res.status(201).json({
			message: "Booking created successfully",
			booking: savedBooking,
			passengers: passengerDocs
		})
	} catch (error) {
		console.error(error);
		res.status(500).json({messsage: "Failed to create booking", error});
	}
}

module.exports.getMyBookings = async (req, res) => {
	try {
		const userId = req.user.id;

		const bookings = await Booking.find({userId})
			.populate("flightId")
			.sort({bookingDate: -1})

		if (bookings.length === 0) {
			return res.status(200).json({
				message: "No bookings found",
				bookings: []
			})
		}

		res.status(200).json({
			message: "Bookings retrieved successfully",
			bookings
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({message: "Failed to retrieve bookings", error})
	}
};

module.exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("flightId")
      .sort({ bookingDate: -1 });

    if (bookings.length === 0) {
      return res.status(200).json({
        message: "No bookings found",
        bookings: []
      });
    }

    res.status(200).json({
      message: "Bookings retrieved successfully",
      bookings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve bookings",
      error: error.message
    });
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!req.user.isAdmin && booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};