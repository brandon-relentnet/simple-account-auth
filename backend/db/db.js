import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Create a new pool with the connection details
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for some hosted PostgreSQL providers
  },
});

// Test the connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to PostgreSQL successfully");
  }
});

// Setup database function to create tables if they don't exist
export const setupDatabase = async () => {
  try {
    // Create users table if it doesn't exist with new fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone_number VARCHAR(20),
        password VARCHAR(100) NOT NULL,
        reset_token VARCHAR(200),
        reset_token_expires TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create linked_accounts table if it doesn't exist
    await pool.query(`
        CREATE TABLE IF NOT EXISTS linked_accounts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            provider VARCHAR(50) NOT NULL,
            provider_user_id VARCHAR(100) NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            token_expires_at TIMESTAMP WITH TIME ZONE,
            account_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, provider)
        )
    `);

    console.log("Linked accounts table setup complete");

    // Create user_roles table if it doesn't exist
    await pool.query(`
  CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
  )
`);

    // Insert default roles if they don't exist
    const roleCheck = await pool.query("SELECT * FROM user_roles");
    if (roleCheck.rows.length === 0) {
      await pool.query(`
    INSERT INTO user_roles (name) VALUES 
    ('admin'),
    ('user')
  `);
      console.log("Default user roles created");
    }

    // Add role_id column to users table if it doesn't exist
    const userRoleColumnCheck = await pool.query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'users' AND column_name = 'role_id'
`);

    if (userRoleColumnCheck.rows.length === 0) {
      // Add role_id column with default value of 2 (user role)
      await pool.query(`
    ALTER TABLE users ADD COLUMN role_id INTEGER REFERENCES user_roles(id) DEFAULT 2
  `);
      console.log("Added role_id column to users table");
    }

    console.log("User roles setup complete");

    // Check if we need to add new columns to an existing table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND (column_name = 'username' OR column_name = 'phone_number' OR column_name = 'reset_token' OR column_name = 'reset_token_expires')
    `);

    // Add missing columns if the table already existed
    if (columnCheck.rows.length < 4) {
      const existingColumns = columnCheck.rows.map((row) => row.column_name);

      if (!existingColumns.includes("username")) {
        await pool.query(
          `ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE`
        );
        // Update existing users with a default username (using email)
        await pool.query(
          `UPDATE users SET username = SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) || id::text WHERE username IS NULL`
        );
        // Then make it required for future entries
        await pool.query(
          `ALTER TABLE users ALTER COLUMN username SET NOT NULL`
        );
      }

      if (!existingColumns.includes("phone_number")) {
        await pool.query(
          `ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)`
        );
      }

      if (!existingColumns.includes("reset_token")) {
        await pool.query(
          `ALTER TABLE users ADD COLUMN reset_token VARCHAR(200)`
        );
      }

      if (!existingColumns.includes("reset_token_expires")) {
        await pool.query(
          `ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE`
        );
      }
    }

    console.log("Database tables setup complete");
  } catch (err) {
    console.error("Error setting up database tables:", err);
  }
};

export default pool;
