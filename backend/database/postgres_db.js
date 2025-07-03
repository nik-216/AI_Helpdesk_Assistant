const { Pool } = require('pg');
require('dotenv').config();

// Create a single connection pool instance
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test the connection immediately
pool.connect()
  .then(client => {
    console.log('✅ Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1); 
  });

// Export the pool directly
module.exports = {
  pool,  
  query: (text, params) => pool.query(text, params),
};