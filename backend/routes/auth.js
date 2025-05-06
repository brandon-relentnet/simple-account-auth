import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, username, phone_number } = req.body;

    // Check if user already exists by email
    const userExistsByEmail = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExistsByEmail.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Check if username already exists
    const userExistsByUsername = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (userExistsByUsername.rows.length > 0) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Validate username (alphanumeric with underscores)
    if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message: "Username must contain only letters, numbers, and underscores",
      });
    }

    // Validate phone number if provided (optional)
    if (
      phone_number &&
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
        phone_number
      )
    ) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, username, phone_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, username, phone_number",
      [name, email, hashedPassword, username, phone_number || null]
    );

    // Generate JWT token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email,
        username: newUser.rows[0].username,
        phone_number: newUser.rows[0].phone_number,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    // Check if user exists by email or username
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [login]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        username: user.rows[0].username,
        phone_number: user.rows[0].phone_number,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, username, phone_number FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, username, phone_number } = req.body;
    const userId = req.user.id;

    // Check if email is already in use by another user
    if (email) {
      const emailCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Check if username is already in use by another user
    if (username) {
      const usernameCheck = await pool.query(
        "SELECT * FROM users WHERE username = $1 AND id != $2",
        [username, userId]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Validate username format
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message: "Username must contain only letters, numbers, and underscores",
      });
    }

    // Validate phone number format
    if (
      phone_number &&
      !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(
        phone_number
      )
    ) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Update user
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (name) {
      updateFields.push(`name = $${valueIndex}`);
      values.push(name);
      valueIndex++;
    }

    if (email) {
      updateFields.push(`email = $${valueIndex}`);
      values.push(email);
      valueIndex++;
    }

    if (username) {
      updateFields.push(`username = $${valueIndex}`);
      values.push(username);
      valueIndex++;
    }

    if (phone_number !== undefined) {
      updateFields.push(`phone_number = $${valueIndex}`);
      values.push(phone_number || null); // Allow setting to null
      valueIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${updateFields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING id, name, email, username, phone_number
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user's current password
    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      req.user.id,
    ]);

    // Verify current password
    const isMatch = await bcrypt.compare(
      currentPassword,
      user.rows[0].password
    );
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      req.user.id,
    ]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user account
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    // Get user's current password for verification
    const user = await pool.query("SELECT password FROM users WHERE id = $1", [
      userId,
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password before allowing deletion
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    // Delete the user (linked accounts will be deleted automatically due to CASCADE)
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ message: "Account successfully deleted" });
  } catch (err) {
    console.error("Error deleting account:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      // Don't reveal that email doesn't exist for security reasons
      return res.json({
        message:
          "If your email is registered, you will receive a password reset link",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3",
      [resetToken, resetTokenExpires, email]
    );

    // In a real application, send an email with the reset link
    // For this example, we'll just return the token
    // You would use a service like SendGrid, Mailgun, etc.

    // IMPORTANT: In a real app, never return the token directly like this!
    // This is just for demonstration purposes
    res.json({
      message:
        "If your email is registered, you will receive a password reset link",
      resetToken, // Only for demo purposes - in real app, send via email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password with token
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid token
    const user = await pool.query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: "Password has been reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
