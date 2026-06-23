const JWT = require('jsonwebtoken')

const Auth = (req, res, next) => {
    const token = req.header('Authorization')
    if (!token) return res.status(400).send('Access is denied')
    try {
        req.UserData = JWT.verify(token, process.env.SECRET_KEY)
        next()
    } catch (error) {
        res.status(400).send('Token is invalid')
    }
}

module.exports = Auth