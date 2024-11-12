const express = require('express')
const { login, register, sendOTP, forgotPassword, validateResetPasswordLink, resetPassword } = require('../controllers/authController')
const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/sendOTP', sendOTP)
router.post('/forgotPassword', forgotPassword)
router.get('/resetPassword', validateResetPasswordLink)
router.put('/resetPassword', resetPassword)

module.exports = router
