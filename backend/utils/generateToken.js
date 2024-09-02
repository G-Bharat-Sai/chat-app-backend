const jwt = require('jsonwebtoken');

const generateToken = (id, expire = process.env.JWT_EXPIRE) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: expire,
    });
};


module.exports = generateToken;
