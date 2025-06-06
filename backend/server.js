const express = require('express');
const cors = require('cors');
const pool = require('./database/db');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const multer = require('multer');

const app = express();

// Configure CORS properly
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's origin
  credentials: true
}));

// Middleware
app.use(express.json());

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes); // This is your upload endpoint

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

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