const express = require("express");
const router = express.Router();
const db = require("../db"); // make sure db.js exports the mysql connection
const bcrypt = require("bcryptjs");

// ---------------------
// REGISTER API
// ---------------------
router.post("/register", async (req, res) => {
  const {
    userType,
    fullName,
    email,
    contact,
    pincode,
    location,
    dob,
    password,
    farmName,
    farmLocation,
    farmDescription
  } = req.body;

  // Validate required fields
  if (!userType || !fullName || !email || !contact || !pincode || !dob || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const [existing] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const sql = `
      INSERT INTO users 
      (userType, fullName, email, contact, pincode, location, dob, password, farmName, farmLocation, farmDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.promise().query(sql, [
      userType,
      fullName,
      email,
      contact,
      pincode,
      location,
      dob,
      hashedPassword,
      farmName || null,
      farmLocation || null,
      farmDescription || null
    ]);

    res.status(201).json({ message: "Registration successful!" });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// LOGIN API
// ---------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Return user data (without password)
    res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        userType: user.userType,
        fullName: user.fullName,
        email: user.email,
        contact: user.contact,
        location: user.location
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// GET ALL USERS (Optional)
// ---------------------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT id, userType, fullName, email, contact, location FROM users");
    res.json(rows);
  } catch (err) {
    console.error("Get Users Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// GET USER PROFILE
// ---------------------
router.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT id, userType, fullName, email, contact, pincode, location, dob, farmName, farmLocation, farmDescription, createdAt FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// UPDATE USER PROFILE
// ---------------------
router.put("/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { fullName, contact, pincode, location, dob, farmName, farmLocation, farmDescription } = req.body;

  try {
    const sql = `
      UPDATE users 
      SET fullName = ?, contact = ?, pincode = ?, location = ?, dob = ?, farmName = ?, farmLocation = ?, farmDescription = ?
      WHERE id = ?
    `;
    const [result] = await db.promise().query(sql, [
      fullName,
      contact,
      pincode,
      location,
      dob,
      farmName,
      farmLocation,
      farmDescription,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ---------------------
// DELETE USER (Optional)
// ---------------------
router.delete("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ error: "Database error" });
  }


// ---------------------
// ADMIN DASHBOARD ANALYTICS
// ---------------------
router.get("/analytics/summary", async (req, res) => {
  try {
    const [totalUsers] = await db.promise().query("SELECT COUNT(*) AS totalUsers FROM users");
    const [usersByType] = await db.promise().query(`
      SELECT userType, COUNT(*) AS count 
      FROM users 
      GROUP BY userType
    `);
    const [recentUsers] = await db.promise().query(`
      SELECT id, fullName, email, userType, createdAt 
      FROM users 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);

    res.json({
      totalUsers: totalUsers[0].totalUsers,
      usersByType,
      recentUsers
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

});
module.exports = router;
