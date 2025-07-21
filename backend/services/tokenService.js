const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function createToken(user) {
    const token = jwt.sign(
          { user_id: user.rows[0].user_id, 
            email: user.rows[0].email, 
            name: user.rows[0].name
          }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );
    return token;
}

module.exports = {
    createToken
};
