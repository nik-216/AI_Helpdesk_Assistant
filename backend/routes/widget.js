// routes/widget.js
const express = require('express');
const router = express.Router();

const authenticateWidget = require('../middlewares/WidgetAuth');

const { searchSimilarChroma } = require('../services/searchSimilar');
const { getReply, parseLLMResponse } = require('../services/llmService');
const {
  createChat,
  saveMessage,
  getChatBotSettingsWidget,
  getChatHistory,
  clearChatHistory
} = require('../services/chatBotService');

const { cacheReply, getMostSimilarCachedReply } = require('../services/cacheService');

// Handle chat messages
router.post('/chat', authenticateWidget, async (req, res) => {
  try {
    const { messages, ip } = req.body;
    const { chatBot_id, llm_model, chat_id } = req.chatBot;

    if (!messages || !ip) {
      return res.status(400).json({ error: 'Message and IP are required' });
    }

    const currentChatId = chat_id || await createChat(chatBot_id, ip);
    const userMessage = messages[messages.length - 1].content;
    
    await saveMessage(currentChatId, 'user', userMessage);

    // Check cache for replies
    const cachedReply = await getMostSimilarCachedReply(chatBot_id, userMessage);
    // console.log('Cached reply:', cachedReply);
    if (cachedReply) {
      await saveMessage(currentChatId, 'assistant', cachedReply.response, cachedReply.related_questions);
      return res.json({
        reply: cachedReply.response,
        messages: [...messages, { role: 'assistant', content: cachedReply.response }],
        related_questions: cachedReply.related_questions
      });
    }

    const { specifications, rejection_msg, temperature } = await getChatBotSettingsWidget(chatBot_id);
    const similarText = await searchSimilarChroma(userMessage, chatBot_id);
    
    const replyResult = await getReply(
      llm_model, 
      messages, 
      similarText, 
      specifications, 
      rejection_msg, 
      temperature
    );

    const { reply, relatedQuestions } = parseLLMResponse(replyResult.join('\n'));
    await saveMessage(currentChatId, 'assistant', reply, relatedQuestions);

    // Cache the reply
    await cacheReply(userMessage, { reply: reply, related_questions: relatedQuestions }, chatBot_id);

    res.json({ 
      reply,
      messages: [...messages, { role: 'assistant', content: reply }],
      related_questions: relatedQuestions
    });

  } catch (err) {
    console.error('Widget chat error:', err);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Get chat history
router.post('/history', authenticateWidget, async (req, res) => {
  try {
    const { ip } = req.body;
    const { chat_id, persistent } = req.chatBot;

    if (!ip) return res.status(400).json({ error: 'IP is required' });
    if (!chat_id || !persistent) return res.json({ reply: '', messages: [] });

    const messages = await getChatHistory(chat_id);
    res.json({ messages });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Clear chat history
router.delete('/clearChat', authenticateWidget, async (req, res) => {
  try {
    const { ip } = req.body;
    const { chat_id } = req.chatBot;

    if (!ip) return res.status(400).json({ error: 'IP is required' });
    await clearChatHistory(chat_id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

module.exports = router;