// models/userModel.js
const pool = require("../config/db");

module.exports = {
  findById: async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  },
};
