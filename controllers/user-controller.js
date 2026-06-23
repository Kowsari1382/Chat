const UserModel = require('../models/user-model')
const TryCatchController = require('../utilities/TryCatchController')
const joi = require('joi')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const _ = require('lodash')

const getUsers = TryCatchController(async (req, res, next) => {
    if (req.UserData.Role !== 'Admin') return res.status(400).send('You do not have premission to access to this part.')
    const Users = await UserModel.getUsers()
    if (!Users || Users.length === 0) return res.send('There is no any user in database')
    return res.send(Users)
})

const getUserByUserID = TryCatchController(async (req, res, next) => {
    const schema = {
        userid: joi.number().required()
    }
    const Validation = joi.object(schema).validate(req.params)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByID(req.params.userid)
    let Picked = []
    for (let i = 0; i < User.length; i++) {
        Picked.push(_.pick(User[i], ['UserID', 'Username', 'Link', 'Bio']))
    }
    return res.send(Picked)
})

const getUserByUsername = TryCatchController(async (req, res, next) => {
    const schema = {
        username: joi.string().min(5).max(30).required()
    }
    const Validation = joi.object(schema).validate(req.params)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByUsername(req.params.username)
    let Picked = []
    for (let i = 0; i < User.length; i++) {
        Picked.push(_.pick(User[i], ['UserID', 'Username', 'Link', 'Bio']))
    }
    return res.send(Picked)
})

const getUserByNumber = TryCatchController(async (req, res, next) => {
    const schema = {
        number: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.params)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByNumber(req.params.number)
    let Picked = []
    for (let i = 0; i < User.length; i++) {
        Picked.push(_.pick(User[i], ['UserID', 'Username', 'Link', 'Bio']))
    }
    return res.send(Picked)
})

const getUserByLink = TryCatchController(async (req, res, next) => {
    const schema = {
        link: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.params)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByLink(req.params.link)
    let Picked = []
    for (let i = 0; i < User.length; i++) {
        Picked.push(_.pick(User[i], ['UserID', 'Username', 'Link', 'Bio']))
    }
    return res.send(Picked)
})

const AddUser = TryCatchController(async (req, res, next) => {
    const schema = {
        username: joi.string().min(5).max(30).required(),
        password: joi.string().min(8).max(30).required(),
        publickey: joi.string().required(),
        email: joi.string().email(),
        number: joi.string().required(),
        bio: joi.string().max(100),
        role: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.body)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    if (req.UserData.Role !== 'Admin') return res.status(400).send('You do not have premission to access to this part.')
    const User = await UserModel.getUserByNumber(req.body.number)
    if (User && User.length > 0) return res.status(400).end('There is a user with this number already.')
    const Password = await bcrypt.hash(req.body.password, 10)
    if (req.body.role === 'User') {
        await UserModel.AddUser(req.body.username, Password, null, null, req.body.email, req.body.number, 'User', req.body.publickey)
        return res.send(req.body)
    }
    else {
        await UserModel.AddUser(req.body.username, Password, null, null, req.body.email, req.body.number, 'Admin', req.body.publickey)
        return res.send(req.body)
    }
})

const UpdateUser = TryCatchController(async (req, res, next) => {
    const schema = {
        userid: joi.number().required(),
        username: joi.string().min(5).max(30).required(),
        password: joi.string().min(8).max(30).required(),
        email: joi.string().email(),
        number: joi.string().required(),
        bio: joi.string().max(100),
        role: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.body)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    if (req.UserData.UserID != req.body.userid && req.UserData.Role !== 'Admin') return res.status(400).send('You do not have premission to access to this part.')
    const User = await UserModel.getUserByID(req.body.userid)
    if (!User || User.length === 0) return res.status(400).end('There is not a user with this user id.')
    const Other = await UserModel.getUserByNumber(req.body.number)
    if (Other && Other.length > 0) return res.status(400).end('There is a user with this number already.')
    const Password = await bcrypt.hash(req.body.password, 10)
    if (req.UserData.Role === 'Admin') await UserModel.UpdateUser(req.body.userid, req.body.username, Password, null, null, req.body.email, req.body.number, req.body.role)
    else if (req.UserData.Role === 'User') await UserModel.UpdateUser(req.body.userid, req.body.username, Password, null, null, req.body.email, req.body.number, 'User')
    return res.send(req.body)
})

const DeleteUser = TryCatchController(async (req, res, next) => {
    const schema = {
        userid: joi.number().required()
    }
    const Validation = joi.object(schema).validate(req.params)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    if (req.UserData.UserID != req.params.userid && req.UserData.Role !== 'Admin') return res.status(400).send('You do not have premission to access to this part.')
    const User = await UserModel.getUserByID(req.params.userid)
    if (!User || User.length === 0) return res.status(400).end('There is not a user with this user id.')
    await UserModel.DeleteUser(req.params.userid)
    res.send('Deleted.')
})

const Register = TryCatchController(async (req, res, next) => {
    const schema = {
        username: joi.string().min(5).max(30).required(),
        password: joi.string().min(8).max(30).required(),
        publickey: joi.string().required(),
        email: joi.string().email(),
        number: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.body)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByNumber(req.body.number)
    if (User && User.length > 0) return res.status(400).end('There is a user with this number already.')
    const Password = await bcrypt.hash(req.body.password, 10)
    await UserModel.AddUser(req.body.username, Password, null, null, req.body.email, req.body.number, 'User', req.body.publickey)
    const UserID = (await UserModel.getUserByNumber(req.body.number))[0].UserID
    const Token = jwt.sign({ UserID: UserID, Username: req.body.username, Number: req.body.number, Role: 'User', PublicKey: req.body.publickey}, process.env.SEKRET_KEY)
    res.header('Authentication', Token).send('You registered.')
})

const Login = TryCatchController(async (req, res, next) => {
    const schema = {
        username: joi.string().min(5).max(30).required(),
        password: joi.string().min(8).max(30).required(),
        number: joi.string().required()
    }
    const Validation = joi.object(schema).validate(req.body)
    if (Validation.error) return res.status(400).send(Validation.error.details[0].message)
    const User = await UserModel.getUserByNumber(req.body.number)
    if (!User || User.length === 0) return res.status(400).send('There is not a user with this number.')
    const auth = await bcrypt.compare(req.body.password, User[0].Password)
    if (!auth) return res.status(400).send('Username or password is wrong.')
    let Role = null
    if (User[0].Role === 'User') Role = 'User'
    else if (User[0].Role === 'Admin') Role = 'Admin'
    const Token = jwt.sign({ UserID: User[0].UserID, Username: req.body.username, Number: req.body.number, Role: Role, PublicKey: User[0].PublicKey }, process.env.SEKRET_KEY)
    res.header('Authentication', Token).send('You logged in.')
})

module.exports = {
    Register,
    Login,
    getUsers,
    getUserByUserID,
    getUserByUsername,
    getUserByNumber,
    getUserByLink,
    AddUser,
    UpdateUser,
    DeleteUser
}