const crypto = require('crypto');

const otps = new Map();

function generateOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

function storeOTP(identifier, otp) {
    otps.set(identifier, otp);
    setTimeout(() => otps.delete(identifier), 60000); // 1 minute
}

function verifyOTP(identifier, otp) {
    const storedOTP = otps.get(identifier);
    if (storedOTP === otp) {
        otps.delete(identifier);
        return true;
    }
    return false;
}

module.exports = {
    generateOTP,
    storeOTP,
    verifyOTP
};
