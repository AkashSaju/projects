const express = require('express');
const router = express.Router();
const db = require('../db');

// GET farmer by ID
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = `
        SELECT id, fullName, email, contact, location, farmName, farmLocation, farmDescription
        FROM users 
        WHERE id = ? AND userType = 'farmer'
    `;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "Farmer not found" });
        res.json(result[0]);
    });
});

module.exports = router;
