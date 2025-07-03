const { and } = require('sequelize');
const { pool } = require('../database/postgres_db');

module.exports = async function authenticateWidget(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1];
  const ip = req.body.ip;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    // Check if API key exists in chat_bots table
    const result = await pool.query(
      'SELECT chat_bot_id, persistent, llm_model FROM chat_bots WHERE api_key = $1 LIMIT 1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    var getChat_ID = await pool.query(
      'SELECT chat_id FROM chats WHERE chat_bot_id = $1 AND ip_address = $2 ORDER BY created_at DESC LIMIT 1',
      [result.rows[0].chat_bot_id, ip]
    );

    if ((getChat_ID.rows.length === 0) || (!result.rows[0].persistent)) {
      req.chatBot = {
      chatBot_id: result.rows[0].chat_bot_id,
      persistent: result.rows[0].persistent,
      llm_model: result.rows[0].llm_model
      };
      next();
    }
    else {
      req.chatBot = {
        chatBot_id: result.rows[0].chat_bot_id,
        persistent: result.rows[0].persistent,
        llm_model: result.rows[0].llm_model,
        chat_id: getChat_ID.rows[0].chat_id
      };

      next();
    }
  } catch (err) {
    console.error('Widget auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};