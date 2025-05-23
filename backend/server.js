// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import linkedAccountsRoutes from "./routes/linkedAccounts.js";
import adminRoutes from "./routes/admin.js";
import { setupDatabase } from "./db/db.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and create tables if they don't exist
setupDatabase();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/linked-accounts", linkedAccountsRoutes);
app.use("/api/admin", adminRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Auth API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
