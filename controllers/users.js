const express = require("express");
const router = express.Router();
const pool = require("../config/db"); 
const { authenticateToken } = require('../middleware/verify-token');


router.use(authenticateToken);


router.get("/currentUser", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, photo, role FROM users WHERE id = $1",
      [req.user._id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ err: "User not found." });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    if (parseInt(req.user._id) !== parseInt(req.params.userId)) {
      return res.status(403).json({ err: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT id, username, email, photo, role FROM users WHERE id = $1",
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ err: "User not found." });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


// ----------------------------------------------------------------------------------------- 
// http://localhost:3000 /api/users

// router.get("/", async (req, res) => {
//   try {
//     const result = await pool.query(
//       'SELECT id, username, role FROM users'
//     );

//     res.json({ users: result.rows });
//   } catch (err) {
//     res.status(500).json({ err: err.message });
//   }
// });

// ----------------------------------------------------------------------------------------- 

module.exports = router;
