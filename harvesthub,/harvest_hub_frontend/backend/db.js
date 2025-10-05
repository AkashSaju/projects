// db.js
const mysql = require("mysql2"); // no /promise here
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",          // your MySQL password
  database: "harvesthub"
});

// test connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ MySQL Connected!");
    connection.release();
  }
});

module.exports = db;
