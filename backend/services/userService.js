const { pool } = require('../database/postgres_db');
const { chroma_client } = require('../database/chroma_db');

const bcrypt = require('bcryptjs');

async function changePassword(userId, oldPassword, newPassword) {
    // Check if the user exists
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
    if (userResult.rows.length === 0) {
        throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        throw new Error('Old password is incorrect');
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await pool.query(
        'UPDATE users SET password = $1 WHERE user_id = $2',
        [hashedNewPassword, userId]
    );

    return { message: 'Password changed successfully' };
}

async function getUserProfile(userId) {
    const result = await pool.query(
        `SELECT user_id, name, email, created_at 
        FROM users 
        WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

async function deleteUserAccount(userId) {
    const chatbots = await pool.query(
        'SELECT chat_bot_id FROM chat_bots WHERE user_id = $1',
        [userId]
    );

    await Promise.all(chatbots.rows.map(async (chatbot) => {
        await pool.query(
            'DELETE FROM chat_history WHERE chat_id IN (SELECT chat_id FROM chats WHERE chat_bot_id = $1)',
            [chatbot.chat_bot_id]
        );
        
        await pool.query(
            'DELETE FROM chats WHERE chat_bot_id = $1',
            [chatbot.chat_bot_id]
        );

        try {
            const collection = await chroma_client.getCollection({name: 'knowledge_embeddings'});
            await collection.delete({ where: {"chatbotId": chatbot.chat_bot_id}});
        } catch (err) {
            console.error('Error deleting from ChromaDB:', err);
        }
    }));

    await pool.query(
        'DELETE FROM uploaded_data WHERE user_id = $1',
        [userId]
    );

    await pool.query(
        'DELETE FROM chat_bots WHERE user_id = $1',
        [userId]
    );

    await pool.query(
        'DELETE FROM users WHERE user_id = $1',
        [userId]
    );
    
    return { message: 'Account deleted successfully' };
}

module.exports = {
    changePassword,
    getUserProfile,
    deleteUserAccount
};