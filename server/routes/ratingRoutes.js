const express = require('express')
const { checkAccessForRating, submitRatings } = require('../controllers/ratingController')
const router = express.Router()

router.get('/', checkAccessForRating)
router.post('/submitRatings', submitRatings)

module.exports = router
