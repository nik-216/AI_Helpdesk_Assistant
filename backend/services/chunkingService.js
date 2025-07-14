const { PythonShell } = require('python-shell');
const path = require('path');

// Chunk the text into chunks for embeddings
// async function chunkText(text, maxWords = 500) {
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

module.exports = {
    chunkText
};