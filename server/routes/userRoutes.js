const express = require('express')
const { fetchUserInfo, updatePhoneNum, updateDriverInfo, getUsers, updateUserStatus } = require('../controllers/userController')
const { verifyToken, verifyAccessRights, verifyAdmin } = require('../middlewares/authMiddleware')
const router = express.Router()

router.get('/', verifyToken, fetchUserInfo)
router.patch('/updatePhoneNum', verifyToken, verifyAccessRights, updatePhoneNum)
router.patch('/updateDriverInfo', verifyToken, verifyAccessRights, updateDriverInfo)
router.get('/getUsers', verifyToken, verifyAdmin, getUsers)
router.patch('/updateUserStatus', verifyToken, verifyAdmin, updateUserStatus)

module.exports = router
