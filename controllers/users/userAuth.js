const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const upload  = require("../../config/multer")
const cloudinary = require("../../config/cloudinary")
const { authenticateToken } = require("../../middleware/verify-token");
const pool = require("../../config/db");

const saltRounds = 12;

// ==================== Sign-Up ====================
router.post("/sign-up-user", upload.single("photo"), async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ err: "Username and password are required." });
    }

  
    let photoUrl = null;
    let photoPublicId = null;
    if (req.file) {
      photoUrl = req.file.path;       
      photoPublicId = req.file.filename;
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE username=$1",
      [username]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ err: "Username already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (username, hashed_password, email, photo, photo_public_id, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, role, photo`,
      [username, hashedPassword, email, photoUrl, photoPublicId, "user"]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
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


router.put("/profile-photo", authenticateToken, upload.single("photo"),async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ err: "No file uploaded" });
      }


      const updated = await pool.query(
        `UPDATE users
         SET photo=$1, photo_public_id=$2
         WHERE id=$3
         RETURNING id, username, photo`,
        [req.file.path, req.file.filename, req.user.id]
      );

      res.json(updated.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ err: "Upload failed" });
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await pool.query(
      "SELECT photo_public_id FROM users WHERE id = $1",
     [id]
  );
    const publicId = user.rows[0].photo_public_id;



    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});



module.exports = router;
