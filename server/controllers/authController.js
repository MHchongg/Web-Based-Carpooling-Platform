const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const db = require('../config/db')
const libphonenumber = require('libphonenumber-js')
const { generateOTP, storeOTP, verifyOTP } = require("../utils/otp")
const { sendOTPEmail, sendInformEmail } = require('../utils/email')
const { v4: uuidv4 } = require('uuid')

const login = (req, res) => {
    const user_email = req.body.loginForm.email
    const user_pwd = req.body.loginForm.password

    const sqlQuery = 'SELECT * FROM users WHERE user_email = ?'

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            bcrypt.compare(user_pwd, result[0].user_password, (err, response) => {
                if (response) {
                    const token = jwt.sign({ userEmail: user_email, userRole: result[0].user_role }, process.env.SECRET_KEY, { expiresIn: '1h' })

                    res.send({
                        status: true,
                        user_email: user_email,
                        user_role: result[0].user_role,
                        user_status: result[0].user_status,
                        token: token
                    })
                }
                else {
                    res.send({ alert: true, status: false, msg: 'Incorrect Password' })
                }
            })
        }
        else {
            res.send({ alert: true, status: false, msg: "User doesn't exist" })
        }
    })
}

const register = (req, res) => {
    const user_name = req.body.registerForm.name
    const user_gender = req.body.registerForm.gender
    const user_email = req.body.registerForm.email
    const user_contactNo = req.body.registerForm.contactNo
    const user_password = req.body.registerForm.password
    const user_confirmPasswrod = req.body.registerForm.confirmPassword
    const otp = req.body.registerForm.otp

    const sqlQuery = 'SELECT id FROM users WHERE user_email = ?'

    const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    const nameRegex = /^[a-zA-Z]{2,}(?:\s[a-zA-Z]{1,})+$/

    db.query(sqlQuery, [user_email], async (err, result) => {
        if (err) return console.log(err)

        const parsedNumber = libphonenumber.parse(user_contactNo);

        if (!nameRegex.test(user_name)) {
            res.send({ alert: true, status: false, msg: 'Invalid full name. Please enter a name with at least two parts (e.g. John Doe)' })
        }
        else if (user_password !== user_confirmPasswrod) {
            res.send({ alert: true, status: false, msg: 'Password and Confirm Password must match' })
        }
        else if (result.length > 0) {
            res.send({ alert: true, status: false, msg: 'User already exists' })
        }
        else if (!emailRegex.test(user_email)) { //!user_email.endsWith(allowedDomain)
            res.send({ alert: true, status: false, msg: 'Please input valid email address' })
        }
        else if (!pwdRegex.test(user_confirmPasswrod)) {
            res.send({ alert: true, status: false, msg: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
        }
        else if (!libphonenumber.isPossibleNumber(parsedNumber)) {
            res.send({ alert: true, status: false, msg: 'Please input valid contact number' })
        }
        else if (!verifyOTP(user_email, otp)) {
            res.send({ alert: true, status: false, msg: 'Invalid OTP' })
        }
        else {
            bcrypt.hash(user_confirmPasswrod, 10, (err, hash) => {
                if (err) return console.log(err)

                const registerQuery = 'INSERT INTO users (user_name, user_gender, user_email, user_contactNo, user_rating, user_rated, user_password) VALUES (?, ?, ?, ?, ?, ?, ?)'

                db.query(registerQuery, [user_name, user_gender, user_email, user_contactNo, 5.0, 0, hash], (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        res.send({ alert: true, status: true, msg: 'Register successfully. You can now log in to your account' })
                    }
                    else {
                        res.send({ alert: true, status: false, msg: 'Fail to register account' })
                    }
                })
            })
        }
    })
}

const sendOTP = (req, res) => {
    const userEmail = req.body.userEmail
    const OTP = generateOTP()
    storeOTP(userEmail, OTP)

    const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/

    if (!emailRegex.test(userEmail)) { //!user_email.endsWith(allowedDomain)
        res.send({ alert: true, status: false, msg: 'Please input valid email address' })
    }
    else {
        const sqlQuery = "SELECT 1 FROM users WHERE user_email = ?"

        db.query(sqlQuery, [userEmail], async (err, result) => {
            if (err) return console.log(err)

            if (result.length > 0) {
                res.send({ alert: true, status: false, msg: 'The user is already registered' })
            }
            else {
                const response = await sendOTPEmail(userEmail, OTP)
                res.send(response)
            }
        })
    }
}

const forgotPassword = (req, res) => {
    const { user_email } = req.body

    const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/
    let sqlQuery = 'SELECT 1 FROM users WHERE user_email = ? UNION SELECT 2 FROM reset_password WHERE user_email = ?'

    if (emailRegex.test(user_email)) {
        db.query(sqlQuery, [user_email, user_email], async (err, result) => {
            if (err) return console.log(err)

            if (result.length > 0) {

                if (result.length === 2) {
                    sqlQuery = "DELETE FROM reset_password WHERE user_email = ?"

                    db.query(sqlQuery, [user_email], (err, result) => {
                        if (err) return console.log(err)

                        if (result.affectedRows !== 1) {
                            res.send({ alert: true, status: false, msg: `Error to delete previous record` })
                        }
                    })
                }

                const uuid = uuidv4()

                const emailInfo = {
                    "content": `A password change has been requested for your account. If this was you, please use the provided link to reset your password. <a href="http://localhost:3000/resetPassword/${user_email}/${uuid}/" style="font-weight:bold;">Reset password</a>`,
                    "subject": 'Change password for UniCarpool',
                    "text": `Change password for UniCarpool (${user_email})`
                }

                let response = await sendInformEmail(user_email, emailInfo)

                if (!response.status) {
                    res.send(response)
                }

                sqlQuery = "INSERT INTO reset_password (user_email, uuid, expiration_time) VALUES (?, ?, ?)"

                db.query(sqlQuery, [user_email, uuid, new Date(Date.now() + 3600000)], (err, result) => { // expired in 1 hour
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        res.send({ alert: true, status: true, msg: `Check your email to reset password` })
                    }
                    else {
                        res.send({ alert: true, status: false, msg: `Error` })
                    }
                })
            }
            else {
                res.send({ alert: true, status: false, msg: `User doesn't exist` })
            }
        })
    }
    else {
        res.send({ alert: true, status: false, msg: `Invalid email address` })
    }
}

const validateResetPasswordLink = (req, res) => {
    const { user_email, uuid } = req.query

    const sqlQuery = "SELECT * FROM reset_password WHERE user_email = ? AND uuid = ?"

    db.query(sqlQuery, [user_email, uuid], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0 && result[0].expiration_time > new Date(Date.now())) {
            res.send(true)
        }
        else {
            res.send(false)
        }
    })
}

const resetPassword = (req, res) => {
    const { user_email, form_passwords } = req.body

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

    if (form_passwords["password"] !== form_passwords["confirmPassword"]) {
        res.send({ alert: true, status: false, msg: 'Password and Confirm Password must match' })
    }
    else if (!pwdRegex.test(form_passwords["confirmPassword"])) {
        res.send({ alert: true, status: false, msg: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
    }
    else {
        bcrypt.hash(form_passwords["confirmPassword"], 10, (err, hash) => {
            if (err) return console.log(err)

            let sqlQuery = "UPDATE users SET user_password = ? WHERE user_email = ?"

            db.query(sqlQuery, [hash, user_email], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {

                    sqlQuery = "DELETE FROM reset_password WHERE user_email = ?"

                    db.query(sqlQuery, [user_email], (err, result) => {
                        if (err) return console.log(err)

                        if (result.affectedRows === 1) {
                            res.send({ alert: true, status: true, msg: 'Reset password successfully' })
                        }
                        else {
                            res.send({ alert: true, status: false, msg: 'Fail to reset password' })
                        }
                    })
                }
                else {
                    res.send({ alert: true, status: false, msg: 'Fail to reset password' })
                }
            })
        })
    }
}

module.exports = {
    login,
    register,
    sendOTP,
    forgotPassword,
    validateResetPasswordLink,
    resetPassword,
}