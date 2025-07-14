const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const multer = require('multer');

const { chunkText } = require("./chunkingService")
const { generateEmbeddings } = require("./embeddingService")
const { storeEmbeddingsChroma } = require("./storingService")


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

const processFileUpload = async (file, userId, chatbotId) => {
  try {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const text = await extractTextFromFile(file.path, file.originalname);
    const chunks = await chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    await storeEmbeddingsChroma(userId, file.originalname, chunks, embeddings, chatbotId);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    return {
      success: true,
      chunks: chunks.length,
      source: file.originalname
    };
  } catch (error) {
    if (file?.path) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

module.exports = {
  upload,
  processFileUpload
};