const { Pool } = require('pg');
require('dotenv').config();

// Create a single connection pool instance
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ai_assistant',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Test the connection immediately
pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); // Exit if we can't connect to DB
  });

// Export the pool directly
module.exports = pool;