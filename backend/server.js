const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Handle URL or file input and call Python script
app.post('/process', upload.single('file'), (req, res) => {
  const mode = req.body.mode;
  const url = req.body.url;
  const filePath = req.file?.path;

  const args = [];
  if (mode === 'url') {
    args.push('--url', url);
  } else if (mode === 'file') {
    args.push('--file', filePath);
  }

  const py = spawn('python3', ['python/main.py', ...args]);

  let data = '';
  py.stdout.on('data', (chunk) => {
    data += chunk.toString();
  });

  py.stderr.on('data', (err) => {
    console.error('Error:', err.toString());
  });

  py.on('close', (code) => {
    res.json({ output: data.trim(), code });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
