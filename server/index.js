const express = require("express")
const app = express()
const http = require("http")
const cors = require("cors")
const bodyParser = require('body-parser')

const authRoutes = require('./routes/authRoutes')
const carpoolRoutes = require('./routes/carpoolRoutes')
const joinRequestRoutes = require('./routes/joinRequestRoutes')
const userRoutes = require('./routes/userRoutes')
const rewardRoutes = require('./routes/rewardRoutes')
const ratingRoutes = require('./routes/ratingRoutes')
const groupChatRoutes = require('./routes/groupChatRoutes')
const driverRequestRoutes = require('./routes/driverRequestRoutes')

const setupSocket = require('./socket/chatSocket')
const carpoolCleanupJob = require('./jobs/carpoolCleanupJob')

require('dotenv').config()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.json())
app.use(express.static('public'))

const server = http.createServer(app)

setupSocket(server)
carpoolCleanupJob()

app.use('/api/auth', authRoutes)
app.use('/api/carpool', carpoolRoutes)
app.use('/api/joinRequest', joinRequestRoutes)
app.use('/api/user', userRoutes)
app.use('/api/reward', rewardRoutes)
app.use('/api/rating', ratingRoutes)
app.use('/api/groupChat', groupChatRoutes)
app.use('/api/driverRequest', driverRequestRoutes)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});