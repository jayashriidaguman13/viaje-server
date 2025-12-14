/**********************
FLIGHT COLLECTION SCHEMA
***********************/
const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
	flightNumber: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	origin: {
		type: String,
		required: true,
		trim: true
	},
	destination: {
		type: String,
		required: true,
		trim: true
	},
	departureDate: {
		type: Date,
		required: true
	},
	departureTime: {
		type: String,
		required: true
	},
	arrivalDate: {
		type: Date,
		required: true
	},
	arrivalTime: {
		type: String,
		required: true
	},
	price: {
		type: Number,
		required: true,
		min: 0
	},
	isActive: {
		type: Boolean,
		default: true
	}
},
{
	timestamps: true
});

module.exports = mongoose.model("Flight", flightSchema);