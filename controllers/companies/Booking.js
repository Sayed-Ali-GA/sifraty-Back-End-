const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken: verifyToken } = require("../../middleware/verify-token");



router.get("/bookings", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "airline") {
      return res.status(403).json({ message: "Access denied" });
    }

    const airlineId = req.user.id;

    const result = await pool.query(
      `
      SELECT 
        b.id AS booking_id,
        b.user_id,
        b.flight_id,
        b.seats_booked,
        b.total_price,
        b.booking_date,
        b.notes,
        b.first_name,
        b.last_name,
        b.passport_number,
        b.nationality,
        b.age,
        b.email,
        b.phone,
        b.notes,
        f.from_city,
        f.to_city,
        f.departure_time,
        f.arrival_time,
        f.price AS flight_price,
        a.name AS airline_name
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      WHERE a.id = $1
      ORDER BY b.booking_date DESC
      `,
      [airlineId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


router.get("/flights/:flightId/bookings", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "airline") {
      return res.status(403).json({ message: "Access denied" });
    }

    const airlineId = req.user.id;
    const flightId = req.params.flightId;

    const result = await pool.query(
      `
      SELECT 
        b.id AS booking_id,
        b.user_id,
        b.flight_id,
        b.seats_booked,
        b.total_price,
        b.booking_date,
        b.notes,
        b.first_name,
        b.last_name,
        b.passport_number,
        b.nationality,
        b.age,
        b.email,
        b.phone,
        b.notes,
        f.from_city,
        f.to_city,
        f.departure_time,
        f.arrival_time,
        f.price AS flight_price,
        a.name AS airline_name
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      WHERE a.id = $1 AND f.id = $2
      ORDER BY b.booking_date DESC
      `,
      [airlineId, flightId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
