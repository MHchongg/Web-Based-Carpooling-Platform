const express = require('express')
const { requestToJoinCarpool, getMyCarpoolJoinRequest, getMyJoinRequests, updateJoinRequest } = require('../controllers/joinRequestController')
const { verifyToken, verifyAccessRights } = require('../middlewares/authMiddleware')
const router = express.Router()

router.post('/', verifyToken, verifyAccessRights, requestToJoinCarpool)
router.get('/myCarpools', verifyToken, getMyCarpoolJoinRequest)
router.get('/myJoinRequests', verifyToken, verifyAccessRights, getMyJoinRequests)
router.patch('/updateJoinRequest', verifyToken, updateJoinRequest)

module.exports = router
