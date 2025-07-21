const { pool } = require('../database/postgres_db');

async function userExists(email){
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result;
}

async function addUser(name, email, hashedPassword){
    const result = await pool.query(
          'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id, email, name',
          [name, email, hashedPassword]
        );
    return result;
}

module.exports = {
    userExists,
    addUser
}