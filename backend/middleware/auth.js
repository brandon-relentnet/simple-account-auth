import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN format

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: "Token is not valid" });
  }
};

export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header (assumes authenticateToken has already run)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user is an admin
    const pool = (await import("../db/db.js")).default;
    const adminCheck = await pool.query(
      "SELECT role_id FROM users WHERE id = $1",
      [req.user.id]
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (adminCheck.rows[0].role_id !== 1) {
      // 1 is the admin role_id
      return res
        .status(403)
        .json({ message: "Access denied. Admin rights required." });
    }

    next();
  } catch (err) {
    console.error("Admin authentication error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
