const db = require('../config/db')

const checkAccessForRating = (req, res) => {
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
                    res.send({ access: false, isRated: false })
                }
            })
        }
        else {
            res.send({ access: false, isRated: false })
        }
    })
}

const submitRatings = (req, res) => {
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
}

module.exports = {
    checkAccessForRating,
    submitRatings,
}