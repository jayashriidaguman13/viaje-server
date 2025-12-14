/*****************
FLIGHT CONTROLLER
******************/
const bcrypt = require("bcrypt");

const Flight = require("../models/Flight.js");

const auth = require("../auth.js");

const { errorHandler } = require("../auth.js");

module.exports.createFlight = async (req, res) => {
  try {
    let {
      flightNumber,
      origin,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      price
    } = req.body;

    if (!origin || !destination || !departureTime || !arrivalTime || price === undefined) {
      return res.status(400).json({
        message: "Origin, destination, departure/arrival time, and price are required"
      });
    }

    if (price < 0) {
      return res.status(400).json({ message: "Price must be a positive number" });
    }

    if (origin === destination) {
      return res.status(400).json({ message: "Origin and destination cannot be the same" });
    }

    if (!flightNumber) {
      flightNumber = "PR" + Math.floor(100 + Math.random() * 900); 
    }

    const today = new Date();
    const depDate = departureDate ? new Date(departureDate) : today;
    const arrDate = arrivalDate ? new Date(arrivalDate) : today;

    const existingFlight = await Flight.findOne({ flightNumber });
    if (existingFlight) {
      return res.status(400).json({ message: "Flight number already exists" });
    }

    const newFlight = await Flight.create({
      flightNumber,
      origin,
      destination,
      departureDate: depDate,
      departureTime,
      arrivalDate: arrDate,
      arrivalTime,
      price
    });

    return res.status(201).json({
      message: "Flight created successfully",
      flight: newFlight
    });

  } catch (error) {
    console.error("Create Flight Error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

module.exports.searchFlights = async (req, res) => {
    try {
        const { origin, destination, date, returnDate } = req.query;

        if (!origin || !destination) {
            return res.status(400).json({
                message: "Please provide origin, destination, and date for search"
            });
        }

        const startOfDay = (d) => {
            const day = new Date(d);
            day.setHours(0, 0, 0, 0);
            return day;
        };

        const endOfDay = (d) => {
            const day = new Date(startOfDay(d));
            day.setDate(day.getDate() + 1);
            return day;
        };

        const departureFilter = {
            origin: origin.trim(),
            destination: destination.trim(),
            isActive: true
        };

        const departureFlights = await Flight.find(departureFilter);

        let returnFlights = [];
        if (returnDate) {
            const returnFilter = {
                origin: destination.trim(),
                destination: origin.trim(),
                isActive: true
            };
            returnFlights = await Flight.find(returnFilter);
        }

        const mapDate = (flights, targetDate) => {
            return flights.map(f => ({
                ...f._doc,
                departureDate: targetDate,
                arrivalDate: targetDate
            }));
        };

        const response = {
            message: "Flights found",
            count: departureFlights.length,
            departureFlights: mapDate(departureFlights, date),
            returnFlights: returnDate ? mapDate(returnFlights, returnDate) : []
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.getFlightById = async (req, res) => {
    try {
        const { flightId } = req.params;

        if (!flightId) {
            return res.status(400).json({ message: "Flight ID is required" });
        }

        const flight = await Flight.findById(flightId);

        if (!flight) {
            return res.status(404).json({ message: "Flight not found" });
        }

        return res.status(200).json({
            message: "Flight found",
            flight
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};


module.exports.getAllFlights = async (req, res) => {
    try {
        const flights = await Flight.find();
        console.log("Flights fetched from DB:", flights);
        return res.status(200).json({
            message: "All flights",
            count: flights.length,
            flights
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.updateFlight = async (req, res) => {
    try {

        const flightId = req.params.flightId;
        const {
            
            flightNumber,
            origin,
            destination,
            departureDate,
            departureTime,
            arrivalDate,
            arrivalTime,
            price
        } = req.body;

        if (!flightId || !flightNumber || !origin || !destination ||
            !departureDate || !departureTime || !arrivalDate || !arrivalTime ||
            price === undefined) {
            
            return res.status(400).json({ message: "All fields are required" });
        }

        if (price < 0) {
            return res.status(400).json({ message: "Price must be a positive number" });
        }

        const depDate = new Date(departureDate);
        const arrDate = new Date(arrivalDate);

        if (isNaN(depDate) || isNaN(arrDate)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD format." });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: "Flight not found" });
        }

        const existingFlight = await Flight.findOne({
            _id: { $ne: flightId },
            departureDate: depDate,
            departureTime: departureTime
        });
        if (existingFlight) {
            return res.status(400).json({
                message: "Another flight with the same schedule already exists.",
                conflict: {
                    departureDate,
                    departureTime
                }
            });
        }

        flight.flightNumber = flightNumber;
        flight.origin = origin;
        flight.destination = destination;
        flight.departureDate = depDate;
        flight.departureTime = departureTime;
        flight.arrivalDate = arrDate;
        flight.arrivalTime = arrivalTime;
        flight.price = price;

        await flight.save();

        return res.status(200).json({
            message: "Flight updated successfully",
            flight
        });

    } catch (error) {
        console.error("Update Flight Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.archiveFlight = async (req, res) => {
    try {
        const { flightId } = req.params;

        if (!flightId) {
            return res.status(400).json({ message: "Flight ID is required" });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: "Flight not found" });
        }

        flight.isActive = false;
        await flight.save();

        return res.status(200).json({
            message: "Flight archived successfully",
            flight
        });

    } catch (error) {
        console.error("Archive Flight Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.activateFlight = async (req, res) => {
    try {
        const { flightId } = req.params;

        if (!flightId) {
            return res.status(400).json({ message: "Flight ID is required" });
        }

        const flight = await Flight.findById(flightId);
        if (!flight) {
            return res.status(404).json({ message: "Flight not found" });
        }

        flight.isActive = true;
        await flight.save();

        return res.status(200).json({
            message: "Flight activated successfully",
            flight
        });

    } catch (error) {
        console.error("Activate Flight Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}