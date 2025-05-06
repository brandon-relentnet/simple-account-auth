// backend/routes/admin.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../db/db.js";
import { authenticateToken, authenticateAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(authenticateAdmin);

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone_number, u.created_at, r.name as role
       FROM users u
       JOIN user_roles r ON u.role_id = r.id
       ORDER BY u.id`
    );

    res.json(users.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user by ID (with linked accounts)
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const userResult = await pool.query(
      `SELECT u.id, u.username, u.name, u.email, u.phone_number, u.created_at, r.name as role
       FROM users u
       JOIN user_roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Get user's linked accounts
    const linkedAccountsResult = await pool.query(
      `SELECT id, provider, provider_user_id, account_data, created_at
       FROM linked_accounts
       WHERE user_id = $1`,
      [id]
    );

    res.json({
      ...user,
      linked_accounts: linkedAccountsResult.rows,
    });
  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user (admin can change role)
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, username, phone_number, role_id } = req.body;

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate role_id if provided
    if (role_id) {
      const roleExists = await pool.query(
        "SELECT * FROM user_roles WHERE id = $1",
        [role_id]
      );
      if (roleExists.rows.length === 0) {
        return res.status(400).json({ message: "Invalid role" });
      }
    }

    // Check if email is already in use by another user
    if (email) {
      const emailCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    // Check if username is already in use by another user
    if (username) {
      const usernameCheck = await pool.query(
        "SELECT * FROM users WHERE username = $1 AND id != $2",
        [username, id]
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({ message: "Username is already taken" });
      }
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
      values.push(phone_number || null);
      valueIndex++;
    }

    if (role_id) {
      updateFields.push(`role_id = $${valueIndex}`);
      values.push(role_id);
      valueIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${updateFields.join(", ")}
      WHERE id = $${valueIndex}
      RETURNING id, name, email, username, phone_number
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating user ${req.params.id}:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Reset user password (admin function)
router.put("/users/:id/reset-password", async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const userExists = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
      hashedPassword,
      id,
    ]);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(`Error resetting password for user ${req.params.id}:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if trying to delete an admin
    const userCheck = await pool.query(
      "SELECT role_id FROM users WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion of an admin by another admin
    if (userCheck.rows[0].role_id === 1) {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    // Delete the user (linked accounts will be deleted automatically due to CASCADE)
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(`Error deleting user ${req.params.id}:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new admin user (for bootstrapping)
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password, username, phone_number } = req.body;

    // Validate required fields
    if (!name || !email || !password || !username) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new admin user
    const newAdmin = await pool.query(
      "INSERT INTO users (name, email, password, username, phone_number, role_id) VALUES ($1, $2, $3, $4, $5, 1) RETURNING id, name, email, username, phone_number",
      [name, email, hashedPassword, username, phone_number || null]
    );

    res.status(201).json({
      message: "Admin created successfully",
      user: newAdmin.rows[0],
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
