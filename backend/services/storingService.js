const { pool } = require('../database/postgres_db');
const { chroma_client } = require('../database/chroma_db');

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
    const collection = await chroma_client.getCollection({name: 'knowledge_embeddings'});
    try {

        const client = await pool.connect();
        const result = await client.query(
            `INSERT INTO uploaded_data (user_id, chat_bot_id, source, created_at)
            VALUES ($1, $2, $3, NOW()) RETURNING *`,
            [userId, chatbotId, source]
        );

        const fileId = result.rows[0].file_id;

        const documents = {
        ids: chunks.map((_, index) => (`${userId}-${chatbotId}-${fileId}-${index}`)),
        documents: embeddings.map(e => e.chunk),
        metadatas: chunks.map(() =>({
            fileId: fileId,
            chatbotId: chatbotId
        })),
        embeddings: embeddings.map(e => e.embedding)
        };

        await collection.add(documents);

    } catch (err) {
        console.error('Error storing embeddings in ChromaDB:', err);
        throw err;
    }
}

module.exports = {
    storeEmbeddings,
    storeEmbeddingsChroma
}