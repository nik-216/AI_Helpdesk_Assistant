const { ChromaClient } = require('chromadb');

const chroma_client = new ChromaClient({
    persistDirectory: './chroma_storage'
});

// chroma_client.deleteCollection({ name: 'knowledge_embeddings' });

module.exports = { 
    chroma_client 
};