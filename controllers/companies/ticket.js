const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken: verifyToken } = require("../../middleware/verify-token");

// =========================================== Middleware =========================================================
const checkFlightOwnership = async (req, res, next) => {
  try {
    const { flightId } = req.params;

    const flightRes = await pool.query(
      "SELECT * FROM flights WHERE id = $1",
      [flightId]
    );

    if (flightRes.rows.length === 0) {
      return res.status(404).json({ error: true, message: "Flight not found" });
    }

    const flight = flightRes.rows[0];

    if (flight.airline_id !== req.user.id) {
      return res.status(403).json({
        error: true,
        message: "You are not allowed to modify this flight"
      });
    }

    req.flight = flight;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
};

// =========================================== PUBLIC ROUTES =======================================================

// GET all flights (for users & public)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.id,
        f.from_country,
        f.to_country,
        f.from_city,
        f.to_city,
        f.departure_time,
        f.arrival_time,
        f.price,
        f.flight_number,
        f.baggage,
        f.wifi,
        f.seats_available,
        a.name AS airline_name
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      ORDER BY f.departure_time ASC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// =========================================== AIRLINE ROUTES =======================================================

// GET flights for logged-in airline
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

// =========================================== CREATE ===============================================================

// POST new flight (airline only)
router.post("/new", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "airline") {
      return res.status(403).json({ error: true, message: "Only airlines can add flights" });
    }

    const {
      from_country,
      to_country,
      from_city,
      to_city,
      departure_time,
      arrival_time,
      price,
      flight_number,
      baggage,
      wifi,
      seats_available
    } = req.body;

    if (!from_country || !to_country || !from_city || !to_city || !departure_time || !arrival_time || !price || !flight_number || seats_available === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const insertResult = await pool.query(
      `INSERT INTO flights (
        airline_id,
        from_country,
        to_country,
        from_city,
        to_city,
        departure_time,
        arrival_time,
        price,
        flight_number,
        baggage,
        wifi,
        seats_available,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
      RETURNING *`,
      [
        req.user.id,
        from_country,
        to_country,
        from_city,
        to_city,
        new Date(departure_time),
        new Date(arrival_time),
        Number(price),
        flight_number,
        baggage ? Number(baggage) : 0,
        wifi === true,
        Number(seats_available)
      ]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});

// =========================================== UPDATE ===============================================================

// UPDATE flight (airline only)
router.put("/:flightId", verifyToken, checkFlightOwnership, async (req, res) => {
  try {
    const {
      from_country,
      to_country,
      from_city,
      to_city,
      departure_time,
      arrival_time,
      price,
      flight_number,
      baggage,
      wifi,
      seats_available
    } = req.body;

    const updated = await pool.query(
      `UPDATE flights SET 
        from_country = $1,
        to_country = $2,
        from_city = $3,
        to_city = $4,
        departure_time = $5,
        arrival_time = $6,
        price = $7,
        flight_number = $8,
        baggage = $9,
        wifi = $10,
        seats_available = $11
      WHERE id = $12 AND airline_id = $13
      RETURNING *`,
      [
        from_country,
        to_country,
        from_city,
        to_city,
        new Date(departure_time),
        new Date(arrival_time),
        Number(price),
        flight_number,
        baggage ? Number(baggage) : 0,
        wifi === true,
        Number(seats_available),
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

// =========================================== DELETE ===============================================================

router.delete("/:flightId", verifyToken, checkFlightOwnership, async (req, res) => {
  try {

    await pool.query(
      "DELETE FROM bookings WHERE flight_id = $1",
      [req.params.flightId]
    );


    await pool.query(
      "DELETE FROM flights WHERE id = $1 AND airline_id = $2",
      [req.params.flightId, req.user.id]
    );

    res.status(200).json({ message: "Flight and its bookings deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});


// =========================================== PUBLIC (LAST) =======================================================

// GET flight by ID (public users)
router.get("/:flightId", async (req, res) => {
  try {
    const { flightId } = req.params;

    const result = await pool.query(
      `SELECT 
        f.id,
        f.from_country,
        f.to_country,
        f.from_city,
        f.to_city,
        f.departure_time,
        f.arrival_time,
        f.price,
        f.flight_number,
        f.baggage,
        f.wifi,
        f.seats_available,
        a.name AS airline_name
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      WHERE f.id = $1`,
      [flightId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: "Flight not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
