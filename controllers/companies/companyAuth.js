const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const pool = require('../../config/db');
const { authenticateToken } = require("../../middleware/verify-token");


const saltRounds = 12;

// ================================================= Sign-Up for Airlines ======================================================
router.post('/sign-up-airlines', async (req, res) => {
  try {
    const { name, logo, email, phone, license, employee_username, password } = req.body;

 
    const existing = await pool.query(
      'SELECT * FROM airlines WHERE employee_username = $1',
      [employee_username]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ err: 'Employee username already exists.' });

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const newAirline = await pool.query(
      `INSERT INTO airlines (name, logo, email, phone, license, employee_username, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, employee_username, name, email, phone, license, logo`,
      [name, logo, email, phone, license, employee_username, hashedPassword]
    );

    const airline = newAirline.rows[0];


    const payload = {
      id: airline.id,
      employee_username: airline.employee_username,
      name: airline.name,
      email: airline.email,
      phone: airline.phone,
      license: airline.license,
      logo: airline.logo,
      role: 'airline'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(201).json({ token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ err: 'Invalid, please try again.' });
  }
});
  
// ================================================ Update Airline Profile ==============================================================
router.put('/airlines/profile', authenticateToken, async (req, res) => {
  try {
    const airlineId = req.user.id; 
    const { name, email, phone, license, logo } = req.body;

    const updated = await pool.query(
      `UPDATE airlines
       SET name = $1,
           email = $2,
           phone = $3,
           license = $4,
           logo = $5
       WHERE id = $6
       RETURNING id, name, email, phone, license, logo, employee_username`,
      [name, email, phone, license, logo, airlineId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ err: 'Airline not found' });
    }

    res.status(200).json(updated.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});


// ==================================================== Sign-In for Airlines ==========================================================
router.post('/sign-in-airlines', async (req, res) => {
  try {
    const { employee_username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM airlines WHERE employee_username = $1',
      [employee_username]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ err: 'Invalid credentials.' });

    const airline = result.rows[0];

    const isPasswordCorrect = bcrypt.compareSync(password, airline.password);
    if (!isPasswordCorrect)
      return res.status(401).json({ err: 'Invalid credentials.' });


    const payload = {
      id: airline.id,
      employee_username: airline.employee_username,
      name: airline.name,
      email: airline.email,
      phone: airline.phone,
      license: airline.license,
      logo: airline.logo,
      role: 'airline'
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
