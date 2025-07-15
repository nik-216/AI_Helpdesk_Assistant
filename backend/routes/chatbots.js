const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/auth');
const { generateUniqueApiKey } = require('../services/apiKeyGenerator');
const {
  getUserChatbots,
  createChatbot,
  getChatbotById,
  deleteChatbot,
  getChatbotChats,
  getChatHistoryWithDetails,
  getChatbotKnowledge,
  deleteKnowledgeItem,
  getChatbotSettings,
  updateChatbotSettings
} = require('../services/chatService');

// Get all chatbots for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chatbots = await getUserChatbots(req.user.user_id);
    res.json(chatbots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chatbots' });
  }
});

// Create a new chatbot
router.post('/addchatbot', authenticateToken, async (req, res) => {
  try {
    const api_key = await generateUniqueApiKey();
    const newChatbot = await createChatbot(req.user.user_id, req.body.name, api_key);
    res.status(201).json(newChatbot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create chatbot' });
  }
});

// Get a specific chatbot
router.get('/:chatbotId', authenticateToken, async (req, res) => {
  try {
    const chatbot = await getChatbotById(req.params.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    res.json(chatbot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chatbot' });
  }
});

// Delete chatbot
router.delete('/delete/:chatbotId', authenticateToken, async (req, res) => {
  try {
    await deleteChatbot(req.params.chatbotId, req.user.user_id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chatbot' });
  }
});

// Get chats for a specific chatbot
router.get('/:chatbotId/chats', authenticateToken, async (req, res) => {
  try {
    const chats = await getChatbotChats(req.params.chatbotId);
    
    for (let i = 0; i < chats.length; i++) {
      chats[i].history = await getChatHistoryWithDetails(chats[i].chat_id);
    }
    
    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get knowledge items for a specific chatbot
router.get('/:chatbotId/knowledge', authenticateToken, async (req, res) => {
  try {
    const knowledgeItems = await getChatbotKnowledge(req.params.chatbotId);
    res.json(knowledgeItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch knowledge items' });
  }
});

// Delete knowledge items for a specific chatbot
router.delete('/:chatbotId/knowledge/delete', authenticateToken, async (req, res) => {
  try {
    const deletedItems = await deleteKnowledgeItem(req.params.chatbotId, req.body.file_id);
    res.json(deletedItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete knowledge items' });
  }
});

// Get chat history for a specific chat
router.get('/:chatbotId/chats/:chatId/history', authenticateToken, async (req, res) => {
  try {
    const history = await getChatHistoryWithDetails(req.params.chatId);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get chatbot settings
router.get('/:chatbotId/settings', async (req, res) => {
  try {
    const settings = await getChatbotSettings(req.params.chatbotId);
    if (!settings) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update chatbot settings
router.put('/:chatbotId/settings/change', async (req, res) => {
  try {
    await updateChatbotSettings(req.params.chatbotId, req.body);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;