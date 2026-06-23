const CheckAdmin = (req, res, next) => {
    if(req.UserData.Role === 'User'){
        return res.status(403).send('Acceess is denied')
    }
    else if(req.UserData.Role === 'Admin'){
        next()
    }
}

module.exports = CheckAdmin