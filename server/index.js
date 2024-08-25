const express = require("express");
const app = express();
const http = require("http");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const libphonenumber = require('libphonenumber-js');
const nodemailer = require('nodemailer');
const { generateOTP, storeOTP, verifyOTP } = require("./utils/otp");
const { searchNearbyCarpools } = require("./utils/searchCarpools");
const { emailTemplate, rewardEmailTemplate, informEmailTemplate } = require('./utils/email')
const { convertToJpeg } = require('./utils/sharp')
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const bodyParser = require('body-parser');
const voucher_codes = require('voucher-code-generator');
const QRCode = require('qrcode')
const { Server } = require("socket.io");
const cron = require("node-cron")
require('dotenv').config()

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());
app.use(express.static('public'))

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

dayjs.extend(utc)

const saltRounds = parseInt(process.env.SALT_ROUNDS)
const secretKey = process.env.SECRET_KEY
const appPwd = process.env.APP_PASSWORD

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: process.env.USER_EMAIL,
        pass: appPwd,
    },
});

const db = mysql.createConnection({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Update carpool_status every hour
cron.schedule('0 * * * *', () => {
    const sqlQuery = `UPDATE carpools SET carpool_status = CASE WHEN carpool_status = "available" THEN "Expired" ELSE carpool_status END WHERE carpool_dateTime < NOW()`

    db.query(sqlQuery, (err, result) => {
        if (err) return console.log(err)
    })
})

// Delete carpool which is expired and end (based on rating link's expiration time) at 11:59 pm everyday
cron.schedule('59 23 * * *', () => {

    let expiredQuery = "SELECT id FROM carpools WHERE carpool_status = 'Expired'"

    db.query(expiredQuery, (err, result) => {
        if (err) return console.log(err)

        const expiredIDs = result.map(r => r.id)

        expiredQuery = "DELETE FROM carpools WHERE id IN (?)"

        db.query(expiredQuery, [expiredIDs], (err, result) => {
            if (err) return console.log(err)

            if (result.affectedRows === expiredIDs.length) {
                expiredQuery = "DELETE FROM chat WHERE carpool_id IN (?)"

                db.query(expiredQuery, [expiredIDs], (err, result) => {
                    if (err) return console.log(err)

                    expiredQuery = "DELETE FROM group_members WHERE carpool_id IN (?)"

                    db.query(expiredQuery, [expiredIDs], (err, result) => {
                        if (err) return console.log(err)

                        expiredQuery = "DELETE FROM join_requests WHERE carpool_id IN (?)"

                        db.query(expiredQuery, [expiredIDs], (err, result) => {
                            if (err) return console.log(err)
                        })
                    })
                })
            }
            else {
                console.log(`Fail to delete carpool (Expired) from table carpools ${expiredIDs}`)
            }
        })
    })

    let endQuery = "SELECT DISTINCT carpool_id, expiration_time FROM rating"

    db.query(endQuery, (err, result) => {
        if (err) return console.log(err)

        const expiredCarpoolsRatingIDs = result.filter(r => r.expiration_time < new Date(Date.now())).map(r => r.carpool_id)

        if (expiredCarpoolsRatingIDs.length > 0) {
            endQuery = "DELETE FROM carpools WHERE id IN (?)"

            db.query(endQuery, [expiredCarpoolsRatingIDs], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === expiredCarpoolsRatingIDs.length) {
                    endQuery = "DELETE FROM chat WHERE carpool_id IN (?)"

                    db.query(endQuery, [expiredCarpoolsRatingIDs], (err, result) => {
                        if (err) return console.log(err)

                        endQuery = "DELETE FROM group_members WHERE carpool_id IN (?)"

                        db.query(endQuery, [expiredCarpoolsRatingIDs], (err, result) => {
                            if (err) return console.log(err)

                            endQuery = "DELETE FROM join_requests WHERE carpool_id IN (?)"

                            db.query(endQuery, [expiredCarpoolsRatingIDs], (err, result) => {
                                if (err) return console.log(err)

                                endQuery = "DELETE FROM rating WHERE carpool_id IN (?)"

                                db.query(endQuery, [expiredCarpoolsRatingIDs], (err, result) => {
                                    if (err) return console.log(err)

                                })
                            })
                        })
                    })
                }
                else {
                    console.log(`Fail to delete carpool (End) from table carpools ${expiredCarpoolsRatingIDs}`)
                }
            })
        }
    })
})

io.on("connection", (socket) => {
    socket.on("join_groupChat", (data) => {
        socket.join(data);
    });

    socket.on("send_message", (data) => {
        socket.to(data.carpool_id).emit("receive_message", data);
    });
});

app.post('/login', (req, res) => {
    const user_email = req.body.loginForm.email
    const user_pwd = req.body.loginForm.password

    const sqlQuery = 'SELECT * FROM users WHERE user_email = ?'

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            bcrypt.compare(user_pwd, result[0].user_password, (err, response) => {
                if (response) {
                    const tokenStr = jwt.sign(
                        { 
                            userName: result[0].user_name,
                            userGender: result[0].user_gender,
                            userEmail: user_email,
                            userRole: result[0].user_role,
                            userContactNo: result[0].user_contactNo,
                            userPoint: result[0].user_point,
                            userExp: result[0].user_exp,
                            userRating: result[0].user_rating,
                            userRated: result[0].user_rated,
                            userStatus: result[0].user_status
                        }, 
                        secretKey)
                        
                    res.send({
                        status: true,
                        user_email: user_email,
                        user_role: result[0].user_role,
                        user_status: result[0].user_status,
                        token: tokenStr 
                    })
                }
                else {
                    res.send({ alert: true, status: false, msg:'Incorrect Password' })
                }
            })
        }
        else {
            res.send ({ alert: true, status: false, msg: "User doesn't exist" })
        }
    })
})

app.post('/register', (req, res) => {
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
            bcrypt.hash(user_confirmPasswrod, saltRounds, (err, hash) => {
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
})

app.post('/sendOTP', (req, res) => {
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
                try {
                    // send mail with defined transport object
                    await transporter.sendMail({
                        from: {
                            name: "UniCarpool",
                            address: "chongminghong34@gmail.com"
                        },
                        to: userEmail, // list of receivers
                        subject: "UniCarpool OTP Verification", // Subject line
                        text: `Your OTP is ${OTP}`, // plain text body
                        html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                    <div style="margin:50px auto;width:70%;padding:20px 0">
                        <div style="border-bottom:1px solid #eee">
                        <a href="" style="font-size:1.4em;color: #5b277b;text-decoration:none;font-weight:600">UniCarpool</a>
                        </div>
                        <p style="font-size:1.1em">Hi,</p>
                        <p>Thank you for choosing UniCarpool. Use the following OTP to complete your Sign Up procedures. The OTP is valid for 1 minute.</p>
                        <h2 style="background: #5b277b;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                        <p style="font-size:0.9em;">Regards,<br />UniCarpool</p>
                        <hr style="border:none;border-top:1px solid #eee" />
                        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                        <p>UniCarpool</p>
                        <p>Bukit Beruang</p>
                        <p>Melaka</p>
                        </div>
                    </div>
                    </div>`
                    });
                    res.send({ alert: true, status: true, msg: 'OTP has been send to your email' })
                }
                catch (error) {
                    console.log(error)
                }
            }
        })
    }
})

app.post('/postCarpool', async (req, res) => {
    const carpoolForm = req.body.carpoolForm
    
    const postCarpoolQuery = 'INSERT INTO carpools (carpool_title, carpool_type, carpool_status, carpool_from, carpool_fromLat, carpool_fromLon, carpool_to, carpool_toLat, carpool_toLon, carpool_dateTime, carpool_price, carpool_totalSeats, carpool_takenSeats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

    db.query(postCarpoolQuery, [carpoolForm.carpool_title, carpoolForm.carpool_type, "available", carpoolForm.carpool_from.fromAddr, carpoolForm.carpool_from.from_lat, carpoolForm.carpool_from.from_lon, carpoolForm.carpool_to.toAddr, carpoolForm.carpool_to.to_lat, carpoolForm.carpool_to.to_lon, carpoolForm.carpool_dateTime, carpoolForm.carpool_price, carpoolForm.carpool_seats, 1], (err, result) => {
        if (err) return console.log(err)

        const carpool_id = result.insertId

        if (result.affectedRows === 1) {
            const insertGroupMemberQuery = 'INSERT INTO group_members (carpool_id, member_email, member_name, isDriver) VALUES (?, ?, ?, ?)'

            let isDriver = carpoolForm.carpool_type === 'fromDriver'

            db.query(insertGroupMemberQuery, [carpool_id, carpoolForm.user_email, carpoolForm.user_name, isDriver], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    res.send({ alert: true, status: true, msg: 'Post successfully' })
                }
            })
        }
    })
})

app.get('/getCarpoolList', (req, res) => {

    const sqlQuery = "SELECT * FROM carpools"
    let carpoolList = []

    db.query(sqlQuery, async (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                let carpool_dateTime = dayjs(result[i].carpool_dateTime).utc();

                // Convert the datetime to UTC+8 timezone
                carpool_dateTime = carpool_dateTime.utcOffset(8 * 60);

                // Format the datetime value as desired
                carpool_dateTime = carpool_dateTime.format('YYYY-MM-DD HH:mm:ss');

                carpoolList.push({
                    carpool_id: result[i].id,
                    carpool_title: result[i].carpool_title,
                    carpool_type: result[i].carpool_type,
                    carpool_status: result[i].carpool_status,
                    carpool_from: result[i].carpool_from,
                    carpool_fromLat: result[i].carpool_fromLat,
                    carpool_fromLon: result[i].carpool_fromLon,
                    carpool_to: result[i].carpool_to,
                    carpool_toLat: result[i].carpool_toLat,
                    carpool_toLon: result[i].carpool_toLon,
                    carpool_dateTime: carpool_dateTime,
                    carpool_price: result[i].carpool_price,
                    carpool_totalSeats: result[i].carpool_totalSeats,
                    carpool_takenSeats: result[i].carpool_takenSeats,
                })
            }
            res.send(carpoolList)
        }
        else {
            res.send(carpoolList)
        }
    })
})

app.get('/getMyCarpoolList', (req, res) => {
    const user_email = req.query.userEmail
    let carpool_groups = []

    const sqlQuery = 'SELECT carpool_id FROM group_members WHERE member_email = ?'

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                carpool_groups.push(result[i].carpool_id)
            }
            res.send(carpool_groups)
        }
        else {
            res.send(carpool_groups)
        }
    })
})

app.get('/getCarpoolMembers', (req, res) => {
    const carpool_id = req.query.carpool_id
    let members = []
   
    const sqlQuery = 'SELECT member_email, member_name, isDriver FROM group_members WHERE carpool_id=?'

    db.query(sqlQuery, [carpool_id], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                members.push({
                    member_email: result[i].member_email,
                    member_name: result[i].member_name,
                    isDriver: result[i].isDriver,
                })
            }
            res.send(members)
        }
        else {
            res.send(members)
        }
    })
})

app.post('/requestToJoinCarpool', async (req, res) => {
    const { carpoolInfo, user_email, user_name, driver_email } = req.body

    let sqlQuery = "SELECT * FROM group_members WHERE carpool_id = ? AND member_email = ?"

    db.query(sqlQuery, [carpoolInfo.carpool_id, user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            res.send({ alert: true, status: false, msg: "You are already a member of this carpool group. Please refresh your page" })
        }
        else {
            sqlQuery = "SELECT carpool_status FROM carpools WHERE id = ?"

            db.query(sqlQuery, [carpoolInfo.carpool_id], (err, result) => {
                if (err) return console.log(err)

                if (result[0].carpool_status !== 'available') {
                    res.send({ alert: true, status: false, msg: `This carpool group is unavailable now. Please refresh your page` })
                }
                else {
                    sqlQuery = 'SELECT * FROM join_requests WHERE carpool_id = ? AND user_email = ?'

                    db.query(sqlQuery, [carpoolInfo.carpool_id, user_email], (err, result) => {
                        if (err) return console.log(err)

                        if (result.length > 0) {
                            res.send({ alert: true, status: false, msg: "You have requested this carpool. Please wait for driver's response" })
                        }
                        else {
                            sqlQuery = 'INSERT INTO join_requests (carpool_id, user_email, user_name, request_status) VALUES (?, ?, ?, ?)'

                            db.query(sqlQuery, [carpoolInfo.carpool_id, user_email, user_name, 'Pending'], async (err, result) => {
                                if (err) return console.log(err)

                                if (result.affectedRows === 1) {

                                    try {
                                        await transporter.sendMail({
                                            from: {
                                                name: "UniCarpool",
                                                address: "chongminghong34@gmail.com"
                                            },
                                            to: driver_email, // list of receivers
                                            subject: `Someone request to join your carpool`, // Subject line
                                            text: `${user_email} request to join your carpool ${carpoolInfo.carpool_title}`, // plain text body
                                            html: emailTemplate({
                                                carpool_title: carpoolInfo.carpool_title,
                                                carpool_from: carpoolInfo.carpool_from,
                                                carpool_to: carpoolInfo.carpool_to,
                                                carpool_dateTime: carpoolInfo.carpool_dateTime,
                                                user_email: user_email,
                                                type: 'JoinRequest',
                                            })
                                        });
                                    }
                                    catch (error) {
                                        console.log(error)
                                    }
                                    res.send({ alert: true, status: true, msg: 'Request send successfully' })
                                }
                            })
                        }
                    })
                }
            })
        }
    })
})

app.get('/getDriverIsMeGroup', async (req, res) => {
    const user_email = req.query.user_email
    let myDriverGroup = []

    const sqlQuery = 'SELECT carpool_id FROM group_members WHERE member_email = ? AND isDriver = ?'

    db.query(sqlQuery, [user_email, 1], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                myDriverGroup.push(result[i].carpool_id)
            }
            res.send(myDriverGroup)
        }
        else {
            res.send(myDriverGroup)
        }
    })
})

app.get('/getMyCarpoolJoinRequest', async (req, res) => {
    const member_email = req.query.member_email
    let myDriverGroup = []
    let joinRequests = []

    let sqlQuery = 'SELECT carpool_id FROM group_members WHERE member_email = ? AND isDriver = ?'

    db.query(sqlQuery, [member_email, 1], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0 ; i < result.length ;  i++) {
                myDriverGroup.push(result[i].carpool_id)
            }

            sqlQuery = `SELECT id, carpool_id, user_email, user_name FROM join_requests WHERE request_status = "Pending" AND carpool_id IN (${myDriverGroup})`

            db.query(sqlQuery, (err, result) => {
                if (err) return console.log(err)

                if (result.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        joinRequests.push({
                            request_id: result[i].id,
                            carpool_id: result[i].carpool_id,
                            user_email: result[i].user_email,
                            user_name: result[i].user_name,
                        })
                    }
                    res.send(joinRequests)
                }
                else {
                    res.send(joinRequests)
                }
            })
        }
        else {
            res.send(joinRequests)
        }
    })
})

app.get('/getMyJoinRequests', (req, res) => {
    const user_email = req.query.user_email
    let myJoinRequests = []

    const sqlQuery = `SELECT carpool_id, request_status FROM join_requests WHERE user_email = ?`

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0 ; i < result.length ; i++) {
                myJoinRequests.push({
                    carpool_id: result[i].carpool_id,
                    request_status: result[i].request_status,
                })
            }
            res.send(myJoinRequests)
        }
        else {
            res.send(myJoinRequests)
        }
    })
})

app.get('/fetchUserInfo', (req, res) => {
    const user_email = req.query.user_email
    let userDetails = new Object()

    let sqlQuery = 'SELECT user_name, user_gender, user_email, user_role, user_contactNo, user_point, user_exp, user_rating, user_rated, user_status FROM users WHERE user_email = ?'

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            userDetails = Object.assign(userDetails, result[0])

            if (userDetails["user_role"] === 'Driver') {
                sqlQuery = 'SELECT car_number, car_model, car_color FROM drivers WHERE driver_email = ?'

                db.query(sqlQuery, [user_email], (err, result) => {
                    if (err) return console.log(err)

                    if (result.length > 0) {
                        userDetails = Object.assign(userDetails, result[0])

                        res.send(userDetails)
                    }
                    else {
                        res.send(userDetails)
                    }
                })
            }
            else {
                res.send(userDetails)
            }
            
        }
        else {
            return console.log(err)
        }
    })
})

app.post('/handleJoinRequest', (req, res) => {
    const { request_id, carpoolInfo, member_email, member_name, type } = req.body

    let sqlQuery = `SELECT request_status FROM join_requests WHERE id = ${request_id}`

    db.query(sqlQuery, (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            if (result[0].request_status !== 'Pending') {
                res.send({ alert: true, status: false, msg: `The request has already been accepted or rejected. Please refresh your page` })
            }
            else {
                if (type === 'Accept') {
                    sqlQuery = "SELECT carpool_status FROM carpools WHERE id = ?"

                    db.query(sqlQuery, [carpoolInfo.carpool_id], (err, result) => {
                        if (err) return console.log(err)

                        if (result[0].carpool_status !== 'available') {
                            res.send({ alert: true, status: false, msg: `Adding new members is not allowed as this carpool is no longer available.` })
                        }
                        else {
                            sqlQuery = `DELETE FROM join_requests WHERE id = ${request_id}`

                            db.query(sqlQuery, (err, result) => {
                                if (err) return console.log(err)

                                if (result.affectedRows === 1) {
                                    sqlQuery = "UPDATE carpools SET carpool_takenSeats = carpool_takenSeats + 1, carpool_status = CASE WHEN carpool_takenSeats >= carpool_totalSeats THEN 'full' ELSE 'available' END WHERE id = ?"

                                    db.query(sqlQuery, [carpoolInfo.carpool_id], (err, result) => {
                                        if (err) return console.log(err)

                                        if (result.affectedRows === 1) {
                                            sqlQuery = `INSERT INTO group_members (carpool_id, member_email, member_name, isDriver) VALUES (?, ?, ?, ?)`

                                            db.query(sqlQuery, [carpoolInfo.carpool_id, member_email, member_name, 0], async (err, result) => {
                                                if (err) return console.log(err)

                                                if (result.affectedRows === 1) {
                                                    try {
                                                        await transporter.sendMail({
                                                            from: {
                                                                name: "UniCarpool",
                                                                address: "chongminghong34@gmail.com"
                                                            },
                                                            to: member_email, // list of receivers
                                                            subject: `Your join request has been accepted`, // Subject line
                                                            text: `Your join request for carpool ${carpoolInfo.carpool_title} has been accepted`, // plain text body
                                                            html: emailTemplate({
                                                                carpool_title: carpoolInfo.carpool_title,
                                                                carpool_from: carpoolInfo.carpool_from,
                                                                carpool_to: carpoolInfo.carpool_to,
                                                                carpool_dateTime: carpoolInfo.carpool_dateTime,
                                                                type: 'AcceptRequest',
                                                            })
                                                        });
                                                    }
                                                    catch (error) {
                                                        console.log(error)
                                                    }

                                                    res.send({ alert: true, status: true, msg: `${type} request successfully` })
                                                }
                                                else {
                                                    res.send({ alert: true, status: true, msg: `Fail to ${type} request` })
                                                }
                                            })
                                        }
                                        else {
                                            res.send({ alert: true, status: true, msg: `Fail to ${type} request` })
                                        }
                                    })
                                }
                                else {
                                    res.send({ alert: true, status: true, msg: `Fail to ${type} request` })
                                }
                            })
                        }
                    })
                }
                else {
                    sqlQuery = `DELETE FROM join_requests WHERE id = ${request_id}`

                    db.query(sqlQuery, async (err, result) => {
                        if (err) return console.log(err)

                        if (result.affectedRows === 1) {
                            try {
                                await transporter.sendMail({
                                    from: {
                                        name: "UniCarpool",
                                        address: "chongminghong34@gmail.com"
                                    },
                                    to: member_email, // list of receivers
                                    subject: `Your join request has been rejected`, // Subject line
                                    text: `Your join request for carpool ${carpoolInfo.carpool_title} has been rejected`, // plain text body
                                    html: emailTemplate({
                                        carpool_title: carpoolInfo.carpool_title,
                                        carpool_from: carpoolInfo.carpool_from,
                                        carpool_to: carpoolInfo.carpool_to,
                                        carpool_dateTime: carpoolInfo.carpool_dateTime,
                                        type: 'RejectRequest',
                                    })
                                });
                            }
                            catch (error) {
                                console.log(error)
                            }
                            res.send({ alert: true, status: true, msg: `${type} request successfully` })
                        }
                        else {
                            res.send({ alert: true, status: false, msg: `Fail to ${type} request` })
                        }
                    })
                }
            }
        }
        else {
            res.send({ alert: true, status: false, msg: `The request has already been accepted or rejected. Please refresh your page` })
        }
    })
})

app.post('/exitCarpool', (req, res) => {
    const { user_email, carpoolInfo, driver_email } = req.body

    let sqlQuery = "DELETE FROM join_requests WHERE carpool_id = ? AND user_email = ?"

    db.query(sqlQuery, [carpoolInfo.carpool_id, user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            res.send({ alert: true, status: true, msg: `Withdraw request successfully` })
        }
        else {
            sqlQuery = 'DELETE FROM group_members WHERE carpool_id = ? AND member_email = ?'

            db.query(sqlQuery, [carpoolInfo.carpool_id, user_email], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    sqlQuery = `UPDATE carpools SET carpool_takenSeats = carpool_takenSeats - 1, carpool_status = CASE WHEN carpool_takenSeats < carpool_totalSeats THEN 'available' ELSE carpool_status END WHERE id = ?`

                    db.query(sqlQuery, [carpoolInfo.carpool_id], (err, result) => {
                        if (err) return console.log(err)

                        if (result.affectedRows === 1) {
                            sqlQuery = "DELETE FROM carpools WHERE carpool_takenSeats = 0 AND id = ?"

                            db.query(sqlQuery, [carpoolInfo.carpool_id], async (err, result) => {
                                if (err) return console.log(err)

                                if (driver_email !== null) {
                                    try {
                                        await transporter.sendMail({
                                            from: {
                                                name: "UniCarpool",
                                                address: "chongminghong34@gmail.com"
                                            },
                                            to: driver_email, // list of receivers
                                            subject: `Someone exited your carpool`, // Subject line
                                            text: `${user_email} exited your carpool ${carpoolInfo.carpool_title}`, // plain text body
                                            html: emailTemplate({
                                                carpool_title: carpoolInfo.carpool_title,
                                                carpool_from: carpoolInfo.carpool_from,
                                                carpool_to: carpoolInfo.carpool_to,
                                                carpool_dateTime: carpoolInfo.carpool_dateTime,
                                                user_email: user_email,
                                                type: 'Exit',
                                            })
                                        });
                                    }
                                    catch (error) {
                                        console.log(error)
                                    }
                                }

                                res.send({ alert: true, status: true, msg: `Exit carpool successfully` })
                            })
                        }
                        else {
                            res.send({ alert: true, status: false, msg: `Fail to exit carpool` })
                        }
                    })
                }
                else {
                    res.send({ alert: true, status: false, msg: `You have exited the carpool group/withdrawed request. Please refresh your page` })
                }
            })
        }
    })
})

app.post('/formCarpool', async (req, res) => {
    const { carpoolInfo, user_name, user_email, member_email } = req.body

    let sqlQuery = 'SELECT carpool_type, carpool_status FROM carpools WHERE id = ?'

    db.query(sqlQuery, [carpoolInfo.carpool_id], (err, result) => {
        if (err) return console.log(err)

        if (result[0].carpool_status === "Expired") {
            res.send({ alert: true, status: false, msg: `The carpool is already expired. Please refresh your page` })
        }
        else if (result[0].carpool_type === 'fromDriver') {
            res.send({ alert: true, status: false, msg: `The carpool is already formed. Please refresh your page` })
        }
        else {
            sqlQuery = 'INSERT INTO group_members (carpool_id, member_email, member_name, isDriver) VALUES (?, ?, ?, 1)'

            db.query(sqlQuery, [carpoolInfo.carpool_id, user_email, user_name], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    sqlQuery = 'UPDATE carpools SET carpool_type = "fromDriver", carpool_takenSeats = carpool_takenSeats + 1, carpool_status = CASE WHEN carpool_takenSeats >= carpool_totalSeats THEN "full" ELSE carpool_status END WHERE id = ?'

                    db.query(sqlQuery, [carpoolInfo.carpool_id], async (err, result) => {
                        if (err) return console.log(err)

                        if (result.affectedRows === 1) {

                            try {
                                await transporter.sendMail({
                                    from: {
                                        name: "UniCarpool",
                                        address: "chongminghong34@gmail.com"
                                    },
                                    to: member_email, // list of receivers
                                    subject: `Someone formed a carpool with you`, // Subject line
                                    text: `${user_email} formed a carpool ${carpoolInfo.carpool_title} with you`, // plain text body
                                    html: emailTemplate({
                                        carpool_title: carpoolInfo.carpool_title,
                                        carpool_from: carpoolInfo.carpool_from,
                                        carpool_to: carpoolInfo.carpool_to,
                                        carpool_dateTime: carpoolInfo.carpool_dateTime,
                                        user_email: user_email,
                                        type: 'FormCarpool',
                                    })
                                });
                            }
                            catch (error) {
                                console.log(error)
                            }

                            res.send({ alert: true, status: true, msg: `Form carpool successfully. You can refresh your page` })
                        }
                    })
                }
            })
        }
    })
})

app.get('/searchCarpools', async (req, res) => {
    const fromAddress = JSON.parse(req.query.fromAddress)
    const toAddress = JSON.parse(req.query.toAddress)
    const dateTime = req.query.dateTime
    const type = req.query.type

    let sqlQuery = `SELECT * FROM carpools WHERE carpool_status = 'available' AND carpool_type = '${type}'`
    let carpoolList = []
    let nearbyCarpools = []

    db.query(sqlQuery, async (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                let carpool_dateTime = dayjs(result[i].carpool_dateTime).utc();

                // Convert the datetime to UTC+8 timezone
                carpool_dateTime = carpool_dateTime.utcOffset(8 * 60);

                // Format the datetime value as desired
                carpool_dateTime = carpool_dateTime.format('YYYY-MM-DD HH:mm:ss');

                carpoolList.push({
                    carpool_id: result[i].id,
                    from_lat: result[i].carpool_fromLat,
                    from_long: result[i].carpool_fromLon,
                    to_lat: result[i].carpool_toLat,
                    to_long: result[i].carpool_toLon,
                    carpool_dateTime: carpool_dateTime,
                    carpool_type: type,
                })
            }
            
            nearbyCarpools = searchNearbyCarpools(carpoolList, fromAddress.from_lat, fromAddress.from_lon, toAddress.to_lat, toAddress.to_lon, dateTime)

            res.send(nearbyCarpools)
        }
        else {
            res.send(nearbyCarpools)
        }
    })
})

app.post('/handleCarpoolStatus', async (req, res) => {
    const { carpool_id, carpool_title, carpool_from, carpool_to, carpool_dateTime, members_email, carpool_status } = req.body

    let sqlQuery = ''
    
    let nowDateTime = dayjs().utc()

    // Convert the datetime to UTC+8 timezone
    nowDateTime = nowDateTime.utcOffset(8 * 60);

    // Format the datetime value as desired
    nowDateTime = nowDateTime.format('YYYY-MM-DD HH:mm:ss');

    if (carpool_status === 'InProgress') {
        sqlQuery = `UPDATE carpools SET carpool_status = "${carpool_status}" WHERE id = ${carpool_id}`

        db.query(sqlQuery, async (err, result) => {
            if (err) return console.log(err)

            if (result.affectedRows === 1) {

                try {
                    // send mail with defined transport object
                    await transporter.sendMail({
                        from: {
                            name: "UniCarpool",
                            address: "chongminghong34@gmail.com"
                        },
                        to: members_email, // list of receivers
                        subject: `Carpool departed!`, // Subject line
                        text: `Your carpool ${carpool_title} has been started by the driver at ${nowDateTime}`, // plain text body
                        html: emailTemplate({
                            carpool_title: carpool_title,
                            carpool_from: carpool_from,
                            carpool_to: carpool_to,
                            carpool_dateTime: carpool_dateTime,
                            nowDateTime: nowDateTime,
                            type: 'Depart',
                        })
                    });
                }
                catch (error) {
                    console.log(error)
                }

                sqlQuery = "SELECT * FROM join_requests WHERE carpool_id = ?"

                db.query(sqlQuery, [carpool_id], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.length > 0) {
                        const user_emails = result.map(user => user.user_email)

                        try {
                            await transporter.sendMail({
                                from: {
                                    name: "UniCarpool",
                                    address: "chongminghong34@gmail.com"
                                },
                                to: user_emails, // list of receivers
                                subject: `Your join request has been rejected`, // Subject line
                                text: `Your join request for carpool ${carpool_title} has been rejected`, // plain text body
                                html: emailTemplate({
                                    carpool_title: carpool_title,
                                    carpool_from: carpool_from,
                                    carpool_to: carpool_to,
                                    carpool_dateTime: carpool_dateTime,
                                    type: 'RejectRequest',
                                })
                            });
                        }
                        catch (error) {
                            console.log(error)
                        }

                        sqlQuery = "DELETE FROM join_requests WHERE carpool_id = ?"

                        db.query(sqlQuery, [carpool_id], (err, result) => {
                            if (err) return console.log(err)

                            if (result.affectedRows === user_emails.length) {
                                res.send({ alert: true, status: true, msg: `Carpool has been started` })
                            }
                            else {
                                res.send({ alert: true, status: false, msg: `Fail to send reject email to users (start carpool)` })
                            }
                        })
                    }
                    else {
                        res.send({ alert: true, status: true, msg: `Carpool has been started` })
                    }
                })
            }
            else {
                res.send({ alert: true, status: false, msg: `Fail to start the carpool` })
            }
        })
    }
    else {
        sqlQuery = `UPDATE carpools SET carpool_status = "${carpool_status}" WHERE id = ${carpool_id}`

        db.query(sqlQuery, (err, result) => {
            if (err) return console.log(err)

            if (result.affectedRows === 1) {

                const formattedEmails = members_email.map(email => `'${email}'`).join(',');

                sqlQuery = `UPDATE users SET user_point = user_point + 5, user_exp = user_exp + 1 WHERE user_email IN (${formattedEmails})`

                db.query(sqlQuery, async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === members_email.length) {
                        const rating_link_expiration_time = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // expire in 1 week

                        for (let i = 0 ; i < members_email.length ; i++) {
                            const uuid = uuidv4()
                            try {
                                // send mail with defined transport object
                                await transporter.sendMail({
                                    from: {
                                        name: "UniCarpool",
                                        address: "chongminghong34@gmail.com"
                                    },
                                    to: members_email[i], // list of receivers
                                    subject: `Carpool arrived!`, // Subject line
                                    text: `Your carpool ${carpool_title} has been ended by the driver at ${nowDateTime}`, // plain text body
                                    html: emailTemplate({
                                        carpool_title: carpool_title,
                                        carpool_from: carpool_from,
                                        carpool_to: carpool_to,
                                        carpool_dateTime: carpool_dateTime,
                                        nowDateTime: nowDateTime,
                                        rateLink: `http://localhost:3000/rateMembers/${carpool_id}/${members_email[i]}/${uuid}/`,
                                        type: 'End',
                                    })
                                });
                            }
                            catch (error) {
                                console.log(error)
                            }

                            sqlQuery = 'INSERT INTO rating (carpool_id, user_email, isRated, uuid, expiration_time) VALUES (?, ?, 0, ?, ?)'

                            db.query(sqlQuery, [carpool_id, members_email[i], uuid, rating_link_expiration_time], (err, result) => {
                                if (err) return console.log(err)

                                if (result.affectedRows !== 1) {
                                    res.send({ alert: true, status: false, msg: `Error` })
                                } 
                            })
                        }
                    }
                    else {
                        res.send({ alert: true, status: false, msg: `Error` })
                    }
                    res.send({ alert: true, status: true, msg: `Carpool has been ended` })
                })
            }
            else {
                res.send({ alert: true, status: false, msg: `Error` })
            }
        })
    }
})

app.get('/checkAccessForRating', (req, res) => {
    const { carpool_id, user_email, uuid } = req.query

    let sqlQuery = 'SELECT * FROM carpools WHERE id = ? AND carpool_status = "End"'

    db.query(sqlQuery, [carpool_id], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            // not exist and not his/her carpool
            let carpool_groups = []

            sqlQuery = 'SELECT carpool_id FROM group_members WHERE member_email = ?'

            db.query(sqlQuery, [user_email], (err, result) => {
                if (err) return console.log(err)

                if (result.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        carpool_groups.push(result[i].carpool_id)
                    }
                    
                    if (carpool_groups.includes(parseInt(carpool_id))) {
                        sqlQuery = 'SELECT isRated, expiration_time FROM rating WHERE carpool_id = ? AND user_email = ? AND uuid = ?'

                        db.query(sqlQuery, [carpool_id, user_email, uuid], (err, result) => {
                            if (err) return console.log(err)

                            if (result.length > 0 && result[0].expiration_time > new Date(Date.now())) {
                                if (result[0].isRated) {
                                    res.send({ access: true, isRated: true })
                                }
                                else {
                                    res.send({ access: true, isRated: false })
                                }
                            }
                            else {
                                res.send({ access: false, isRated: false })
                            }
                        })
                    }
                    else {
                        res.send({ access: false, isRated: false })
                    }
                }
                else {
                    res.send({access: false, isRated: false})
                }
            })
        }
        else {
            res.send({access: false, isRated: false})
        }
    })
})

app.post('/submitRatings', (req, res) => {
    const { ratings, carpool_id, user_email, uuid } = req.body
    let affectedRows = 0

    let sqlQuery = 'SELECT isRated FROM rating WHERE carpool_id = ? AND user_email = ? AND uuid = ?'

    db.query(sqlQuery, [carpool_id, user_email, uuid], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            if (result[0].isRated) {
                res.send({ alert: true, status: false, msg: `You have submitted your review` })
            }
            else {
                sqlQuery = 'UPDATE rating SET isRated = true WHERE carpool_id = ? AND user_email = ? AND uuid = ?'

                db.query(sqlQuery, [carpool_id, user_email, uuid], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        Object.entries(ratings).forEach(([key, value]) => {
                            sqlQuery = `UPDATE users SET user_rating = (user_rating * user_rated + ${value}) / (user_rated + 1), user_point = user_point + ${value} / 2, user_rated = user_rated + 1 WHERE user_email = "${key}"`

                            db.query(sqlQuery, (err, result) => {
                                if (err) return console.log(err)

                                if (result.affectedRows === 1) {
                                    affectedRows++

                                    if (affectedRows === Object.keys(ratings).length) {
                                        res.send({ alert: true, status: true, msg: `Submit successfully` })
                                    }
                                }
                                else {
                                    res.send({ alert: true, status: false, msg: `Error` })
                                }
                            })
                        })
                    }
                    else {
                        res.send({ alert: true, status: false, msg: `Error` })
                    }
                })
            }
        }
        else {
            res.send({ alert: true, status: false, msg: `Error` })
        }
    })
})

app.post('/updatePhoneNum', (req, res) => {
    const { user_email, new_phoneNum } = req.body

    const parsedNumber = libphonenumber.parse(new_phoneNum);

    if (!libphonenumber.isPossibleNumber(parsedNumber)) {
        res.send({ alert: true, status: false, msg: 'Please input valid contact number' })
    }
    else {
        const sqlQuery = 'UPDATE users SET user_contactNo = ? WHERE user_email = ?'

        db.query(sqlQuery, [new_phoneNum, user_email], (err, result) => {
            if (err) return console.log(err)

            if (result.affectedRows === 1) {
                res.send({ alert: true, status: true, msg: `Update successfully` })
            }
            else {
                res.send({ alert: true, status: false, msg: `Error to update phone number` })
            }
        })
    }
})

app.post('/requestBecomeDriver', (req, res) => {
    const requestForm = req.body.requestForm

    let sqlQuery = ''

    if (requestForm.status) {
        if (requestForm.status === 'Rejected') {
            sqlQuery = `UPDATE drivers SET car_model = ?, car_year = ?, car_color = ?, car_vin = ?, car_number = ?, driver_license_exp_date = ?, driver_license_issue_country = ?, status = 'Pending' WHERE driver_email = '${requestForm.user_email}'`
        }
    }
    else {
        sqlQuery = `INSERT INTO drivers (driver_email, car_model, car_year, car_color, car_vin, car_number, driver_license_exp_date, driver_license_issue_country) VALUES ("${requestForm.user_email}", ?, ?, ?, ?, ?, ?, ?)`
    }

    db.query(sqlQuery , [requestForm.vehicle_model, requestForm.vehicle_year, requestForm.vehicle_color, requestForm.vehicle_vin, requestForm.vehicle_car_num, requestForm.license_exp_date, requestForm.license_issue_country], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            const vehiclePhoto = requestForm.vehicle_photo.content.split(';base64,').pop();
            const licensePhoto = requestForm.license_photo.content.split(';base64,').pop();

            const userDirectory = `public/driverImages/${requestForm.user_email}`;

            if (!fs.existsSync(userDirectory)) {
                fs.mkdirSync(userDirectory, { recursive: true }); // Use recursive: true to create nested directories
            }

            fs.writeFile(`${userDirectory}/vehiclePhoto.${requestForm.vehicle_photo.type.split('/')[1]}`, vehiclePhoto, 'base64', async (err) => {
                if (err) return console.log(`Error saving vehicle photo : ${err}`)

                if (requestForm.vehicle_photo.type !== "image/jpeg") {
                    await convertToJpeg(`${userDirectory}/vehiclePhoto.${requestForm.vehicle_photo.type.split('/')[1]}`, `${userDirectory}/vehiclePhoto.jpeg`)
                }
            });

            fs.writeFile(`${userDirectory}/driverLicense.${requestForm.license_photo.type.split('/')[1]}`, licensePhoto, 'base64', async (err) => {
                if (err) return console.log(`Error saving license photo : ${err}`)

                if (requestForm.license_photo.type !== "image/jpeg") {
                    await convertToJpeg(`${userDirectory}/driverLicense.${requestForm.license_photo.type.split('/')[1]}`, `${userDirectory}/driverLicense.jpeg`)
                }
            });

            res.send({ alert: true, status: true, msg: `Submit successfully` })
        }
        else {
            res.send({ alert: true, status: false, msg: `Error to submit become driver request form` })
        }
    })
})

app.get('/getBecomeDriverReqStatus', (req, res) => {
    const user_email = req.query.user_email
    let requestInfo = new Object()

    const sqlQuery = "SELECT drivers.*, users.user_name FROM drivers, users WHERE drivers.driver_email = ? AND users.user_email = ?"

    db.query(sqlQuery, [user_email, user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {

            let exp_date = dayjs(result[0].driver_license_exp_date).utc();

            // Convert the datetime to UTC+8 timezone
            exp_date = exp_date.utcOffset(8 * 60);

            // Format the datetime value as desired
            exp_date = exp_date.format('YYYY-MM-DD');

            fs.readFile(`public/driverImages/${user_email}/vehiclePhoto.jpeg`, { encoding: 'base64' }, (err, vehiclePhoto) => {
                if (err) return console.log(err)

                fs.readFile(`public/driverImages/${user_email}/driverLicense.jpeg`, { encoding: 'base64' }, (err, licensePhoto) => {
                    if (err) return console.log(err)

                    requestInfo = Object.assign(requestInfo, {
                        vehicle_model: result[0].car_model,
                        vehicle_year: result[0].car_year,
                        vehicle_color: result[0].car_color,
                        vehicle_vin: result[0].car_vin,
                        vehicle_photo: [{
                            "content": `data:image/jpeg;base64,${vehiclePhoto}`,
                            "name": "vehiclePhoto.jpeg",
                            "type": "image/jpeg",
                        }],
                        vehicle_number: result[0].car_number,
                        license_exp_date: exp_date,
                        license_issue_country: result[0].driver_license_issue_country,
                        license_photo: [{
                            "content": `data:image/jpeg;base64,${licensePhoto}`,
                            "name": "licensePhoto.jpeg",
                            "type": "image/jpeg",
                        }],
                        request_status: result[0].status,
                        user_name: result[0].user_name,
                    })
                    res.send(requestInfo)
                })
            })
        }
        else {
            res.send(requestInfo)
        }
    })
})

app.post('/updateDriverInfo', (req, res) => {
    const requestForm = req.body.requestForm

    let sqlQuery = 'INSERT INTO driver_update (driver_email, car_model, car_year, car_color, car_vin, car_number, driver_license_exp_date, driver_license_issue_country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

    db.query(sqlQuery, [requestForm.user_email, requestForm.vehicle_model, requestForm.vehicle_year, requestForm.vehicle_color, requestForm.vehicle_vin, requestForm.vehicle_number, requestForm.license_exp_date, requestForm.license_issue_country], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {

            sqlQuery = "UPDATE drivers SET status = 'Update' WHERE driver_email = ?"

            db.query(sqlQuery, [requestForm.user_email], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    if (requestForm.vehicle_photo || requestForm.license_photo) {

                        const userDirectory = `public/driverImages/${requestForm.user_email}`;

                        if (requestForm.vehicle_photo) {
                            const vehiclePhoto = requestForm.vehicle_photo.content.split(';base64,').pop();

                            fs.writeFile(`${userDirectory}/updateVehiclePhoto.${requestForm.vehicle_photo.type.split('/')[1]}`, vehiclePhoto, 'base64', async (err) => {
                                if (err) return console.log(`Error saving vehicle photo : ${err}`)

                                if (requestForm.vehicle_photo.type !== "image/jpeg") {
                                    await convertToJpeg(`${userDirectory}/updateVehiclePhoto.${requestForm.vehicle_photo.type.split('/')[1]}`, `${userDirectory}/updateVehiclePhoto.jpeg`)
                                }
                            });
                        }

                        if (requestForm.license_photo) {
                            const licensePhoto = requestForm.license_photo.content.split(';base64,').pop();

                            fs.writeFile(`${userDirectory}/updateDriverLicense.${requestForm.license_photo.type.split('/')[1]}`, licensePhoto, 'base64', async (err) => {
                                if (err) return console.log(`Error saving license photo : ${err}`)

                                if (requestForm.license_photo.type !== "image/jpeg") {
                                    await convertToJpeg(`${userDirectory}/updateDriverLicense.${requestForm.license_photo.type.split('/')[1]}`, `${userDirectory}/updateDriverLicense.jpeg`)
                                }
                            });
                        }
                    }
                }
            })

            res.send({ alert: true, status: true, msg: `Submit successfully` })
        }
        else {
            res.send({ alert: true, status: false, msg: `Error to update driver info` })
        }
    })

})

app.get('/getRewards', (req, res) => {
    const { type } = req.query
    const sqlQuery = type === "All" ? "SELECT * FROM rewards" : "SELECT * FROM rewards WHERE reward_status = 'Available'"
    let rewards = []

    db.query(sqlQuery, (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                rewards.push(result[i])
            }
            res.send(rewards)
        }
        else {
            res.send(rewards)
        }
    })
})

app.post('/redeemReward', (req, res) => {
    const { reward_id, reward_title, reward_points, user_email } = req.body

    let sqlQuery = "UPDATE rewards SET reward_available_num = CASE WHEN reward_available_num > 0 THEN reward_available_num - 1 ELSE reward_available_num END, reward_status = CASE WHEN reward_available_num = 0 THEN 'Unavailable' ELSE reward_status END WHERE id = ? AND reward_available_num > 0"

    db.query(sqlQuery, [reward_id], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            sqlQuery = `UPDATE users SET user_point = user_point - ${reward_points} WHERE user_email = ? AND user_point >= ${reward_points}`

            db.query(sqlQuery, [user_email], async (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    try {
                        const coupon_code = voucher_codes.generate({ length: 12, count: 1 })[0]
                        const QRImg = await QRCode.toDataURL(coupon_code)

                        // send mail with defined transport object
                        await transporter.sendMail({
                            from: {
                                name: "UniCarpool",
                                address: "chongminghong34@gmail.com"
                            },
                            to: user_email, // list of receivers
                            subject: `Here is your reward`, // Subject line
                            text: `You have redeemed reward ${reward_title} using ${reward_points} points`, // plain text body
                            attachments: [{
                                filename: 'reward-qr-code.png',
                                content: QRImg.split(';base64,').pop(),
                                encoding: 'base64'
                            }],
                            html: rewardEmailTemplate(reward_title, coupon_code)
                        });
                    }
                    catch (error) {
                        console.log(error)
                    }

                    res.send({ alert: true, status: true, msg: `Redeem successfully. Check your email` })
                }
                else {
                    res.send({ alert: true, status: false, msg: `No enough points` })
                }
            })
        }
        else {
            res.send({ alert: true, status: false, msg: `This reward is not available now` })
        }
    })
})

app.post('/saveMessage', async (req, res) => {
    let { data } = req.body

    if (data.message_type === 'photo') {
        const directory = `public/groupChatImages/${data.carpool_id}`;

        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true }); // Use recursive: true to create nested directories
        }

        const fileName = Date.now() + voucher_codes.generate({ length: 15, count: 1 })
        const fileExt = data.message_content.substring("data:image/".length, data.message_content.indexOf(";base64"));
        const photoData = data.message_content.split(';base64,').pop();

        try {
            await writeFileAsync(`${directory}/${fileName}.${fileExt}`, photoData, 'base64');
            data.message_content = `http://localhost:${process.env.PORT}/groupChatImages/${data.carpool_id}/${fileName}.${fileExt}`;
        } catch (err) {
            console.log(`Error saving chat photo : ${err}`);
            return res.status(500).send({ error: "Error saving chat photo" });
        }
    }

    const sqlQuery = "INSERT INTO chat (carpool_id, message_type, sender_email, message_content, dateTime) VALUES (?, ?, ?, ?, ?)"

    db.query(sqlQuery, [data.carpool_id, data.message_type, data.sender_email, data.message_content, data.dateTime], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            data["message_id"] = result.insertId
            res.send(data)
        }
    })
})

app.get("/getMyGroupChatGroups", (req, res) => {
    const user_email = req.query.user_email
    let myGroupChatGroups = []

    const sqlQuery = "SELECT group_members.carpool_id, carpools.carpool_title FROM group_members JOIN carpools ON group_members.carpool_id = carpools.id WHERE carpools.carpool_type = 'fromDriver' AND group_members.member_email = ?"

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0 ; i < result.length ; i++) {
                myGroupChatGroups.push(result[i])
            }
            res.send(myGroupChatGroups)
        }
        else {
            res.send(myGroupChatGroups)
        }
    })
})

app.get('/getMessageHistory', (req, res) => {
    const { groupID } = req.query
    let messages = []

    const sqlQuery = "SELECT * FROM chat WHERE carpool_id = ?"

    db.query(sqlQuery, [groupID], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            messages = result
            messages = messages.map((m) => { return { ...m, message_id: m.id, id: undefined }})
            res.send(messages)
        }
        else {
            res.send(messages)
        }
    })
})

app.get('/getUserList', (req, res) => {
    const sqlQuery = "SELECT * FROM users WHERE user_role != 'Admin'"

    db.query(sqlQuery, (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            res.send(result)
        }
        else {
            res.send([])
        }
    })
})

app.post('/updateUserStatus', (req, res) => {
    const { user_email, user_name, update_action } = req.body
    const update_status = update_action === 'Activate' ? "Active" : "InActive"
    let subjectLine = ""
    let content = ""

    if (update_action === "Activate") {
        subjectLine = "Your Account has been activated"
        content = "We are pleased to inform you that your account with UniCarpool has been successfully activated. You can now access all the features and benefits of your account.If you have any questions or need further assistance, please don't hesitate to reach out to us."
    }
    else {
        subjectLine = "UniCarpool Account Termination Notice"
        content = `We regret to inform you that your account has been terminated by the administrator. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>. We appreciate your understanding.`
    }

    const sqlQuery = "UPDATE users SET user_status = ? WHERE user_email = ?"

    db.query(sqlQuery, [update_status, user_email], async (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            try {
                // send mail with defined transport object
                await transporter.sendMail({
                    from: {
                        name: "UniCarpool",
                        address: "chongminghong34@gmail.com"
                    },
                    to: user_email, // list of receivers
                    subject: subjectLine, // Subject line
                    text: `${subjectLine} (${user_email})`, // plain text body
                    html: informEmailTemplate(content, user_name)
                });
                const msg = update_status === "Active" ? "Activate user successfully" : "Terminate user successfully"
                res.send({ alert: true, status: true, msg: msg })
            }
            catch (error) {
                console.log(error)
            }
        }
        else {
            res.send({ alert: true, status: false, msg: `Fail to ${update_action} user` })
        }
    })
})

app.get('/getRequests', (req, res) => {
    const sqlQuery = "SELECT * FROM drivers WHERE status != 'Accepted' AND status != 'Rejected'"

    db.query(sqlQuery, (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            res.send(result)
        }
        else {
            res.send([])
        }
    })
})

app.post('/handleBecomeDriverRequest', (req, res) => {
    const { type, user_email } = req.body

    let sqlQuery = `UPDATE drivers SET status = '${type}ed' WHERE driver_email = ?`
    let content = ""

    db.query(sqlQuery, [user_email], async (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            if (type === 'Accept') {
                sqlQuery = "UPDATE users SET user_role = 'Driver' WHERE user_email = ?"

                db.query(sqlQuery, [user_email], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        content = `We are pleased to inform you that your recent become driver request has been accepted. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`
                        try {
                            // send mail with defined transport object
                            await transporter.sendMail({
                                from: {
                                    name: "UniCarpool",
                                    address: "chongminghong34@gmail.com"
                                },
                                to: user_email, // list of receivers
                                subject: 'Become driver request Acceptance', // Subject line
                                text: `Become driver request Acceptance (${user_email})`, // plain text body
                                html: informEmailTemplate(content)
                            });
                            res.send({ status: true, msg: `Accept request successfully.` })
                        }
                        catch (error) {
                            console.log(error)
                        }
                    }
                    else {
                        res.send({ status: false, msg: `Fail to ${type} request.` })
                    }
                })
            }
            else {
                content = `We regret to inform you that your recent become driver request has been rejected. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`
                try {
                    // send mail with defined transport object
                    await transporter.sendMail({
                        from: {
                            name: "UniCarpool",
                            address: "chongminghong34@gmail.com"
                        },
                        to: user_email, // list of receivers
                        subject: 'Become driver request Rejection', // Subject line
                        text: `Become driver request Rejection (${user_email})`, // plain text body
                        html: informEmailTemplate(content)
                    });
                    res.send({ status: true, msg: `Reject request successfully.` })
                }
                catch (error) {
                    console.log(error)
                }
            }
        }
        else {
            res.send({ status: false, msg: `Fail to ${type} request.` })
        }
    })
})

app.get('/getDriverUpdateInfo', (req, res) => {
    const { user_email } = req.query
    let updateInfo = new Object()

    const sqlQuery = "SELECT * FROM driver_update WHERE driver_email = ?"

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {

            let exp_date = dayjs(result[0].driver_license_exp_date).utc();

            // Convert the datetime to UTC+8 timezone
            exp_date = exp_date.utcOffset(8 * 60);

            // Format the datetime value as desired
            exp_date = exp_date.format('YYYY-MM-DD');

            fs.readFile(`public/driverImages/${user_email}/updateVehiclePhoto.jpeg`, { encoding: 'base64' }, (err, vehiclePhoto) => {
                if (err) return console.log(err)

                fs.readFile(`public/driverImages/${user_email}/updateDriverLicense.jpeg`, { encoding: 'base64' }, (err, licensePhoto) => {
                    if (err) return console.log(err)

                    updateInfo = Object.assign(updateInfo, {
                        vehicle_model: result[0].car_model,
                        vehicle_year: result[0].car_year,
                        vehicle_color: result[0].car_color,
                        vehicle_vin: result[0].car_vin,
                        vehicle_photo: [{
                            "content": `data:image/jpeg;base64,${vehiclePhoto}`,
                            "name": "updateVehiclePhoto.jpeg",
                            "type": "image/jpeg",
                        }],
                        vehicle_number: result[0].car_number,
                        license_exp_date: exp_date,
                        license_issue_country: result[0].driver_license_issue_country,
                        license_photo: [{
                            "content": `data:image/jpeg;base64,${licensePhoto}`,
                            "name": "updateLicensePhoto.jpeg",
                            "type": "image/jpeg",
                        }],
                    })
                    res.send(updateInfo)
                })
            })
        }
        else {
            res.send(updateInfo)
        }
    })
})

app.post('/handleUpdateDriverInfoRequest', (req, res) => {
    const { type, user_email, newInfo } = req.body

    let sqlQuery = "DELETE FROM driver_update WHERE driver_email = ?"

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            if (type === "Accept") {
                sqlQuery = "UPDATE drivers SET car_model = ?, car_year = ?, car_color = ?, car_vin = ?, car_number = ?, driver_license_exp_date = ?, driver_license_issue_country = ?, status = 'Accepted' WHERE driver_email = ?"

                db.query(sqlQuery, [newInfo.vehicle_model, newInfo.vehicle_year, newInfo.vehicle_color, newInfo.vehicle_vin, newInfo.vehicle_number, newInfo.license_exp_date, newInfo.license_issue_country, user_email], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        fs.rename(`./public/driverImages/${user_email}/updateVehiclePhoto.jpeg`, `./public/driverImages/${user_email}/vehiclePhoto.jpeg`, (err) => {
                            if (err) return console.log(err)
                        })

                        fs.rename(`./public/driverImages/${user_email}/updateDriverLicense.jpeg`, `./public/driverImages/${user_email}/driverLicense.jpeg`, async (err) => {
                            if (err) return console.log(err)
                        })

                        content = `We are pleased to inform you that your recent update driver info request has been accepted. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`
                        try {
                            await transporter.sendMail({
                                from: {
                                    name: "UniCarpool",
                                    address: "chongminghong34@gmail.com"
                                },
                                to: user_email,
                                subject: 'Update Driver Info Request Acceptance',
                                text: `Update Driver Info Request Acceptance (${user_email})`,
                                html: informEmailTemplate(content)
                            });
                            res.send({ status: true, msg: `${type} update driver info request successfully.` })
                        }
                        catch (error) {
                            console.log(error)
                        }
                    }
                    else {
                        res.send({ status: false, msg: `Fail to ${type} update driver info request.` })
                    }
                })
            }
            else {
                sqlQuery = "UPDATE drivers SET status = 'Accepted' WHERE driver_email = ?"

                db.query(sqlQuery, [user_email], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        fs.unlink(`./public/driverImages/${user_email}/updateVehiclePhoto.jpeg`, (err) => {
                            if (err) return console.log(err)
                        })

                        fs.unlink(`./public/driverImages/${user_email}/updateDriverLicense.jpeg`, (err) => {
                            if (err) return console.log(err)
                        })

                        content = `We regret to inform you that your recent update driver info request has been rejected. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`
                        try {
                            await transporter.sendMail({
                                from: {
                                    name: "UniCarpool",
                                    address: "chongminghong34@gmail.com"
                                },
                                to: user_email,
                                subject: 'Update Driver Info Request Rejection',
                                text: `Update Driver Info Request Rejection (${user_email})`,
                                html: informEmailTemplate(content)
                            });
                            res.send({ status: true, msg: `${type} update driver info request successfully.` })
                        }
                        catch (error) {
                            console.log(error)
                        }
                    }
                    else {
                        res.send({ status: false, msg: `Fail to ${type} update driver info request.` })
                    }
                })
            }
        }
        else {
            res.send({ status: false, msg: `Fail to ${type} update driver info request.` })
        }
    })
})

app.post('/addReward', (req, res) => {
    const { rewardData } = req.body

    let sqlQuery = "INSERT INTO rewards (reward_title, reward_description, reward_category, reward_available_num, reward_redeem_points, reward_status) VALUES (?, ?, ?, ?, ?, ?)"

    db.query(sqlQuery, [rewardData.reward_title, rewardData.reward_description, rewardData.reward_category, rewardData.reward_available_num, rewardData.reward_redeem_points, 'Available', ], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            const insertedID = result.insertId
            let posterImage = rewardData.reward_poster ? `${insertedID}/poster.jpeg` : null
            let cardImage = rewardData.reward_card_image ? `${insertedID}/card.jpeg` : `Default/default${rewardData.reward_category}.png`

            const rewardDirectory = `public/rewardImages/${insertedID}`

            if (!fs.existsSync(rewardDirectory)) {
                fs.mkdirSync(rewardDirectory, { recursive: true })
            }

            if (rewardData.reward_poster || rewardData.reward_card_image) {
                if (rewardData.reward_poster) {
                    const poster = rewardData.reward_poster[0].content.split(';base64,').pop()
                    fs.writeFile(`${rewardDirectory}/poster.${rewardData.reward_poster[0].type.split('/')[1]}`, poster, 'base64', async (err) => {
                        if (err) return console.log(err)

                        if (rewardData.reward_poster[0].type !== "image/jpeg") {
                            await convertToJpeg(`${rewardDirectory}/poster.${rewardData.reward_poster[0].type.split('/')[1]}`, `${rewardDirectory}/poster.jpeg`)
                        }
                    })
                }

                if (rewardData.reward_card_image) {
                    const card = rewardData.reward_card_image[0].content.split(';base64,').pop()
                    fs.writeFile(`${rewardDirectory}/card.${rewardData.reward_card_image[0].type.split('/')[1]}`, card, 'base64', async (err) => {
                        if (err) return console.log(err)

                        if (rewardData.reward_card_image[0].type !== "image/jpeg") {
                            await convertToJpeg(`${rewardDirectory}/card.${rewardData.reward_card_image[0].type.split('/')[1]}`, `${rewardDirectory}/card.jpeg`)
                        }
                    })
                }
            }

            sqlQuery = 'UPDATE rewards SET reward_poster = ?, reward_card_image = ? WHERE id = ?'

            db.query(sqlQuery, [posterImage, cardImage, insertedID], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    res.send({ status: true, msg: `Add new reward successfully.` })
                }
                else {
                    res.send({ status: false, msg: `Fail to add new reward.` })
                }
            })
        }
        else {
            res.send({ status: false, msg: `Fail to add new reward.` })
        }
    })
})

app.post('/deleteReward', (req, res) => {
    const { reward_id } = req.body

    const sqlQuery = "DELETE FROM rewards WHERE id = ?"

    db.query(sqlQuery, [reward_id], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            const folderPath = `./public/rewardImages/${reward_id}`

            if (fs.existsSync(folderPath)) {
                fs.rm(folderPath, { recursive: true }, (err) => {
                    if (err) throw err
                })
            }
            res.send({ alert: true, status: true, msg: `Delete reward successfully` })
        }
        else {
            res.send({ alert: true, status: false, msg: `Fail to delete reward` })
        }
    })
})

app.post('/updateRewardAvailability', (req, res) => {
    const { reward_id, type } = req.body

    const sqlQuery = "UPDATE rewards SET reward_status = ? WHERE id = ? AND reward_available_num > 0"

    db.query(sqlQuery, [type, reward_id], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            res.send({ alert: true, status: true, msg: `Update reward's availability successfully` })
        }
        else {
            res.send({ alert: true, status: false, msg: `Cannot update reward status. Available numbers are depleted.` })
        }
    })
})

app.post('/editReward', (req, res) => {
    const { reward_id, newInfo } = req.body

    let sqlQuery = "UPDATE rewards SET reward_title = ?, reward_description = ?, reward_category = ?, reward_available_num = ?, reward_redeem_points = ?"

    if (newInfo.reward_poster) sqlQuery = sqlQuery.concat(`, reward_poster = '${reward_id}/poster.jpeg'`)
    if (newInfo.reward_card_image) sqlQuery = sqlQuery.concat(`, reward_card_image = '${reward_id}/card.jpeg'`)

    sqlQuery = sqlQuery.concat(" WHERE id = ?")

    db.query(sqlQuery, [newInfo.reward_title, newInfo.reward_description, newInfo.reward_category, newInfo.reward_available_num, newInfo.reward_redeem_points, reward_id], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            if (newInfo.reward_card_image) {
                const card = newInfo.reward_card_image[0].content.split(';base64,').pop()
                fs.writeFile(`public/rewardImages/${reward_id}/card.${newInfo.reward_card_image[0].type.split('/')[1]}`, card, 'base64', async (err) => {
                    if (err) return console.log(err)

                    if (newInfo.reward_card_image[0].type !== "image/jpeg") {
                        await convertToJpeg(`public/rewardImages/${reward_id}/card.${newInfo.reward_card_image[0].type.split('/')[1]}`, `public/rewardImages/${reward_id}/card.jpeg`)
                    }
                })
            }

            if (newInfo.reward_poster) {
                const poster = newInfo.reward_poster[0].content.split(';base64,').pop()
                fs.writeFile(`public/rewardImages/${reward_id}/poster.${newInfo.reward_poster[0].type.split('/')[1]}`, poster, 'base64', async (err) => {
                    if (err) return console.log(err)

                    if (newInfo.reward_poster[0].type !== "image/jpeg") {
                        await convertToJpeg(`public/rewardImages/${reward_id}/poster.${newInfo.reward_poster[0].type.split('/')[1]}`, `public/rewardImages/${reward_id}/poster.jpeg`)
                    }
                })
            }

            res.send({ status: true, msg: `Edit reward successfully.` })
        }
        else {
            res.send({ status: false, msg: `Fail to edit reward.` })
        }
    })
})

app.post('/sendResetPasswordEmail', (req, res) => {
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
                content = `A password change has been requested for your account. If this was you, please use the provided link to reset your password. <a href="http://localhost:3000/resetPassword/${user_email}/${uuid}/" style="font-weight:bold;">Reset password</a>`
                try {
                    await transporter.sendMail({
                        from: {
                            name: "UniCarpool",
                            address: "chongminghong34@gmail.com"
                        },
                        to: user_email,
                        subject: 'Change password for UniCarpool',
                        text: `Change password for UniCarpool (${user_email})`,
                        html: informEmailTemplate(content)
                    });
                }
                catch (error) {
                    console.log(error)
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
})

app.get('/checkResetPasswordAccessibility', (req, res) => {
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
})

app.post('/resetPassword', (req, res) => {
    const { user_email, form_passwords } = req.body

    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/

    if (form_passwords["password"] !== form_passwords["confirmPassword"]) {
        res.send({ alert: true, status: false, msg: 'Password and Confirm Password must match' })
    }
    else if (!pwdRegex.test(form_passwords["confirmPassword"])) {
        res.send({ alert: true, status: false, msg: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' })
    }
    else {
        bcrypt.hash(form_passwords["confirmPassword"], saltRounds, (err, hash) => {
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
})

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});