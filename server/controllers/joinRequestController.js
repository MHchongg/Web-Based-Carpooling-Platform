const db = require('../config/db')
const { sendGeneralEmail } = require('../utils/email')

const requestToJoinCarpool = async (req, res) => {
    const { user_email, user_name, driver_email } = req.body
    let { carpoolInfo } = req.body

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
                                    carpoolInfo["user_email"] = user_email
                                    const response = await sendGeneralEmail(driver_email, carpoolInfo, 'JoinRequest')
                                    res.send(response)
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}

const getMyCarpoolJoinRequest = async (req, res) => {
    const member_email = req.query.member_email
    let myDriverGroup = []
    let joinRequests = []

    let sqlQuery = 'SELECT carpool_id FROM group_members WHERE member_email = ? AND isDriver = ?'

    db.query(sqlQuery, [member_email, 1], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
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
}

const getMyJoinRequests = (req, res) => {
    const user_email = req.query.user_email
    let myJoinRequests = []

    const sqlQuery = `SELECT carpool_id, request_status FROM join_requests WHERE user_email = ?`

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
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
}

const updateJoinRequest = (req, res) => {
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
                                                    const response = await sendGeneralEmail(member_email, carpoolInfo, 'AcceptRequest')
                                                    res.send(response)
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
                            const response = await sendGeneralEmail(member_email, carpoolInfo, 'RejectRequest')
                            res.send(response)
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
}

module.exports = {
    requestToJoinCarpool,
    getMyCarpoolJoinRequest,
    getMyJoinRequests,
    updateJoinRequest,
}