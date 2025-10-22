const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

const User = require("../models/companyModels");
const saltRounds = 12;

// ==================== Sign-Up  for companyies ====================

const pool = require('../config/db');

router.post('/sign-up-airlines', async (req, res) => {
  try {
    const { name, logo, email, phone, license, employee_username, password } = req.body;

    const result = await pool.query('SELECT * FROM airlines WHERE employee_username = $1', [employee_username]);
    if (result.rows.length > 0) {
      return res.status(409).json({ err: 'Employee username already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const newAirline = await pool.query(
      `INSERT INTO airlines (name, logo, email, phone, license, employee_username, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, employee_username`,
      [name, logo, email, phone, license, employee_username, hashedPassword]
    );

    const airline = newAirline.rows[0];
    const payload = { employee_username: airline.employee_username, _id: airline.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(201).json({ token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Invalid, please try again.' });
  }
});



// ==================== Sign-In ==================================================

router.post('/sign-in-airlines', async (req, res) => {
  try {
    const { employee_username, password } = req.body;

    const result = await pool.query('SELECT * FROM airlines WHERE employee_username = $1', [employee_username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    const airline = result.rows[0];

    const isPasswordCorrect = bcrypt.compareSync(password, airline.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ err: 'Invalid credentials.' });
    }

    const payload = { employee_username: airline.employee_username, _id: airline.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});



module.exports = router;
