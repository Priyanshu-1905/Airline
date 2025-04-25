const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const Booking = require("./booking"); // ✅ Make sure models/booking.js exists

// Flight Schema
const flightSchema = new mongoose.Schema({
  from: String,
  to: String,
  date: String,
  time: String,
  seats: Number,
  bookedSeats: [Number]
});

const Flight = mongoose.model("Flight", flightSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Auto-seed if no flights found
    const flightCount = await Flight.countDocuments();
    if (flightCount === 0) {
      const flights = [
        { from: "India", to: "Canada", date: "2025-04-26", time: "10:00 AM" },
        { from: "India", to: "USA", date: "2025-04-27", time: "3:30 PM" },
        { from: "India", to: "New Zealand", date: "2025-04-28", time: "6:00 AM" },
        { from: "India", to: "UK", date: "2025-04-29", time: "9:15 PM" },
        { from: "India", to: "Australia", date: "2025-04-30", time: "7:00 AM" },
        { from: "India", to: "Germany", date: "2025-05-01", time: "2:45 PM" },
        { from: "India", to: "France", date: "2025-05-02", time: "1:00 PM" },
        { from: "India", to: "Italy", date: "2025-05-03", time: "11:30 AM" },
        { from: "India", to: "Japan", date: "2025-05-04", time: "8:00 AM" },
        { from: "India", to: "Singapore", date: "2025-05-05", time: "5:30 PM" }
      ];
      await Flight.insertMany(flights.map(f => ({ ...f, seats: 60, bookedSeats: [] })));
      console.log("✨ Flights auto-seeded successfully");
    } else {
      console.log("📦 Flights already exist — skipping seeding");
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Your '/api/bookings' route
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("flightId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// Seed flights
app.get("/api/seed", async (req, res) => {
  try {
    await Flight.deleteMany({});
    const flights = [
      { from: "India", to: "Canada", date: "2025-04-26", time: "10:00 AM" },
      { from: "India", to: "USA", date: "2025-04-27", time: "3:30 PM" },
      { from: "India", to: "New Zealand", date: "2025-04-28", time: "6:00 AM" },
      { from: "India", to: "UK", date: "2025-04-29", time: "9:15 PM" },
      { from: "India", to: "Australia", date: "2025-04-30", time: "7:00 AM" },
      { from: "India", to: "Germany", date: "2025-05-01", time: "2:45 PM" },
      { from: "India", to: "France", date: "2025-05-02", time: "1:00 PM" },
      { from: "India", to: "Italy", date: "2025-05-03", time: "11:30 AM" },
      { from: "India", to: "Japan", date: "2025-05-04", time: "8:00 AM" },
      { from: "India", to: "Singapore", date: "2025-05-05", time: "5:30 PM" }
    ];

    await Flight.insertMany(flights.map(f => ({ ...f, seats: 60, bookedSeats: [] })));
    res.send("✅ Flights seeded successfully");
  } catch (err) {
    console.error("❌ Error seeding flights:", err);
    res.status(500).json({ message: "Error seeding flights" });
  }
});

// Get all flights
app.get("/api/flights", async (req, res) => {
  try {
    const flights = await Flight.find({});
    res.json(flights);
  } catch (err) {
    console.error("❌ Error fetching flights:", err);
    res.status(500).json({ message: "Error fetching flights" });
  }
});

// Get single flight
app.get("/api/flights/:id", async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({ message: "Flight not found" });
    }
    res.json(flight);
  } catch (err) {
    console.error("❌ Error fetching flight:", err);
    res.status(500).json({ message: "Error fetching flight" });
  }
});

// Book seat
app.post("/api/book", async (req, res) => {
  const { user, flightId, seatNumber, paymentCode } = req.body;

  console.log("📩 Received booking request:", req.body);

  // Validation
  if (!paymentCode || paymentCode.trim() === "") {
    return res.status(400).json({ message: "❌ Invalid payment details" });
  }

  if (!flightId || !mongoose.Types.ObjectId.isValid(flightId)) {
    return res.status(400).json({ message: "❌ Invalid flight ID" });
  }

  try {
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({ message: "❌ Flight not found" });
    }

    if (flight.bookedSeats.includes(seatNumber)) {
      return res.status(400).json({ message: `❌ Seat ${seatNumber} already booked` });
    }

    flight.bookedSeats.push(seatNumber);
    await flight.save();

    const booking = new Booking({
      user,
      flightId,
      seatNumber,
      paymentCode
    });

    await booking.save();

    res.json({ message: "✅ Booking successful!" });

  } catch (err) {
    console.error("❌ Error booking seat:", err);
    res.status(500).json({ message: "❌ Error booking seat" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
