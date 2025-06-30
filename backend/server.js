const express = require('express');
const cors = require('cors');
const { pool } = require('./database/postgres_db');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const chatbotRoutes = require('./routes/chatbots'); 
const widgetRoutes = require('./routes/widget');
const multer = require('multer');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3003',
  'https://yourproductiondomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbots', chatbotRoutes); 
app.use('/api/widget', widgetRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database initialization
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create vector extension if not exists
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');

    // Create tables in the correct order to handle foreign key dependencies
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_bots (
        chat_bot_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name VARCHAR(100),
        persistent BOOLEAN DEFAULT FALSE,
        api_key char(10) UNIQUE,
        llm_model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
        specifications TEXT DEFAULT '',
        rejection_msg TEXT DEFAULT '',
        temperature FLOAT DEFAULT 0.7,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        chat_id SERIAL PRIMARY KEY,
        chat_bot_id INTEGER,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_bot_id) REFERENCES chat_bots(chat_bot_id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_data (
        file_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        chat_bot_id INTEGER,
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (chat_bot_id) REFERENCES chat_bots(chat_bot_id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_embeddings (
        kb_id SERIAL PRIMARY KEY,
        file_id INTEGER,
        chunk TEXT,
        embedding vector(384),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (file_id) REFERENCES uploaded_data(file_id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        chat_history_id SERIAL PRIMARY KEY,
        chat_id INTEGER,
        role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(chat_id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX 
      ON knowledge_embeddings 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
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