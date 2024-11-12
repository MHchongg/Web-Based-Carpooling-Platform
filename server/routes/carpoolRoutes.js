const express = require('express')
const { postCarpool, getCarpools, getMyCarpools, getCarpoolMembers, getDriverGroups, exitCarpool, formCarpool, searchCarpools, updateCarpoolStatus } = require('../controllers/carpoolController')
const { verifyToken, verifyAccessRights } = require('../middlewares/authMiddleware')
const router = express.Router()

router.post('/postCarpool', verifyToken, postCarpool)
router.get('/', verifyToken, getCarpools)
router.get('/myCarpools', verifyToken, getMyCarpools)
router.get('/carpoolMembers', verifyToken, getCarpoolMembers)
router.get('/driverGroups', verifyToken, getDriverGroups)
router.delete('/exitCarpool', verifyToken, verifyAccessRights, exitCarpool)
router.post('/formCarpool', verifyToken, verifyAccessRights, formCarpool)
router.get('/searchCarpools', verifyToken, searchCarpools)
router.patch('/updateCarpoolStatus', verifyToken, updateCarpoolStatus)

module.exports = router
