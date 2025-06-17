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

// delete chatbot
router.delete('/delete/:chatbotId', authenticateToken, async(req, res)=>{
  try {
    const { chatbotId } = req.params
    const { user_id } = req.user

    await pool.query(
      'DELETE FROM chat_bots WHERE chat_bot_id = $1 AND user_id = $2',
      [chatbotId, user_id]
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chatbot' });
  }
});

// Get chats for a specific chatbot
router.get('/:chatbotId/chats', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'SELECT chat_id, created_at FROM chats WHERE chat_bot_id = $1 ORDER BY created_at DESC',
      [chatbotId]
    );

    // Return empty array instead of 404 when no chats exist
    const chats = result.rows;
    
    for (let i = 0; i < chats.length; i++) {
      const chatId = chats[i].chat_id;
      const chatHistory = await pool.query(
        'SELECT role, content, created_at FROM chat_history WHERE chat_id = $1 ORDER BY created_at ASC',
        [chatId]
      );
      chats[i].history = chatHistory.rows;
    }
    
    res.json(chats); // Will return [] if no chats exist
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get knowledge items for a specific chatbot
router.get('/:chatbotId/knowledge', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      'SELECT file_id, source FROM uploaded_data WHERE chat_bot_id = $1',
      [chatbotId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch knowledge items' });
  }
});

// Delete knowledge items for a specific chatbot
router.delete('/:chatbotId/knowledge/delete', authenticateToken, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { file_id } = req.body;
    const result = await pool.query(
      'DELETE FROM uploaded_data WHERE chat_bot_id = $1 AND file_id = $2 RETURNING *',
      [chatbotId, file_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete knowledge items' });
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

// Get chatbot settings
router.get('/:chatbotId/settings', async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const result = await pool.query(
      `SELECT persistent, api_key, llm_model, specifications, temperature
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
    const { persistent, api_key, llm_model, specifications, temperature } = req.body;

    await pool.query(
      `UPDATE chat_bots 
       SET persistent = $1, api_key = $2, llm_model = $3, 
           specifications = $4,
           temperature = $5
       WHERE chat_bot_id = $6`,
      [persistent, api_key, llm_model, specifications, temperature, chatbotId]
    );
    
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;