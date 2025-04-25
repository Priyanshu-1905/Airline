const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true },
  flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight' },
  seatNumber: { type: Number, required: true },
  paymentCode: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;