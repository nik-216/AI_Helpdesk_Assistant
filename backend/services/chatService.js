const { pool } = require('../database/postgres_db');

async function createChat(chatBot_id, ip) {
    const result = await pool.query(
        'INSERT INTO chats (chat_bot_id, ip_address) VALUES ($1, $2) RETURNING chat_id',
        [chatBot_id, ip]
    );
    return result.rows[0].chat_id;
}

async function saveMessage(chat_id, role, content) {
    await pool.query(
        `INSERT INTO chat_history 
        (chat_id, role, content)
        VALUES ($1, $2, $3)`,
        [chat_id, role, content]
    );
}

async function getChatBotSettings(chatBot_id) {
    const result = await pool.query(
        'SELECT specifications, rejection_msg, temperature FROM chat_bots WHERE chat_bot_id = $1',
        [chatBot_id]
    );
    return result.rows[0];
}

async function getChatHistory(chat_id) {
    const result = await pool.query(
        `SELECT role, content, created_at 
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
    createChat,
    saveMessage,
    getChatBotSettings,
    getChatHistory,
    clearChatHistory
};