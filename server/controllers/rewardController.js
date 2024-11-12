const db = require('../config/db')
const { convertToJpeg } = require('../utils/sharp')
const { sendRewardEmail } = require('../utils/email')
const fs = require('fs')

const getRewards = (req, res) => {
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
}

const redeemReward = (req, res) => {
    const { reward_id, reward_title, reward_points, user_email } = req.body

    let sqlQuery = "UPDATE rewards SET reward_available_num = CASE WHEN reward_available_num > 0 THEN reward_available_num - 1 ELSE reward_available_num END, reward_status = CASE WHEN reward_available_num = 0 THEN 'Unavailable' ELSE reward_status END WHERE id = ? AND reward_available_num > 0"

    db.query(sqlQuery, [reward_id], (err, result) => {
        if (err) return console.log(err)

        if (result.affectedRows === 1) {
            sqlQuery = `UPDATE users SET user_point = user_point - ${reward_points} WHERE user_email = ? AND user_point >= ${reward_points}`

            db.query(sqlQuery, [user_email], async (err, result) => {
                if (err) return console.log(err)

                if (result.affectedRows === 1) {
                    const rewardInfo = {
                        'reward_title': reward_title,
                        'reward_points': reward_points
                    }
                    const response = await sendRewardEmail(user_email, rewardInfo)
                    res.send(response)
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
}

const addReward = (req, res) => {
    const { rewardData } = req.body

    let sqlQuery = "INSERT INTO rewards (reward_title, reward_description, reward_category, reward_available_num, reward_redeem_points, reward_status) VALUES (?, ?, ?, ?, ?, ?)"

    db.query(sqlQuery, [rewardData.reward_title, rewardData.reward_description, rewardData.reward_category, rewardData.reward_available_num, rewardData.reward_redeem_points, 'Available',], (err, result) => {
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
}

const deleteReward = (req, res) => {
    const reward_id = req.query.reward_id

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
}

const updateRewardAvailability = (req, res) => {
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
}

const editReward = (req, res) => {
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
}

module.exports = {
    getRewards,
    redeemReward,
    addReward,
    deleteReward,
    updateRewardAvailability,
    editReward,
}