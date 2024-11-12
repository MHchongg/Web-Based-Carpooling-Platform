const express = require('express')
const { getRewards, redeemReward, addReward, deleteReward, updateRewardAvailability, editReward } = require('../controllers/rewardController')
const { verifyToken, verifyAccessRights, verifyAdmin } = require('../middlewares/authMiddleware')
const router = express.Router()

router.get('/', verifyToken, getRewards)
router.patch('/redeemReward', verifyToken, verifyAccessRights, redeemReward)
router.post('/addReward', verifyToken, verifyAdmin, addReward)
router.delete('/deleteReward', verifyToken, verifyAdmin, deleteReward)
router.patch('/updateRewardAvailability', verifyToken, verifyAdmin, updateRewardAvailability)
router.put('/editReward', verifyToken, verifyAdmin, editReward)

module.exports = router
