/**********************
BOOKING COLLECTION SCHEMA
***********************/
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Flight",
    required: true
  },
  passengers: {
    type: Array,
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: "Passengers array cannot be empty."
    }
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["confirmed", "pending", "cancelled"],
    default: "pending"
  },
  bookingType: {
    type: String,
    enum: ["oneWay", "roundTrip"],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "digital_wallet", "paypal", "bank_transfer"],
    required: true
  },
  flightNumber: {
    type: String,
    required: true,
    trim: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Booking", bookingSchema);