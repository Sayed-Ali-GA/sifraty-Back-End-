const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const { authenticateToken } = require("../../middleware/verify-token");

router.use(authenticateToken);

// ==================== Current User ====================
router.get("/currentUser", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, photo, role FROM users WHERE id=$1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ err: "User not found." });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// ==================== Get User by ID ====================
router.get("/:userId", async (req, res) => {
  try {
    if (parseInt(req.user.id) !== parseInt(req.params.userId)) {
      return res.status(403).json({ err: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT id, username, email, photo, role FROM users WHERE id=$1",
      [req.params.userId]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
