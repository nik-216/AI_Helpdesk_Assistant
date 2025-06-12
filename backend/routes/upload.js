const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { PythonShell } = require('python-shell');

const { pool } = require('../database/db');
const authenticate = require('../middlewares/auth');
const { pipeline } = require('@xenova/transformers');

const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

const extractTextFromFile = async (filePath, originalName) => {
  if (!filePath || !originalName) {
    throw new Error('File path and original name are required');
  }

  const extension = path.extname(originalName).toLowerCase();
  
  try {
    if (extension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (extension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (extension === '.txt') {
      return fs.readFileSync(filePath, 'utf8');
    }
    throw new Error(`Unsupported file type: ${extension}`);
  } catch (err) {
    console.error(`Error processing ${originalName}:`, err);
    throw new Error(`Failed to process ${originalName}: ${err.message}`);
  }
};

async function scrapeText(url) {
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts'),
    args: [url]
  };
  
  const result = await PythonShell.run('scrape.py', options);
  return result[0];
}

async function extractRelevantText(text) {
  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: path.join(__dirname, '../python_scripts'),
    args: [text]
  };

  const result = await PythonShell.run('extract.py', options);
  return result[0];
}

function chunkText(text, maxWords = 100) {
  const words = text.split(/\s+/);
  return words.reduce((acc, word, i) => {
    const chunkIndex = Math.floor(i / maxWords);
    if (!acc[chunkIndex]) acc[chunkIndex] = [];
    acc[chunkIndex].push(word);
    return acc;
  }, []).map(chunk => chunk.join(' '));
}

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

async function storeEmbeddings(userId, source, chunks, embeddings, chatbotId) {
  const client = await pool.connect(); // Use the imported pool
  try {
    for (const { chunk, embedding } of embeddings) {
      await client.query(
        `INSERT INTO knowledge_embeddings (user_id, chat_bot_id, source, chunk, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, chatbotId, source, chunk, JSON.stringify(embedding)]
      );
    }
  } catch (err) {
    console.error('Error storing embeddings:', err);
    throw err; // Re-throw to handle in the route handler
  } finally {
    client.release();
  }
}

// Process file upload
router.post('/file', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { chatbotId } = req.body;
    console.log('Authenticated user:', req.user); // Debug log

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromFile(req.file.path, req.file.originalname);
    const relevantText = await extractRelevantText(text);
    const chunks = chunkText(relevantText);
    const embeddings = await generateEmbeddings(chunks);
    await storeEmbeddings(req.user.user_id, req.file.originalname, chunks, embeddings, chatbotId);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      chunks: chunks.length,
      source: req.file.originalname
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlinkSync(req.file.path);
    }
    console.error('File processing error:', error);
    res.status(500).json({ error: error.message || 'File processing failed' });
  }
});

// Process URL
router.post('/url', authenticate, async (req, res) => {
  try {
    // console.log('Database pool:', pool); // Debug log
    
    const { url, chatbotId } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const text = await scrapeText(url);
    const relevantText = await extractRelevantText(text);
    const chunks = chunkText(relevantText);
    const embeddings = await generateEmbeddings(chunks);
    
    await storeEmbeddings(req.user.user_id, url, chunks, embeddings, chatbotId);
    
    res.json({ success: true, chunks: chunks.length });
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: error.detail // For PostgreSQL errors
    });
  }
});

module.exports = router;