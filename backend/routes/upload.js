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

// Process file upload
router.post('/file', authenticate, upload.single('file'), async (req, res) => {
  try {
    console.log('Authenticated user:', req.user); // Debug log
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Now safely use req.user.id
    console.log('Processing file:', req.file.originalname); // Debug log
    console.log('File path:', req.file.path); // Debug log
    const text = await extractTextFromFile(req.file.path, req.file.originalname);
    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    await storeEmbeddings(req.user.id, req.file.originalname, chunks, embeddings);

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
    
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const text = await scrapeText(url);
    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    
    console.log('Before storeEmbeddings'); // Debug log
    await storeEmbeddings(req.user.id, url, chunks, embeddings);
    console.log('After storeEmbeddings'); // Debug log
    
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

// Helper functions
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

async function storeEmbeddings(userId, source, chunks, embeddings) {
  const client = await pool.connect(); // Use the imported pool
  try {
    for (const { chunk, embedding } of embeddings) {
      await client.query(
        `INSERT INTO web_embeddings (user_id, url, chunk, embedding)
         VALUES ($1, $2, $3, $4)`,
        [userId, source, chunk, JSON.stringify(embedding)]
      );
    }
  } catch (err) {
    console.error('Error storing embeddings:', err);
    throw err; // Re-throw to handle in the route handler
  } finally {
    client.release();
  }
}

module.exports = router;