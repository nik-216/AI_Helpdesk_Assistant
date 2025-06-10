// routes/chatbots.js
const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const authenticateToken = require('../middlewares/auth');
const { generateUniqueApiKey } = require('../utils/apiKeyGenerator');

// Get all chatbots for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id; // Assuming you have authentication middleware
    const result = await pool.query(
      'SELECT * FROM chat_bots WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chatbots' });
  }
});

// Create a new chatbot
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.user_id;
    const api_key = await generateUniqueApiKey();
    
    const result = await pool.query(
      'INSERT INTO chat_bots (user_id, name, api_key) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, api_key]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chatbot' });
  }
});

// Get a specific chatbot
router.get('/:chatbotId', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chat_bots WHERE chat_bot_id = $1',
      [chatbotId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chatbot' });
  }
});

// Get chats for a specific chatbot
router.get('/:chatbotId/chats', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chats WHERE chat_bot_id = $1 ORDER BY created_at DESC',
      [chatbotId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create a new chat for a chatbot
router.post('/:chatbotId/chats', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'INSERT INTO chats (chat_bot_id) VALUES ($1) RETURNING *',
      [chatbotId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get knowledge items for a specific chatbot
router.get('/:chatbotId/knowledge', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'SELECT * FROM knowledge_embeddings WHERE chat_bot_id = $1 ORDER BY created_at DESC',
      [chatbotId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch knowledge items' });
  }
});

// Get chat history for a specific chat
router.get('/:chatbotId/chats/:chatId/history', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chat_history WHERE chat_id = $1 ORDER BY created_at ASC',
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Add message to chat history
router.post('/:chatbotId/chats/:chatId/history', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, response } = req.body;
    
    const result = await pool.query(
      'INSERT INTO chat_history (chat_id, message, response) VALUES ($1, $2, $3) RETURNING *',
      [chatId, message, response]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add chat history' });
  }
});

// Get chatbot settings
router.get('/:chatbotId/settings', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      `SELECT persistent, api_key, llm_model 
       FROM chat_bots 
       WHERE chat_bot_id = $1`,
      [chatbotId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update chatbot settings
router.put('/:chatbotId/settings', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { persistent, api_key, llm_model } = req.body;
    
    await pool.query(
      `UPDATE chat_bots 
       SET persistent = $1, api_key = $2, llm_model = $3
       WHERE chat_bot_id = $4`,
      [persistent, api_key, llm_model, chatbotId]
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;