const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { PythonShell } = require('python-shell');

const { pool } = require('../database/postgres_db');
const { chroma_client } = require('../database/chroma_db');

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

// Extract the text from file depending on the file type
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

// Scrape the web page
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

// Chunk the text into chunks for embeddings
// function chunkText(text, maxWords = 500) {
//   const words = text.split(/\s+/);
//   return words.reduce((acc, word, i) => {
//     const chunkIndex = Math.floor(i / maxWords);
//     if (!acc[chunkIndex]) acc[chunkIndex] = [];
//     acc[chunkIndex].push(word);
//     return acc;
//   }, []).map(chunk => chunk.join(' '));
// }

async function chunkText(text, maxWords = 500) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input for chunking');
    }

    const options = {
      mode: 'text',
      pythonOptions: ['-u'],
      scriptPath: path.join(__dirname, '../python_scripts'),
      args: [JSON.stringify(text), maxWords.toString()]
    };

    const result = await PythonShell.run('chunking.py', options);

    if (!result || result.length === 0) {
      throw new Error('Python script returned no output');
    }

    const output = result[0];

    // Handle Python errors
    if (output.startsWith('Error:')) {
      throw new Error(output.substring(6).trim());
    }

    try {
      const chunks = JSON.parse(output);
      if (!Array.isArray(chunks)) {
        throw new Error('Invalid chunk format - expected array');
      }
      return chunks.filter(chunk => chunk.trim().length > 0);
    } catch (parseError) {
      console.error('Raw Python output:', output);
      throw new Error(`Failed to parse Python output: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Chunking error:', error);
    throw new Error(`Text chunking failed: ${error.message}`);
  }
}


// Generate embeddings for text
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

// Store the generated embeddings into the database
async function storeEmbeddings(userId, source, chunks, embeddings, chatbotId) {
  const client = await pool.connect(); // Use the imported pool
  try {
    const result = await client.query(
        `INSERT INTO uploaded_data (user_id, chat_bot_id, source, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [userId, chatbotId, source]
      );
    for (const { chunk, embedding } of embeddings) {
      await client.query(
        `INSERT INTO knowledge_embeddings (file_id, chunk, embedding)
         VALUES ($1, $2, $3)`,
        [result.rows[0].file_id, chunk, JSON.stringify(embedding)]
      );
    }
  } catch (err) {
    console.error('Error storing embeddings:', err);
    throw err; // Re-throw to handle in the route handler
  } finally {
    client.release();
  }
}

async function storeEmbeddingsChroma(userId, source, chunks, embeddings, chatbotId) {
  const collection = await chroma_client.getOrCreateCollection('knowledge_embeddings');
  try {

    const result = await client.query(
        `INSERT INTO uploaded_data (user_id, chat_bot_id, source, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [userId, chatbotId, source]
      );

    const fileId = result.rows[0].file_id;

    // const metadata = chunks.map((chunk, index) => ({
    //   user_id: userId,
    //   chat_bot_id: chatbotId,
    //   source: source,
    //   chunk: chunk,
    //   embedding: embeddings[index].embedding
    // }));

    const documents = {
      ids: chunks.map((_, index) => (`${userId}-${chatbotId}-${fileId}-${index}`)),
      documents: chunks,
      metadatas: {
        fileId: fileId,
        chatbotId: chatbotId
      },
      embeddings: embeddings
    }

    await collection.add(documents)

    // await collection.add({
    //   ids: metadata.map((_, index) => `${userId}-${chatbotId}-${index}`),
    //   documents: metadata.map(m => m.chunk),
    //   embeddings: metadata.map(m => m.embedding),
    //   metadatas: metadata
    // });
  } catch (err) {
    console.error('Error storing embeddings in ChromaDB:', err);
    throw err; // Re-throw to handle in the route handler
  }
}

// Process file upload
router.post('/file', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { chatbotId } = req.body;
    // console.log('Authenticated user:', req.user); 

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = await extractTextFromFile(req.file.path, req.file.originalname);
    // const relevantText = await extractRelevantText(text);
    const chunks = await chunkText(text);
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
    // const relevantText = await extractRelevantText(text);
    const chunks = await chunkText(text);
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