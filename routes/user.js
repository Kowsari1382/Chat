const express = require('express')
const router = express.Router()
const UserController = require('../controllers/user-controller')
const Auth = require('../middlewares/Auth')
const CheckAdmin = require('../middlewares/CheckAdmin')

router.get('/all', Auth, CheckAdmin, UserController.getUsers)
router.get('/id/:userid', Auth, UserController.getUserByUserID)
router.get('/username/:username', Auth, UserController.getUserByUsername)
router.get('/number/:number', Auth, UserController.getUserByNumber)
router.get('/link/:link', Auth, UserController.getUserByLink)
router.post('/register', UserController.Register)
router.post('/login', UserController.Login)
router.post('/add', Auth, CheckAdmin, UserController.AddUser)
router.put('/update', Auth, UserController.UpdateUser)
router.delete('/delete/:userid', Auth, UserController.DeleteUser)

module.exports = router