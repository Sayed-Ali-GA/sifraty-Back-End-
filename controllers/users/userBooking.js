const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken: verifyToken } = require("../../middleware/verify-token");


router.post("/:flightId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Only users can book flights" });
    }

    const { flightId } = req.params;
    const { first_name, last_name, passport_number, nationality, age, email, phone, notes } = req.body;


    const flightRes = await pool.query(
      "SELECT * FROM flights WHERE id = $1",
      [flightId]
    );
    if (flightRes.rows.length === 0)
      return res.status(404).json({ message: "Flight not found" });


    if (!first_name || !last_name || !passport_number || !nationality || !age) {
      return res.status(400).json({ message: "All fields are required" });
    }


    const booking = await pool.query(
      `INSERT INTO bookings 
        (user_id, flight_id, first_name, last_name, passport_number, nationality, age, email, phone, notes )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [req.user.id, flightId, first_name, last_name, passport_number, nationality, age, email, phone, notes]
    );

    res.status(201).json(booking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});




router.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT 
        b.id AS booking_id,
        f.from_country,
        f.to_country,
        f.from_city,
        f.to_city,
        f.departure_time,
        f.price,
        a.name AS airline_name
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airlines a ON f.airline_id = a.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
      `,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});








router.delete("/:bookingId", verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const result = await pool.query(
      "DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *",
      [bookingId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;