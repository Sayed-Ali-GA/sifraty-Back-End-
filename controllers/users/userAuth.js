const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require("../../models/userModel");
const saltRounds = 12;

// ==================== Sign-Up ====================
const pool = require('../../config/db'); // PostgreSQL pool

router.post('/sign-up', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (result.rows.length > 0) {
      return res.status(409).json({ err: 'Username already exists.' });
    }

   const hashedPassword = bcrypt.hashSync(password, saltRounds);
const newUser = await pool.query(
  'INSERT INTO users (username, hashed_password) VALUES ($1, $2) RETURNING id, username',
  [username, hashedPassword]
);

const user = newUser.rows[0];
const payload = { username: user.username, _id: user.id };
const token = jwt.sign(payload, process.env.JWT_SECRET);
res.status(201).json({ token });

  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Invalid, please try again.' });
  }
});


// ==================== Sign-In ====================
router.post('/sign-in', async (req, res) => {
  try {
    const { username, password } = req.body;

    // PostgreSQL
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    // Check psssword
    const isPasswordCorrect = bcrypt.compareSync(password, user.hashed_password);
    if (!isPasswordCorrect) return res.status(401).json({ err: 'Invalid credentials.' });

    const payload = { username: user.username, _id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});


module.exports = router;
