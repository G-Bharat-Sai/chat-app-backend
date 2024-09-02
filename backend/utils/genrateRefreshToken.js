const generateRefreshToken = (id) => {
    let refreshExpire = process.env.JWT_REFRESH_EXPIRE;
    if (!isNaN(refreshExpire)) {
        refreshExpire = `${refreshExpire}d`; // Convert days to string format
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: refreshExpire,
    });
};
module.exports = generateRefreshToken;
