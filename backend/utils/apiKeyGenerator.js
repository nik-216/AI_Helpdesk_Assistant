// // utils/apiKeyGenerator.js
// const { pool } = require('../database/db');

// async function generateUniqueApiKey() {
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   let isUnique = false;
//   let apiKey;
  
//   while (!isUnique) {
//     // Generate 10-character key
//     apiKey = '';
//     for (let i = 0; i < 10; i++) {
//       apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
    
//     // Check if key exists in database
//     const result = await pool.query(
//       'SELECT 1 FROM chat_bots WHERE api_key = $1 LIMIT 1',
//       [apiKey]
//     );
    
//     // If no results found, the key is unique
//     if (result.rows.length === 0) {
//       isUnique = true;
//     }
    
//     // Add a safety check to prevent infinite loops
//     if (i > 100) { // After 100 attempts
//       throw new Error('Failed to generate unique API key after 100 attempts');
//     }
//   }
  
//   return apiKey;
// }

// module.exports = { generateUniqueApiKey };

const { v4: uuidv4 } = require('uuid');

// Generate a UUID and take first 10 chars
function generateUniqueApiKey() {
  return uuidv4().replace(/-/g, '').substring(0, 10);
}

module.exports = { generateUniqueApiKey };