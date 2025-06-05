const express = require('express');
const cors = require('cors');
const pool = require('./database/db'); // Import the pool directly
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

const app = express();

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect(); // Use the imported pool directly
  try {
    // Create extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    
    // Create tables if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS web_embeddings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        url TEXT,
        chunk TEXT,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();