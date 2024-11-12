const db = require('../config/db')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { sendGeneralEmail } = require('../utils/email')
const { searchNearbyCarpools } = require('../utils/searchCarpools')
const { v4: uuidv4 } = require('uuid')

dayjs.extend(utc)

const postCarpool = async (req, res) => {
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
}

const getCarpools = (req, res) => {

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
}

const getMyCarpools = (req, res) => {
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
}

const getCarpoolMembers = (req, res) => {
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
}

const getDriverGroups = async (req, res) => {
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
}

const exitCarpool = (req, res) => {
    const user_email = req.query.user_email
    const driver_email = req.query.driver_email
    let carpoolInfo = JSON.parse(req.query.carpoolInfo)

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

                                let response = { alert: true, status: true, msg: `Exit carpool successfully` }
                                if (driver_email !== null) {
                                    carpoolInfo['user_email'] = user_email
                                    response = await sendGeneralEmail(driver_email, carpoolInfo, 'Exit')
                                }

                                res.send(response)
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
}

const formCarpool = async (req, res) => {
    const { user_name, user_email, member_email } = req.body
    let { carpoolInfo } = req.body

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
                            carpoolInfo['user_email'] = user_email
                            const response = await sendGeneralEmail(member_email, carpoolInfo, 'FormCarpool')
                            res.send(response)
                        }
                    })
                }
            })
        }
    })
}

const searchCarpools = async (req, res) => {
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
}

const updateCarpoolStatus = async (req, res) => {
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
                carpoolInfo = {
                    'carpool_title': carpool_title,
                    'carpool_from': carpool_from,
                    'carpool_to': carpool_to,
                    'carpool_dateTime': carpool_dateTime,
                    'nowDateTime': nowDateTime
                }

                await sendGeneralEmail(members_email, carpoolInfo, 'Depart')

                sqlQuery = "SELECT * FROM join_requests WHERE carpool_id = ?"

                db.query(sqlQuery, [carpool_id], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.length > 0) {
                        const user_emails = result.map(user => user.user_email)

                        await sendGeneralEmail(user_emails, carpoolInfo, 'RejectRequest')

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

                        for (let i = 0; i < members_email.length; i++) {
                            const uuid = uuidv4()

                            const carpoolInfo = {
                                'carpool_title': carpool_title,
                                'carpool_from': carpool_from,
                                'carpool_to': carpool_to,
                                'carpool_dateTime': carpool_dateTime,
                                'nowDateTime': nowDateTime,
                                'rateLink': `http://localhost:3000/rateMembers/${carpool_id}/${members_email[i]}/${uuid}/`
                            }

                            await sendGeneralEmail(members_email[i], carpoolInfo, 'End')

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
}

module.exports = {
    postCarpool,
    getCarpools,
    getMyCarpools,
    getCarpoolMembers,
    getDriverGroups,
    exitCarpool,
    formCarpool,
    searchCarpools,
    updateCarpoolStatus,
}