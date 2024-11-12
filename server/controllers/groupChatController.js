const db = require('../config/db')
const fs = require('fs')
const voucher_codes = require('voucher-code-generator')
const { promisify } = require('util')
const writeFileAsync = promisify(fs.writeFile)

const saveMessage = async (req, res) => {
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
}

const getMyGroupChatGroups = (req, res) => {
    const user_email = req.query.user_email
    let myGroupChatGroups = []

    const sqlQuery = "SELECT group_members.carpool_id, carpools.carpool_title FROM group_members JOIN carpools ON group_members.carpool_id = carpools.id WHERE carpools.carpool_type = 'fromDriver' AND group_members.member_email = ?"

    db.query(sqlQuery, [user_email], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                myGroupChatGroups.push(result[i])
            }
            res.send(myGroupChatGroups)
        }
        else {
            res.send(myGroupChatGroups)
        }
    })
}

const getMessageHistory = (req, res) => {
    const { groupID } = req.query
    let messages = []

    const sqlQuery = "SELECT * FROM chat WHERE carpool_id = ?"

    db.query(sqlQuery, [groupID], (err, result) => {
        if (err) return console.log(err)

        if (result.length > 0) {
            messages = result
            messages = messages.map((m) => { return { ...m, message_id: m.id, id: undefined } })
            res.send(messages)
        }
        else {
            res.send(messages)
        }
    })
}

module.exports = {
    saveMessage,
    getMyGroupChatGroups,
    getMessageHistory,
}