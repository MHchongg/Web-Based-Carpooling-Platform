const db = require('../config/db')
const { convertToJpeg } = require('../utils/sharp')
const fs = require('fs')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { sendInformEmail } = require('../utils/email')

dayjs.extend(utc)

const requestBecomeDriver = (req, res) => {
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

    db.query(sqlQuery, [requestForm.vehicle_model, requestForm.vehicle_year, requestForm.vehicle_color, requestForm.vehicle_vin, requestForm.vehicle_car_num, requestForm.license_exp_date, requestForm.license_issue_country], (err, result) => {
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
}

const getBecomeDriverReqStatus = (req, res) => {
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
}

const updateBecomeDriverRequest = (req, res) => {
    const { type, user_email } = req.body

    let sqlQuery = `UPDATE drivers SET status = '${type}ed' WHERE driver_email = ?`

    db.query(sqlQuery, [user_email], async (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            if (type === 'Accept') {
                sqlQuery = "UPDATE users SET user_role = 'Driver' WHERE user_email = ?"

                db.query(sqlQuery, [user_email], async (err, result) => {
                    if (err) return console.log(err)

                    if (result.affectedRows === 1) {
                        const emailInfo = {
                            "content": `We are pleased to inform you that your recent become driver request has been accepted. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`,
                            "subject": 'Become driver request Acceptance',
                            "text": `Become driver request Acceptance (${user_email})`
                        }

                        let response = await sendInformEmail(user_email, emailInfo)

                        if (response.status) {
                            response["msg"] = `Accept request successfully.`
                            return res.send(response)
                        }

                        res.send(response)
                    }
                    else {
                        res.send({ status: false, msg: `Fail to ${type} request.` })
                    }
                })
            }
            else {
                const emailInfo = {
                    "content": `We regret to inform you that your recent become driver request has been rejected. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`,
                    "subject": 'Become driver request Rejection',
                    "text": `Become driver request Rejection (${user_email})`
                }

                let response = await sendInformEmail(user_email, emailInfo)

                if (response.status) {
                    response["msg"] = `Reject request successfully.`
                    return res.send(response)
                }

                res.send(response)
            }
        }
        else {
            res.send({ status: false, msg: `Fail to ${type} request.` })
        }
    })
}

const getRequests = (req, res) => {
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
}

const getDriverUpdateInfo = (req, res) => {
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
}

const handleUpdateDriverInfoRequest = (req, res) => {
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

                        const emailInfo = {
                            "content": `We are pleased to inform you that your recent update driver info request has been accepted. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`,
                            "subject": 'Update Driver Info Request Acceptance',
                            "text": `Update Driver Info Request Acceptance (${user_email})`
                        }

                        let response = await sendInformEmail(user_email, emailInfo)

                        if (response.status) {
                            response["msg"] = `${type} update driver info request successfully.`
                            return res.send(response)
                        }

                        res.send(response)
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

                        const emailInfo = {
                            "content": `We regret to inform you that your recent update driver info request has been rejected. If you have any inquiries or wish to discuss this further, please feel free to reach out to us at <a href="mailto:chongminghong34@gmail.com"> Admin's email</a>.`,
                            "subject": 'Update Driver Info Request Rejection',
                            "text": `Update Driver Info Request Rejection (${user_email})`
                        }

                        let response = await sendInformEmail(user_email, emailInfo)

                        if (response.status) {
                            response["msg"] = `${type} update driver info request successfully.`
                            return res.send(response)
                        }

                        res.send(response)
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
}

module.exports = {
    requestBecomeDriver,
    getBecomeDriverReqStatus,
    updateBecomeDriverRequest,
    getRequests,
    getDriverUpdateInfo,
    handleUpdateDriverInfoRequest,
}