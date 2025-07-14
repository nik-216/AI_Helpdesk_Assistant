const { PythonShell } = require('python-shell');
const path = require('path');

const { chunkText } = require("./chunkingService")
const { generateEmbeddings } = require("./embeddingService")
const { storeEmbeddingsChroma } = require("./storingService")

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

async function processUrl(url, userId, chatbotId) {
  try {
    if (!url) {
      throw new Error('URL is required');
    }

    const text = await scrapeText(url);
    const chunks = await chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    
    await storeEmbeddingsChroma(userId, url, chunks, embeddings, chatbotId);
    
    return { 
        success: true, 
        chunks: chunks.length,
        source: url
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  scrapeText,
  processUrl
};