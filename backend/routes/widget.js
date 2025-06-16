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
    // Lazy load the model
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

// async function generateEmbeddings(chunks) {
//   const options = {
//     mode: 'text',
//     pythonOptions: ['-u'],
//     scriptPath: path.join(__dirname, '../python_scripts'),
//     args: [chunks]
//   };
  
//   const result = await PythonShell.run('generateEmbeddings.py', options);
//   return result[0];
// }

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
async function getReply(model, messages, similarText, specifications, temperature) {
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts/LLM'),
    args: [model, JSON.stringify(messages), JSON.stringify(similarText), specifications, temperature]
  };

  const result = await PythonShell.run('getReply.py', options);
  return result[0];
}

// Store conversation history
router.post('/chat', authenticateWidget, async (req, res) => {
  try {
    const { messages, ip } = req.body;
    if (!messages || !ip) {
      return res.status(400).json({ error: 'Message and IP are required' });
    }

    await pool.query(
      `INSERT INTO chat_history 
       (chat_id, role, content)
       VALUES ($1, $2, $3)`,
      [req.chatBot.chat_id, 'user', messages[messages.length - 1].content]
    );

    const result = await pool.query(
      'SELECT specifications, temperature FROM chat_bots WHERE chat_bot_id = $1',
      [req.chatBot.chatBot_id]
    );

    const similarText = await searchSimilar(messages[messages.length - 1].content);
    console.log('Similar items found:', similarText);
    console.log('Length of similar items:', similarText.length);

    const reply = await getReply(req.chatBot.llm_model, messages, similarText, result.rows[0].specifications, result.rows[0].temperature);

    console.log('LLM reply:', reply);

    // const reply = "This is a sample response. Implement your AI logic here.";

    messages.push({ role: 'assistant', content: reply });
    
    await pool.query(
      `INSERT INTO chat_history 
       (chat_id, role, content)
       VALUES ($1, $2, $3)`,
      [req.chatBot.chat_id, 'assistant', reply]
    );

    res.json({ reply: reply, messages: [...messages, { role: 'assistant', content: reply }] });
  } catch (err) {
    console.error('Widget chat error:', err);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Load the chat history for the widget
router.post('/history', authenticateWidget, async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
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

module.exports = router;