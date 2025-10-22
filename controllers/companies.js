const express = require("express");
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/verify-token');

router.use(authenticateToken);

router.get("/currentAirline", async (req, res) => {
  try {
    const airlineId = req.user._id; 
    const result = await pool.query('SELECT * FROM airlines WHERE id = $1', [airlineId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ err: "Airline not found." });
    }

    res.json({ airline: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


router.get("/:airlineId", async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.airlineId) {
      return res.status(403).json({ err: "Unauthorized" });
    }

    const result = await pool.query('SELECT * FROM airlines WHERE id = $1', [req.params.airlineId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ err: "Airline not found." });
    }

    res.json({ airline: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
