const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../database/db');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { PythonShell } = require('python-shell');

const upload = multer({ dest: 'uploads/' });

// Process file upload
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromFile(req.file.path);
    const result = await processAndStoreContent(req.user.id, req.file.originalname, text);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      success: true, 
      chunks: result.chunks,
      source: req.file.originalname
    });
  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'File processing failed' });
  }
});

// Process URL
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const text = await scrapeText(url);
    const result = await processAndStoreContent(req.user.id, url, text);
    
    res.json({ 
      success: true,
      chunks: result.chunks,
      source: url
    });
  } catch (error) {
    console.error('URL processing error:', error);
    res.status(500).json({ error: 'URL processing failed' });
  }
});

// Helper functions
async function extractTextFromFile(filePath) {
  const fileType = path.extname(filePath).toLowerCase();

  if (fileType === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else if (fileType === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else if (fileType === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  }
  throw new Error('Unsupported file type');
}

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

async function processAndStoreContent(userId, source, text) {
  const chunks = chunkText(text);
  const embeddings = await generateEmbeddings(chunks);
  
  await storeEmbeddings(userId, source, chunks, embeddings);
  
  return { chunks: chunks.length };
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

async function generateEmbeddings(chunks) {
  // In production, call your embedding service here
  return chunks.map(chunk => ({
    chunk,
    embedding: Array(384).fill(0) // Placeholder
  }));
}

async function storeEmbeddings(userId, source, chunks, embeddings) {
  const client = await pool.connect();
  try {
    for (const { chunk, embedding } of embeddings) {
      await client.query(
        `INSERT INTO web_embeddings (user_id, url, chunk, embedding)
         VALUES ($1, $2, $3, $4)`,
        [userId, source, chunk, JSON.stringify(embedding)]
      );
    }
  } finally {
    client.release();
  }
}

module.exports = router;