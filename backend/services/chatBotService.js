const { pool } = require('../database/postgres_db');
const { chroma_client } = require('../database/chroma_db');

// Chatbot-related operations
async function getUserChatbots(userId) {
    const result = await pool.query(
        `SELECT * FROM chat_bots 
        WHERE user_id = $1 
        ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
}

async function createChatbot(userId, name, api_key) {
    const result = await pool.query(
        `INSERT INTO chat_bots (user_id, name, api_key) 
        VALUES ($1, $2, $3) 
        RETURNING *`,
        [userId, name, api_key]
    );
    return result.rows[0];
}

async function getChatbotById(chatbotId) {
    const result = await pool.query(
        `SELECT * 
        FROM chat_bots 
        WHERE chat_bot_id = $1`,
        [chatbotId]
    );
    return result.rows[0];
}

async function deleteChatbot(chatbotId, userId) {
    await pool.query(
        `DELETE FROM chat_bots 
        WHERE chat_bot_id = $1 AND user_id = $2`,
        [chatbotId, userId]
    );
}

// Chat-related operations
async function getChatbotChats(chatbotId) {
    const result = await pool.query(
        `SELECT chat_id, created_at 
        FROM chats 
        WHERE chat_bot_id = $1 
        ORDER BY created_at DESC`,
        [chatbotId]
    );
    return result.rows;
}

async function getChatHistoryWithDetails(chatId) {
    const result = await pool.query(
        `SELECT role, content, related_questions, created_at 
        FROM chat_history 
        WHERE chat_id = $1 
        ORDER BY created_at ASC`,
        [chatId]
    );
    return result.rows;
}

// Knowledge-related operations
async function getChatbotKnowledge(chatbotId) {
    const result = await pool.query(
        `SELECT file_id, source 
        FROM uploaded_data 
        WHERE chat_bot_id = $1`,
        [chatbotId]
    );
    return result.rows;
}

async function deleteKnowledgeItem(chatbotId, file_id) {
    const result = await pool.query(
        `DELETE FROM uploaded_data 
        WHERE chat_bot_id = $1 AND file_id = $2 
        RETURNING *`,
        [chatbotId, file_id]
    );

    const collection = await chroma_client.getCollection({name: 'knowledge_embeddings'});
    await collection.delete({ where: {"fileId": file_id}});

    return result.rows;
}

// Settings-related operations
async function getChatbotSettings(chatbotId) {
    const result = await pool.query(
        `SELECT persistent, api_key, llm_model, specifications, rejection_msg, temperature
        FROM chat_bots 
        WHERE chat_bot_id = $1`,
        [chatbotId]
    );
    return result.rows[0];
}

async function updateChatbotSettings(chatbotId, settings) {
    const { persistent, api_key, llm_model, specifications, rejection_msg, temperature } = settings;
    await pool.query(
        `UPDATE chat_bots 
        SET persistent = $1, 
        api_key = $2, 
        llm_model = $3, 
        specifications = $4,
        rejection_msg = $5,
        temperature = $6
        WHERE chat_bot_id = $7`,
        [persistent, api_key, llm_model, specifications, rejection_msg, temperature, chatbotId]
    );
}

// widget related operations
async function createChat(chatBot_id, ip) {
    const result = await pool.query(
        `INSERT INTO chats (chat_bot_id, ip_address) 
        VALUES ($1, $2) 
        RETURNING chat_id`,
        [chatBot_id, ip]
    );
    return result.rows[0].chat_id;
}

async function saveMessage(chat_id, role, content, related_questions = []) {
    await pool.query(
        `INSERT INTO chat_history 
        (chat_id, role, content, related_questions)
        VALUES ($1, $2, $3, $4)`,
        [chat_id, role, content, related_questions]
    );
}

async function getChatBotSettingsWidget(chatBot_id) {
    const result = await pool.query(
        `SELECT specifications, rejection_msg, temperature 
        FROM chat_bots 
        WHERE chat_bot_id = $1`,
        [chatBot_id]
    );
    return result.rows[0];
}

async function getChatHistory(chat_id) {
    const result = await pool.query(
        `SELECT role, content, related_questions, created_at 
        FROM chat_history 
        WHERE chat_id = $1
        ORDER BY created_at ASC
        LIMIT 20`,
        [chat_id]
    );
    return result.rows;
}

async function clearChatHistory(chat_id) {
    await pool.query(
        `DELETE FROM chat_history
        WHERE chat_id = $1`,
        [chat_id]
    );
}

module.exports = {
    // Chatbot operations
    getUserChatbots,
    createChatbot,
    getChatbotById,
    deleteChatbot,
    
    // Chat operations
    getChatbotChats,
    getChatHistoryWithDetails,
    
    // Knowledge operations
    getChatbotKnowledge,
    deleteKnowledgeItem,
    
    // Settings operations
    getChatbotSettings,
    updateChatbotSettings,
    
    // widget related operations
    createChat,
    saveMessage,
    getChatHistory,
    clearChatHistory,
    getChatBotSettingsWidget
};