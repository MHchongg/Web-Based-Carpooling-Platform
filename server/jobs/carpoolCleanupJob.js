const cron = require("node-cron")
const db = require('../config/db')

const carpoolCleanupJob = () => {
    // Update carpool status every hour
    cron.schedule('0 * * * *', () => {
        const sqlQuery = `UPDATE carpools SET carpool_status = CASE WHEN carpool_status = "available" THEN "Expired" ELSE carpool_status END WHERE carpool_dateTime < NOW()`
        db.query(sqlQuery, (err, result) => {
            if (err) return console.log(err)
        })
    })

    // Delete expired carpools at 11:59 PM daily
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
}

module.exports = carpoolCleanupJob
