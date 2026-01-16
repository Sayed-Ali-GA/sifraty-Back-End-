const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../../config/db");

const saltRounds = 12;

// ==================== Sign-Up ====================
router.post("/sign-up-user", async (req, res) => {
  try {
    const { username, password, role = "user" } = req.body;

    const exists = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ err: "Username already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (username, hashed_password, role)
       VALUES ($1, $2, $3)
       RETURNING id, username, role`,
      [username, hashedPassword, role]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// ==================== Sign-In ====================
router.post("/sign-in-user", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ err: "Invalid credentials." });
    }

    const user = result.rows[0];

    const match = bcrypt.compareSync(password, user.hashed_password);
    if (!match) {
      return res.status(401).json({ err: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.put("/profile",  async (req, res) => {
  try {
    const { username, email, photo } = req.body;
    const result = await pool.query(
      `UPDATE users SET username=$1, email=$2, photo=$3 WHERE id=$4 RETURNING id, username, email, photo, role`,
      [username, email, photo, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});


module.exports = router;
