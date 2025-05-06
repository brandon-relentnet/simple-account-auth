// backend/routes/linkedAccounts.js
import express from "express";
import pool from "../db/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all linked accounts for the current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const linkedAccounts = await pool.query(
      "SELECT id, provider, provider_user_id, account_data, created_at FROM linked_accounts WHERE user_id = $1",
      [userId]
    );

    res.json(linkedAccounts.rows);
  } catch (err) {
    console.error("Error fetching linked accounts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mock endpoint to simulate initiating OAuth connection with a provider
router.post("/connect/:provider", authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;

    // In a real implementation, this would redirect to the provider's OAuth page
    // For our example, we'll just return the info needed for the next step

    res.json({
      success: true,
      message: `OAuth flow initiated for ${provider}`,
      // This would normally include a state parameter for security
      authUrl: `/mock-oauth/${provider}?state=abc123`,
    });
  } catch (err) {
    console.error(`Error initiating ${req.params.provider} connection:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mock endpoint to simulate OAuth callback
router.post("/callback/:provider", authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;
    const { code, mockUserData } = req.body;

    // In a real implementation, we would:
    // 1. Exchange the code for access and refresh tokens
    // 2. Use the tokens to fetch the user profile from the provider
    // 3. Store the tokens and user data in our database

    // For our example, we'll simulate this with mock data
    const providerUserId =
      mockUserData?.id || `mock-${provider}-user-${Date.now()}`;
    const accountData = mockUserData || {
      username: `${provider}User${Math.floor(Math.random() * 1000)}`,
      email: `mock-${provider}-user@example.com`,
      avatar: null,
    };

    // Check if this provider is already linked to this user
    const existingAccount = await pool.query(
      "SELECT id FROM linked_accounts WHERE user_id = $1 AND provider = $2",
      [userId, provider]
    );

    if (existingAccount.rows.length > 0) {
      // Update existing linked account
      await pool.query(
        `UPDATE linked_accounts 
         SET provider_user_id = $1, access_token = $2, refresh_token = $3, 
             token_expires_at = $4, account_data = $5
         WHERE user_id = $6 AND provider = $7`,
        [
          providerUserId,
          "mock-access-token",
          "mock-refresh-token",
          new Date(Date.now() + 3600000), // expires in 1 hour
          JSON.stringify(accountData),
          userId,
          provider,
        ]
      );
    } else {
      // Insert new linked account
      await pool.query(
        `INSERT INTO linked_accounts 
         (user_id, provider, provider_user_id, access_token, refresh_token, 
          token_expires_at, account_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          provider,
          providerUserId,
          "mock-access-token",
          "mock-refresh-token",
          new Date(Date.now() + 3600000), // expires in 1 hour
          JSON.stringify(accountData),
        ]
      );
    }

    res.json({
      success: true,
      message: `Successfully linked ${provider} account`,
      provider,
      accountData,
    });
  } catch (err) {
    console.error(`Error completing ${req.params.provider} connection:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a linked account
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Make sure the linked account belongs to the current user
    const result = await pool.query(
      "DELETE FROM linked_accounts WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Linked account not found" });
    }

    res.json({ success: true, message: "Linked account removed" });
  } catch (err) {
    console.error("Error removing linked account:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mock endpoint to simulate fetching data from a linked account
router.get("/data/:provider", authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params;
    const userId = req.user.id;

    // Check if the provider is linked to this user
    const linkedAccount = await pool.query(
      "SELECT provider_user_id, access_token, account_data FROM linked_accounts WHERE user_id = $1 AND provider = $2",
      [userId, provider]
    );

    if (linkedAccount.rows.length === 0) {
      return res
        .status(404)
        .json({ message: `No linked ${provider} account found` });
    }

    // In a real implementation, we would use the access token to fetch data from the provider's API
    // For our example, we'll return mock data

    let mockData;
    if (provider === "yahoo") {
      mockData = {
        teams: [
          { name: "Fantasy Team 1", league: "Fantasy Football", rank: 3 },
          { name: "Fantasy Team 2", league: "Fantasy Basketball", rank: 1 },
        ],
        stats: {
          wins: 10,
          losses: 4,
          draws: 0,
        },
      };
    } else if (provider === "twitter") {
      mockData = {
        tweets: 253,
        followers: 1204,
        following: 567,
        recent_tweets: [
          { text: "Just posted a new blog article!", likes: 12 },
          { text: "Having fun with the new API!", likes: 5 },
        ],
      };
    } else {
      mockData = {
        message: `Mock data for ${provider}`,
        timestamp: new Date().toISOString(),
      };
    }

    res.json({
      success: true,
      provider,
      accountInfo: linkedAccount.rows[0].account_data,
      data: mockData,
    });
  } catch (err) {
    console.error(`Error fetching ${req.params.provider} data:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
