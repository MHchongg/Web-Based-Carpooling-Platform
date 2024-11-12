const express = require('express')
const { saveMessage, getMyGroupChatGroups, getMessageHistory } = require('../controllers/groupChatController')
const { verifyToken, verifyAccessRights } = require('../middlewares/authMiddleware')
const router = express.Router()

router.post('/saveMessage', verifyToken, saveMessage)
router.get('/getMyGroupChatGroups', verifyToken, verifyAccessRights, getMyGroupChatGroups)
router.get('/getMessageHistory', verifyToken, getMessageHistory)

module.exports = router
