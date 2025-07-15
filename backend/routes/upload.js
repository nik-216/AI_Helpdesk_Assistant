const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth');

const { upload, processFileUpload } = require('../services/fileUpload');
const { processUrl } = require('../services/webScraping');

// Process file upload
router.post('/file', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { chatbotId } = req.body;
    const result = await processFileUpload(req.file, req.user.user_id, chatbotId);

    res.json(result);

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: error.message || 'File processing failed' });
  }
});

// Process URL
router.post('/url', authenticate, async (req, res) => {
  try {
    const { url, chatbotId } = req.body;

    const result = await processUrl(url, req.user.user_id, chatbotId);

    res.json(result);
  } catch (error) {
    console.error('URL processing error:', error);

    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;