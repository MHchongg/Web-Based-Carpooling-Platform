const crypto = require('crypto');
const NodeCache = require("node-cache");
const otpCache = new NodeCache();

function generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

function storeOTP(identifier, otp) {
    otpCache.set(identifier, otp, 60); // 60 seconds
}

function verifyOTP(identifier, otp) {
    const storedOTP = otpCache.get(identifier)
    if (storedOTP === otp) {
        otpCache.del(identifier);
        return true;
    }
    return false;
}

module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP
};
