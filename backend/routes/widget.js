// routes/widget.js
const express = require('express');
const router = express.Router();

const { pool } = require('../database/db');
const authenticateWidget = require('../middlewares/WidgetAuth');

const path = require('path');
const { PythonShell } = require('python-shell');
const { pipeline } = require('@xenova/transformers');

// Generate embeddings using HuggingFace Transformers
let embedder;
async function generateEmbeddings(chunks) {
  try {
    if (!embedder) {
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    
    const embeddings = await Promise.all(
      chunks.map(chunk => embedder(chunk, { pooling: 'mean', normalize: true }))
    );
    
    return chunks.map((chunk, index) => ({
      chunk,
      embedding: Array.from(embeddings[index].data)
    }));
  } catch (error) {
    console.error('HuggingFace embedding error:', error);
    throw new Error('Failed to generate embeddings');
  }
}

// Python script for searching similar embeddings
async function searchSimilar(query, top_k = 10) {
  const embedding = await generateEmbeddings([query]);
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts'),
    args: [JSON.stringify(embedding), top_k]
  };

  const result = await PythonShell.run('searchSimilar.py', options);
  return result;
}

// Python script to get reply from AI model
async function getReply(model, messages, similarText, specifications, rejection_msg, temperature) {
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts/LLM'),
    args: [model, JSON.stringify(messages), JSON.stringify(similarText), specifications, rejection_msg, temperature]
  };

  // const result = await PythonShell.run('getReplyOpenRouter.py', options);
  const result = await PythonShell.run('getReplyInterview.py', options);

  // console.log("Result: ", result)
  return result;
}

// Store conversation history
router.post('/chat', authenticateWidget, async (req, res) => {
  try {
    const { messages, ip } = req.body;
    const { chatBot_id, llm_model } = req.chatBot;
    let { chat_id } = req.chatBot;

    if (!messages || !ip) {
      return res.status(400).json({ error: 'Message and IP are required' });
    }

    if (!chat_id) {
      const getChat_ID= await pool.query(
        'INSERT INTO chats (chat_bot_id, ip_address) VALUES ($1, $2) RETURNING chat_id',
        [chatBot_id, ip]
      );

      chat_id = getChat_ID.rows[0].chat_id;
    }

    await pool.query(
      `INSERT INTO chat_history 
       (chat_id, role, content)
       VALUES ($1, $2, $3)`,
      [chat_id, 'user', messages[messages.length - 1].content]
    );

    const result = await pool.query(
      'SELECT specifications, rejection_msg, temperature FROM chat_bots WHERE chat_bot_id = $1',
      [chatBot_id]
    );

    const similarText = await searchSimilar(messages[messages.length - 1].content);
    // console.log('Similar items found:', similarText);
    // console.log('Length of similar items:', similarText.length);

    const replyResult = await getReply(llm_model, messages, similarText, result.rows[0].specifications, result.rows[0].rejection_msg, result.rows[0].temperature);

    const fullResponse = replyResult.join('\n');
    let reply;
    let related_questions = [];

    try {
      // console.log(fullResponse);
      // Remove Markdown code fences and parse JSON
      const jsonString = fullResponse.replace(/```json|```/g, '').trim();
      const responseObj = JSON.parse(jsonString);
      
      // Format the response for the widget
      reply = responseObj.answer;
      
      if (responseObj.related_questions && responseObj.related_questions.length > 0) {
        related_questions = responseObj.related_questions.map((q) => `${q}`);
      }
    } catch (err) {
      console.error('Failed to parse LLM response:', err);
      // Fallback to raw response if parsing fails
      reply = fullResponse.replace(/```json|```/g, '').trim();
    }

    messages.push({ role: 'assistant', content: reply });
    
    await pool.query(
      `INSERT INTO chat_history 
       (chat_id, role, content)
       VALUES ($1, $2, $3)`,
      [req.chatBot.chat_id, 'assistant', reply]
    );
    // console.log("Related question: ", related_questions)

    res.json({ 
      reply: reply, 
      messages: [...messages, 
        { role: 'assistant', content: reply }],
      related_questions: related_questions });
  } catch (err) {
    console.error('Widget chat error:', err);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Load the chat history for the widget
router.post('/history', authenticateWidget, async (req, res) => {
  try {
    const { ip } = req.body;
    const { chat_id } = req.chatBot;
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
    }

    if (!chat_id) {
      return res.json({ reply: '', messages: [] });
    }

    if (!req.chatBot.persistent) {
        return res.json({ reply: '', messages: [] });
    }

    const result = await pool.query(
      `SELECT role, content, created_at 
       FROM chat_history 
       WHERE chat_id = $1
       ORDER BY created_at ASC
       LIMIT 20`,
      [req.chatBot.chat_id]
    );

    if (result.rows.length === 0) {
      return res.json({ messages: [] });
    }

    res.json({ messages: result.rows });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Clear the chat history
router.delete('/clearChat', authenticateWidget, async (req, res) =>  {
  const { chat_id } = req.chatBot;
  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ error: 'IP is required' });
  }

  try {
    await pool.query(
      `DELETE FROM chat_history
      WHERE chat_id = $1;`,
      [chat_id]
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

module.exports = router;