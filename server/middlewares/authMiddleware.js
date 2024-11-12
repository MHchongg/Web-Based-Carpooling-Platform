const jwt = require('jsonwebtoken')
const secretKey = process.env.SECRET_KEY

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']

    if (!token) {
        return res.status(400).json({ message: 'Token is required' })
    }

    // Remove 'Bearer ' prefix if it's present
    const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token

    jwt.verify(tokenWithoutBearer, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' })
        }
        req.user = user
        next()
    })
}

const verifyAccessRights = (req, res, next) => {
    if (req.user.userEmail === req.body.user_email || req.user.userEmail === req.query.user_email) {
        next()
    }
    else {
        return res.status(403).json({ message: 'No permission' })
    }
}

const verifyAdmin = (req, res, next) => {
    if (req.user.userRole === "Admin") {
        next()
    }
    else {
        return res.status(403).json({ message: 'No permission' })
    }
}

module.exports = {
    verifyToken,
    verifyAccessRights,
    verifyAdmin,
}
