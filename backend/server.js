const express = require('express');
const cors = require('cors');
const { pool } = require('./database/db'); // This should be the pool instance
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const multer = require('multer');

// console.log('Pool object:', pool);

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect(); // Now using the exported pool
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_embeddings (
        kb_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        url TEXT,
        chunk TEXT,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        company VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

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