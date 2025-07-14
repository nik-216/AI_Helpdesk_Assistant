const path = require('path');
const { PythonShell } = require('python-shell');
const { chroma_client } = require('../database/chroma_db');

const { generateEmbedding } = require("./embeddingService")

// Python script for searching similar embeddings
async function searchSimilarPostgreSQL(query, chatBot_id, top_k = 10) {
    const embedding = await generateEmbedding(query);
    const options = {
        mode: 'text',
        pythonOptions: ['-u'],
        scriptPath: path.join(__dirname, '../python_scripts'),
        args: [JSON.stringify(embedding), top_k, chatBot_id]
    };

    const result = await PythonShell.run('searchSimilar.py', options);
    return result;
}

async function searchSimilarChroma(query, chatBot_id, top_k = 10) {
    const collection = await chroma_client.getCollection({name: 'knowledge_embeddings'});
    const embedding = await generateEmbedding(query);
  
    try {
        const results = await collection.query({
        queryEmbeddings: [embedding],
        nResults: top_k,
        where: { chatbotId: chatBot_id }
        })
        // console.log(results.documents);
        return results.documents[0] || [];
    } catch (error) {
        console.error('Similar Search Error:', error);
        throw new Error('Failed to search similar embeddings');
    }
}

module.exports = {
    searchSimilarPostgreSQL,
    searchSimilarChroma
}