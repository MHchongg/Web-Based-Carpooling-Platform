const db = require('../config/db')
const libphonenumber = require('libphonenumber-js')
const { convertToJpeg } = require('../utils/sharp')
const { sendInformEmail } = require('../utils/email')
const fs = require('fs')

const fetchUserInfo = (req, res) => {
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
}

const updatePhoneNum = (req, res) => {
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
}

const updateDriverInfo = (req, res) => {
    const requestForm = req.body.requestForm
    const user_email = req.body.user_email

    let sqlQuery = 'INSERT INTO driver_update (driver_email, car_model, car_year, car_color, car_vin, car_number, driver_license_exp_date, driver_license_issue_country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'

    db.query(sqlQuery, [user_email, requestForm.vehicle_model, requestForm.vehicle_year, requestForm.vehicle_color, requestForm.vehicle_vin, requestForm.vehicle_number, requestForm.license_exp_date, requestForm.license_issue_country], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {

            sqlQuery = "UPDATE drivers SET status = 'Update' WHERE driver_email = ?"

            db.query(sqlQuery, [user_email], (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    if (requestForm.vehicle_photo || requestForm.license_photo) {

                        const userDirectory = `public/driverImages/${user_email}`;

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
}

const getUsers = (req, res) => {
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
}

const updateUserStatus = (req, res) => {
    const { user_email, user_name, update_action } = req.body
    const update_status = update_action === 'Activate' ? "Active" : "InActive"
    let emailInfo = new Object()

    if (update_action === "Activate") {
        emailInfo["subject"] = "Your Account has been activated"
        emailInfo["text"] = "Your Account has been activated"
        emailInfo["content"] = "We are pleased to inform you that your account with UniCarpool has been successfully activated. You can now access all the features and benefits of your account.If you have any questions or need further assistance, please don't hesitate to reach out to us."
    }
    else {
        emailInfo["subject"] = "UniCarpool Account Termination Notice"
        emailInfo["text"] = "UniCarpool Account Termination Notice"
        emailInfo["content"] = `We regret to inform you that your account has been terminated by the administrator. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>. We appreciate your understanding.`
    }

    const sqlQuery = "UPDATE users SET user_status = ? WHERE user_email = ?"

    db.query(sqlQuery, [update_status, user_email], async (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            let response = await sendInformEmail(user_email, emailInfo, user_name)

            if (response.status) {
                response["msg"] = update_status === "Active" ? "Activate user successfully" : "Terminate user successfully"
                return res.send(response)
            }

            res.send(response)
        }
        else {
            res.send({ alert: true, status: false, msg: `Fail to ${update_action} user` })
        }
    })
}

module.exports = {
    fetchUserInfo,
    updatePhoneNum,
    updateDriverInfo,
    getUsers,
    updateUserStatus,
}