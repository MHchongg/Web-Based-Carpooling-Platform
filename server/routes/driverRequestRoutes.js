const express = require('express')
const { requestBecomeDriver, getBecomeDriverReqStatus, updateBecomeDriverRequest, getRequests, getDriverUpdateInfo, handleUpdateDriverInfoRequest } = require('../controllers/driverRequestController')
const { verifyToken, verifyAccessRights, verifyAdmin } = require('../middlewares/authMiddleware')
const router = express.Router()

router.post('/requestBecomeDriver', verifyToken, requestBecomeDriver)
router.get('/getBecomeDriverReqStatus', verifyToken, verifyAccessRights, getBecomeDriverReqStatus)
router.patch('/updateBecomeDriverRequest', verifyToken, verifyAdmin, updateBecomeDriverRequest)
router.get('/getRequests', verifyToken, verifyAdmin, getRequests)
router.get('/getDriverUpdateInfo', verifyToken, verifyAdmin, getDriverUpdateInfo)
router.patch('/handleUpdateDriverInfoRequest', verifyToken, verifyAdmin, handleUpdateDriverInfoRequest)

module.exports = router
