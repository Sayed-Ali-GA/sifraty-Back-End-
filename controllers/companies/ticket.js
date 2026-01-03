const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken: verifyToken } = require("../../middleware/verify-token");

// =========================================== Middleware =========================================================
const checkFlightOwnership = async (req, res, next) => {
  try {
    const { flightId } = req.params;
    const flightRes = await pool.query("SELECT * FROM flights WHERE id=$1", [flightId]);

    if (flightRes.rows.length === 0)
      return res.status(404).json({ error: true, message: "Flight not found" });

    const flight = flightRes.rows[0];

    if (flight.airline_id !== req.user.id)
      return res.status(403).json({ error: true, message: "You are not allowed to modify this flight" });

    req.flight = flight;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
};

// =================================================== Public Routes ===============================================================
// GET flights for logged-in airline only
router.get("/my-flights", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "airline") {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `SELECT *
       FROM flights
       WHERE airline_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// ======================================================= Protected Routes ======================================================================

// Post new flight
router.post("/new", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "airline") {
      return res.status(403).json({ error: true, message: "Only airlines can add flights" });
    }

    const { from_city, to_city, departure_time, arrival_time, price, flight_number, baggage, wifi } = req.body;

    const depDate = new Date(departure_time);
    const arrDate = new Date(arrival_time);

   
    const insertResult = await pool.query(
      `INSERT INTO flights (
        airline_id, from_city, to_city, departure_time, arrival_time,
        price, flight_number, baggage, wifi, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      RETURNING *`,
      [
        req.user.id,
        from_city,
        to_city,
        depDate,
        arrDate,
        Number(price),
        flight_number,
        baggage ? Number(baggage) : null,
        wifi === true
      ]
    );

    const flight = insertResult.rows[0];


    res.status(201).json(flight);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});


// Edit flight
router.put("/:flightId", verifyToken, checkFlightOwnership, async (req, res) => {
  try {
    const { from_city, to_city, departure_time, arrival_time, price, flight_number, baggage, wifi } = req.body;

    const depDate = new Date(departure_time);
    const arrDate = new Date(arrival_time);

    const updated = await pool.query(
      `UPDATE flights SET 
         from_city=$1, to_city=$2, departure_time=$3, arrival_time=$4,
         price=$5, flight_number=$6, baggage=$7, wifi=$8
       WHERE id=$9 AND airline_id=$10
       RETURNING *`,
      [
        from_city,
        to_city,
        depDate,
        arrDate,
        Number(price),
        flight_number,
        baggage ? Number(baggage) : null,
        wifi === true,
        req.params.flightId,
        req.user.id
      ]
    );

    res.status(200).json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});

// delete flight
router.delete("/:flightId", verifyToken, checkFlightOwnership, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM flights WHERE id=$1 AND airline_id=$2",
      [req.params.flightId, req.user.id]
    );
    res.status(200).json({ message: "Flight deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
