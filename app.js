const express = require('express')
const http = require('http')
require('dotenv').config()
const socket = require('socket.io')
const helmet = require('helmet')
const expressRateLimit = require('express-rate-limit')
const emitLimiter = require('rate-limiter-flexible')
const UserRouter = require('./routes/user')
const jwt = require('jsonwebtoken')
const event = require('./events')
const cors = require('cors')

const rateLimit = expressRateLimit.rateLimit({
    windowMs: 1000 * 60,
    max: 20,
    message: 'Too many request!'
})

const rateLimiter = new emitLimiter.RateLimiterMemory({
    points: 5,
    duration: 1
})

const app = express()
const server = http.createServer(app)
const io = new socket.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}))
app.set('trust proxy', 1)
app.use(rateLimit)
app.use(helmet())
app.use(express.json())
app.use(express.static('public'))

app.use('/api/user', UserRouter)

io.use(async (socket, next) => {
    const token = socket.handshake.query.token
    if (!token) return next(new Error('No authentication'))
    try {
        socket.UserData = jwt.verify(token, process.env.SEKRET_KEY)
        next()
    }
    catch (error) {
        return next(new Error('No valid token'))
    }
})

io.on('connection', (socket) => {

    event.events(io, socket, rateLimiter)

})

server.listen((process.env.PORT || 3000), (error) => {
    if (error) return console.log(error)
    console.log('Server is running on port: ' + (process.env.PORT || 3000))
})