const { pipeline } = require('@xenova/transformers');

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

// Generate embedding for a chunk using HuggingFace Transformers
async function generateEmbedding(chunk) {
    try {
        if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }

        const result = await embedder(chunk, { pooling: 'mean', normalize: true });

        return Array.from(result.data);
    } catch (error) {
        console.error('HuggingFace embedding error:', error);
        throw new Error('Failed to generate embedding');
    }
}

module.exports = {
    generateEmbeddings,
    generateEmbedding
};