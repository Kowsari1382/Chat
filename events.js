const joi = require('joi')
const encryption = require('./encryption')
const UserModel = require('./models/user-model')
const GroupModel = require('./models/group-model')
const GroupMemberModel = require('./models/group-members-model')
const ChannelModel = require('./models/channel-model')
const ChannelMemberModel = require('./models/channel-members-model')
const PrivateMessageModel = require('./models/private-message-model')
const GroupMessageModel = require('./models/group-message-model')
const ChannelMessageModel = require('./models/channel-message-model')
const GroupKeysModel = require('./models/group-keys-model')
const ChannelKeysModel = require('./models/channel-keys-model')
const PrivateFileModel = require('./models/private-file-model')
const GroupFileModel = require('./models/group-file-model')
const ChannelFileModel = require('./models/channel-file-model')
const uuid = require('uuid')
const fs = require('fs')

const Sockets = {}

const events = async (io, socket, rateLimiter) => {

    if (!Sockets[socket.UserData.UserID]) Sockets[socket.UserData.UserID] = []
    Sockets[socket.UserData.UserID].push(socket)
    console.log('Client with ID: ' + socket.id + ' connected.')

    const Users = await UserModel.UserInfo(socket.UserData.UserID)
    const Groups = await GroupModel.GroupInfo(socket.UserData.UserID)
    const Channels = await ChannelModel.ChannelInfo(socket.UserData.UserID)

    socket.emit('user-info', Users)
    socket.emit('group-info', Groups)
    socket.emit('channel-info', Channels)
    socket.emit('info', { UserID: socket.UserData.UserID, Username: socket.UserData.Username, Number: socket.UserData.Number, Role: socket.UserData.Role, PublicKey: socket.UserData.PublicKey })

    for (let i = 0; i < Groups.length; i++) {
        socket.join('Group_' + Groups[i].GroupID)
    }

    for (let i = 0; i < Channels.length; i++) {
        socket.join('Channel_' + Channels[i].ChannelID)
    }

    socket.on('read-messages', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = Joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const PrivateMessages = await PrivateMessageModel.getMessageByReceiverID(data.userid)
        const GroupMessages = await GroupMessageModel.getMessagebyUserID(data.userid)
        const ChannelMessages = await ChannelMessageModel.getMessagebyUserID(data.userid)
        const PrivateFiles = await PrivateFileModel.getFileByReceiverID(data.userid)
        const GroupFiles = await GroupFileModel.getFilebyUserID(data.userid)
        const ChannelFiles = await ChannelFileModel.getFilebyUserID(data.userid)
        socket.emit('read-messages', { PrivateMessages, GroupMessages, ChannelMessages, PrivateFiles, GroupFiles, ChannelFiles })
    })

    socket.on('read-unseen-messages', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const PrivateMessages = await PrivateMessageModel.getUnseenMessages(data.userid)
        const GroupMessages = await GroupMessageModel.getUnseenMessages(data.userid)
        const ChannelMessages = await ChannelMessageModel.getUnseenMessages(data.userid)
        const PrivateFiles = await PrivateFileModel.getUnseenFiles(data.userid)
        const GroupFiles = await GroupFileModel.getUnseenFiles(data.userid)
        const ChannelFiles = await ChannelFileModel.getUnseenFiles(data, userid)
        socket.emit('read-unseen-messages', { PrivateMessages, GroupMessages, ChannelMessages, PrivateFiles, GroupFiles, ChannelFiles })
    })

    socket.on('private-receive-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            receiverid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.receiverid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Sender = await UserModel.getUserByID(data.senderid)
        if (!Sender || Sender.length === 0) return socket.emit('error', 'There is not any sender with this id.')
        const Messages = await PrivateMessageModel.getMessageBySenderReceiverID(data.senderid, data.receiverid)
        socket.emit('private-receive-message', Messages)
    })

    socket.on('group-receive-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupMemberModel.getGroupUser(data.groupid, socket.UserData.UserID)
        if ((!Group || Group.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Messages = await GroupMessageModel.getMessageByGroupID(data.groupid)
        socket.emit('group-receive-message', Messages)
    })

    socket.on('channel-receive-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelMemberModel.getChannelUser(data.channelid, socket.UserData.UserID)
        if ((!Channel || Channel.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Messages = await ChannelMessageModel.getMessageByChannelID(data.channelid)
        socket.emit('channel-receive-message', Messages)
    })

    socket.on('private-receive-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            receiverid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.receiverid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Sender = await UserModel.getUserByID(data.senderid)
        if (!Sender || Sender.length === 0) return socket.emit('error', 'There is not any sender with this id.')
        const Files = await PrivateFileModel.getFileBySenderReceiverID(data.senderid, data.receiverid)
        for (let i = 0; i < Files.length; i++) {
            fs.readFile(Files[i].FilePath, (error, file) => {
                if (error) return console.log(error)
                socket.emit('private-receive-file', { info: Files[i], file: file })
            })
        }
    })

    socket.on('group-receive-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupMemberModel.getGroupUser(data.groupid, socket.UserData.UserID)
        if ((!Group || Group.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Files = await GroupFileModel.getFileByGroupID(data.groupid)
        for (let i = 0; i < Files.length; i++) {
            fs.readFile(Files[i].FilePath, (error, file) => {
                if (error) return console.log(error)
                socket.emit('group-receive-file', { info: Files[i], file: file })
            })
        }
    })

    socket.on('channel-receive-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelMemberModel.getChannelUser(data.channelid, socket.UserData.UserID)
        if ((!Channel || Channel.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Files = await ChannelFileModel.getFileByChannelID(data.channelid)
        for (let i = 0; i < Files.length; i++) {
            fs.readFile(Files[i].FilePath, (error, file) => {
                if (error) return console.log(error)
                socket.emit('channel-receive-file', { info: Files[i], file: file })
            })
        }
    })

    socket.on('private-send-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            receiverid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Receiver = await UserModel.getUserByID(data.receiverid)
        if (!Receiver || Receiver.length === 0) return socket.emit('error', 'There is not any receiver with this id.')
        if (Sockets[data.receiverid]) {
            for (let i = 0; i < Sockets[data.receiverid].length; i++) {
                io.to(Sockets[data.receiverid][i].id).emit('private-receive-message', { senderid: data.senderid, receiverid: data.receiverid, encodedtext: data.encodedtext, encodedkey: data.encodedkey, iv: data.iv })
            }
        }
        await PrivateMessageModel.AddMessage(data.senderid, data.receiverid, data.encodedtext, data.encodedkey, data.iv, 0)
    })

    socket.on('group-send-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            groupid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this id.')
        const GroupUser = await GroupMemberModel.getGroupUser(data.groupid, data.senderid)
        if ((!GroupUser || GroupUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const KeyVersion = (await GroupKeysModel.getGroupKeysByPublicKey(Group[0].PublicKey))[0].KeyVersion
        io.to('Group_' + data.groupid).emit('group-receive-message', { senderid: data.senderid, groupid: data.groupid, encodedtext: data.encodedtext, encodedkey: data.encodedkey, iv: data.iv, keyversion: KeyVersion })
        await GroupMessageModel.AddMessage(data.senderid, data.groupid, data.encodedtext, data.encodedkey, data.iv, 0, KeyVersion)
    })

    socket.on('channel-send-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            channelid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this id.')
        const ChannelUser = await ChannelMemberModel.getChannelUser(data.channelid, data.senderid)
        if ((!ChannelUser || ChannelUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        if (socket.UserData.UserID == ChannelUser[0].UserID && ChannelUser[0].Role == 'User') return socket.emit('error', 'Access is denied.')
        const KeyVersion = (await ChannelKeysModel.getChannelKeysByPublicKey(Channel[0].PublicKey))[0].KeyVersion
        io.to('Channel_' + data.channelid).emit('channel-receive-message', { senderid: data.senderid, channelid: data.channelid, encodedtext: data.encodedtext, encodedkey: data.encodedkey, iv: data.iv, keyversion: KeyVersion })
        await ChannelMessageModel.AddMessage(data.senderid, data.channelid, data.encodedtext, data.encodedkey, data.iv, 0, KeyVersion)
    })

    socket.on('private-send-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        } catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            receiverid: joi.number().required(),
            encodedfilename: joi.string().required(),
            encodedfile: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Receiver = await UserModel.getUserByID(data.receiverid)
        if (!Receiver || Receiver.length === 0) return socket.emit('error', 'There is not any receiver with this id.')
        if (Sockets[data.receiverid]) {
            for (let i = 0; i < Sockets[data.receiverid].length; i++) {
                io.to(Sockets[data.receiverid][i].id).emit('private-receive-file', { senderid: data.senderid, receiverid: data.receiverid, encodedfilename: data.encodedfilename, encodedfile: data.encodedfile, encodedkey: data.encodedkey, iv: data.iv })
            }
        }
        const FilePath = './files/private/' + String(data.receiverid) + '/' + String(data.encodedfilename)
        fs.writeFile(FilePath, Buffer.from(data.encodedfile, 'base64'), (error) => {
            if (error) return console.log(error)
        })
        await PrivateFileModel.AddFile(data.senderid, data.receiverid, FilePath, data.encodedkey, data.iv, 0)
    })

    socket.on('group-send-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        } catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            groupid: joi.number().required(),
            encodedfilename: joi.string().required(),
            encodedfile: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this id.')
        const GroupUser = await GroupMemberModel.getGroupUser(data.groupid, data.senderid)
        if ((!GroupUser || GroupUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const KeyVersion = (await GroupKeysModel.getGroupKeysByPublicKey(Group[0].PublicKey))[0].KeyVersion
        io.to('Group_' + data.groupid).emit('group-receive-file', { senderid: data.senderid, groupid: data.groupid, encodedfilename: data.encodedfilename, encodedfile: data.encodedfile, encodedkey: data.encodedkey, iv: data.iv, keyversion: KeyVersion })
        const FilePath = './files/group/' + String(data.groupid) + '/' + String(data.encodedfilename)
        fs.writeFile(FilePath, Buffer.from(data.encodedfile, 'base64'), (error) => {
            if (error) return console.log(error)
        })
        await GroupFileModel.AddFile(data.senderid, data.groupid, FilePath, data.encodedkey, data.iv, 0, KeyVersion)
    })

    socket.on('channel-send-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        } catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            senderid: joi.number().required(),
            channelid: joi.number().required(),
            encodedfilename: joi.string().required(),
            encodedfile: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.senderid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this id.')
        const ChannelUser = await ChannelMemberModel.getChannelUser(data.channelid, data.senderid)
        if ((!ChannelUser || ChannelUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        if (socket.UserData.UserID == ChannelUser[0].UserID && ChannelUser[0].Role == 'User') return socket.emit('error', 'Access is denied.')
        const KeyVersion = (await ChannelKeysModel.getChannelKeysByPublicKey(Channel[0].PublicKey))[0].KeyVersion
        io.to('Channel_' + data.channelid).emit('channel-receive-file', { senderid: data.senderid, channelid: data.channelid, encodedfilename: data.encodedfilename, encodedfile: data.encodedfile, encodedkey: data.encodedkey, iv: data.iv, keyversion: KeyVersion })
        const FilePath = './files/channel/' + String(data.channelid) + '/' + String(data.encodedfilename)
        fs.writeFile(FilePath, Buffer.from(data.encodedfile, 'base64'), (error) => {
            if (error) return console.log(error)
        })
        await ChannelFileModel.AddFile(data.senderid, data.channelid, FilePath, data.encodedkey, data.iv, 0, KeyVersion)
    })

    socket.on('private-update-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await PrivateMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await PrivateMessageModel.UpdateMessage(data.messageid, data.encodedtext, data.encodedkey, data.iv, Message[0].Seen)
        socket.emit('private-update-message')
    })

    socket.on('group-update-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await GroupMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMessageModel.UpdateMessage(data.messageid, data.encodedtext, data.encodedkey, data.iv, Message[0].Seen)
        socket.emit('group-update-message')
    })

    socket.on('channel-update-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required(),
            encodedtext: joi.string().required(),
            encodedkey: joi.string().required(),
            iv: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await ChannelMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMessageModel.UpdateMessage(data.messageid, data.encodedtext, data.encodedkey, data.iv, Message[0].Seen)
        socket.emit('channel-update-message')
    })

    socket.on('private-delete-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await PrivateMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await PrivateMessageModel.DeleteMessage(data.messageid)
        socket.emit('private-delete-message')
    })

    socket.on('group-delete-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await GroupMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMessageModel.DeleteMessage(data.messageid)
        socket.emit('group-delete-message')
    })

    socket.on('channel-delete-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await ChannelMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'Message was not found.')
        if (socket.UserData.UserID != Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMessageModel.DeleteMessage(data.messageid)
        socket.emit('channel-delete-message')
    })

    socket.on('private-delete-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await PrivateFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'File was not found.')
        if (socket.UserData.UserID != File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Path = File[0].FilePath
        fs.unlink(Path, (error) => {
            if (error) return console.log(error)
        })
        await PrivateFileModel.DeleteFile(data.fileid)
        socket.emit('private-delete-file')
    })

    socket.on('group-delete-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await GroupFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'File was not found.')
        if (socket.UserData.UserID != File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Path = File[0].FilePath
        fs.unlink(Path, (error) => {
            if (error) return console.log(error)
        })
        await GroupFileModel.DeleteFile(data.fileid)
        socket.emit('group-delete-file')
    })

    socket.on('channel-delete-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await ChannelFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'File was not found.')
        if (socket.UserData.UserID != File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Path = File[0].FilePath
        fs.unlink(Path, (error) => {
            if (error) return console.log(error)
        })
        await ChannelFileModel.DeleteFile(data.fileid)
        socket.emit('channel-delete-file')
    })

    socket.on('private-seen-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await PrivateFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'There is not any file with this id.')
        if (socket.UserData.UserID === File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await PrivateFileModel.SeenFile(data.fileid)
        if (Sockets[File[0].SenderID]) {
            for (let i = 0; i < Sockets[File[0].SenderID].length; i++) {
                io.to(Sockets[File[0].SenderID][i].id).emit('private-seen-file', { fileid: data.fileid, seen: 'yes' })
            }
        }
    })

    socket.on('group-seen-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await GroupFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'There is not any file with this id.')
        if (socket.UserData.UserID === File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupFileModel.SeenFile(data.fileid)
        io.to('Group_' + File[0].GroupID).emit('group-seen-file', { fileid: data.fileid, seen: 'yes' })
    })

    socket.on('channel-seen-file', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            fileid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const File = await ChannelFileModel.getFileByFileID(data.fileid)
        if (!File || File.length === 0) return socket.emit('error', 'There is not any file with this id.')
        if (socket.UserData.UserID === File[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelFileModel.SeenFile(data.fileid)
        io.to('Channel_' + File[0].ChannelID).emit('channel-seen-file', { fileid: data.fileid, seen: 'yes' })
    })

    socket.on('private-seen-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await PrivateMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'There is not any message with this id.')
        if (socket.UserData.UserID === Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await PrivateMessageModel.SeenMessage(data.messageid)
        if (Sockets[Message[0].SenderID]) {
            for (let i = 0; i < Sockets[Message[0].SenderID].length; i++) {
                io.to(Sockets[Message[0].SenderID][i].id).emit('private-seen-message', { messageid: data.messageid, seen: 'yes' })
            }
        }
    })

    socket.on('group-seen-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await GroupMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'There is not any message with this id.')
        if (socket.UserData.UserID === Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMessageModel.SeenMessage(data.messageid)
        io.to('Group_' + Message[0].GroupID).emit('group-seen-message', { messageid: data.messageid, seen: 'yes' })
    })

    socket.on('channel-seen-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            messageid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Message = await ChannelMessageModel.getMessageByMessageID(data.messageid)
        if (!Message || Message.length === 0) return socket.emit('error', 'There is not any message with this id.')
        if (socket.UserData.UserID === Message[0].SenderID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMessageModel.SeenMessage(data.messageid)
        io.to('Channel_' + Message[0].ChannelID).emit('channel-seen-message', { messageid: data.messageid, seen: 'yes' })
    })

    socket.on('create-group', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupname: joi.string().required(),
            description: joi.string(),
            link: joi.string()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (data.link) {
            const other = await GroupModel.getGroupByLink(data.link)
            if (other && other.length > 0) return socket.emit('error', 'There is a group with this link.')
        }
        const KeyPair = encryption.GenerateKeyPair()
        const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, socket.UserData.PublicKey)
        socket.emit('group-private-key', EncryptedKey)
        const Group = await GroupModel.AddGroup(data.groupname, socket.UserData.UserID, KeyPair.PublicKey, 1, data.description, data.link)
        await GroupMemberModel.AddGroupMember(Group[0].GroupID, socket.UserData.UserID, 'Creator')
        await GroupKeysModel.AddGroupKey(Group[0].GroupID, socket.UserData.UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        if (Sockets[socket.UserData.UserID]) {
            for (let i = 0; i < Sockets[socket.UserData.UserID].length; i++) {
                Sockets[socket.UserData.UserID][i].join('Group_' + Group[0].GroupID)
            }
        }
        socket.emit('group-created', { groupname: data.groupname, publickey: KeyPair.PublicKey, encodedprivatekey: EncryptedKey, description: data.description, link: data.link })
    })

    socket.on('update-group', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            groupname: joi.string().required(),
            creatorid: joi.number().required(),
            description: joi.string(),
            link: joi.string()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this group id.')
        if (socket.UserData.UserID != Group[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        if (data.link) {
            const other = await GroupModel.getGroupByLink(data.link)
            if (other && other.length > 0) return socket.emit('error', 'There is a group with this link.')
        }
        await GroupModel.UpdateGroup(data.groupid, data.groupname, data.creatorid, Group[0].PublicKey, Group[0].MembersNumber, data.description, data.link)
        io.to('Group_' + data.groupid).emit('group-updated', { groupid: data.groupid, groupname: data.groupname, creatorid: data.creatorid, publickey: Group[0].PublicKey, membersnumber: Group[0].MembersNumber, description: data.description, link: data.link })
    })

    socket.on('delete-group', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this group id.')
        if (socket.UserData.UserID != Group[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupModel.DeleteGroup(data.groupid)
        io.to('Group_' + data.groupid).emit('group-deleted', 'Group deleted.')
        io.in('Group_' + data.groupid).socketsLeave('Group_' + data.groupid)
    })

    socket.on('create-channel', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelname: joi.string().required(),
            description: joi.string(),
            link: joi.string()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (data.link) {
            const other = await ChannelModel.getChannelByLink(data.link)
            if (other && other.length > 0) return socket.emit('error', 'There is a channel with this link.')
        }
        const KeyPair = encryption.GenerateKeyPair()
        const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, socket.UserData.PublicKey)
        socket.emit('channel-private-key', EncryptedKey)
        const Channel = await ChannelModel.AddChannel(data.channelname, socket.UserData.UserID, KeyPair.PublicKey, 1, data.description, data.link)
        await ChannelMemberModel.AddChannelMember(Channel[0].ChannelID, socket.UserData.UserID, 'Creator')
        await ChannelKeysModel.AddChannelKey(Channel[0].ChannelID, socket.UserData.UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        if (Sockets[socket.UserData.UserID]) {
            for (let i = 0; i < Sockets[socket.UserData.UserID].length; i++) {
                Sockets[socket.UserData.UserID][i].join('Channel_' + Channel[0].ChannelID)
            }
        }
        socket.emit('channel-created', { channelname: data.channelname, publickey: KeyPair.PublicKey, encodedprivatekey: EncryptedKey, description: data.description, link: data.link })
    })

    socket.on('update-channel', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            channelname: joi.string().required(),
            creatorid: joi.number().required(),
            description: joi.string(),
            link: joi.string()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this channel id.')
        if (socket.UserData.UserID != Channel[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        if (data.link) {
            const other = await ChannelModel.getChannelByLink(data.link)
            if (other && other.length > 0) return socket.emit('error', 'There is a channel with this link.')
        }
        await ChannelModel.UpdateChannel(data.channelid, data.channelname, data.creatorid, Channel[0].PublicKey, Channel[0].MembersNumber, data.description, data.link)
        io.to('Channel_' + data.channelid).emit('channel-updated', { channelid: data.channelid, channelname: data.channelname, creatorid: data.creatorid, publickey: Channel[0].PublicKey, membersnumber: Channel[0].MembersNumber, description: data.description, link: data.link })
    })

    socket.on('delete-channel', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this channel id.')
        if (socket.UserData.UserID != Channel[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelModel.DeleteChannel(data.channelid)
        io.to('Channel_' + data.channelid).emit('channel-deleted', 'Channel deleted.')
        io.in('Channel_' + data.channelid).socketsLeave('Channel_' + data.channelid)
    })

    socket.on('join-group', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this group id.')
        const GroupMember = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if (GroupMember && GroupMember.length > 0) return socket.emit('error', 'This user is already joined to this group.')
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMemberModel.AddGroupMember(data.groupid, data.userid, 'User')
        if (socket.UserData.Role !== 'Admin') {
            if (Sockets[data.userid]) {
                for (let i = 0; i < Sockets[data.userid].length; i++) {
                    Sockets[data.userid][i].join('Group_' + data.groupid)
                }
            }
        }
        io.to('Group_' + data.groupid).emit('joined-group', { groupid: data.groupid, userid: data.userid })
        const KeyPair = encryption.GenerateKeyPair()
        const GroupMembers = await GroupMemberModel.getGroupMembersByGroupID2(data.groupid)
        for (let i = 0; i < GroupMembers.length; i++) {
            const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, GroupMembers[i].PublicKey)
            if (Sockets[GroupMembers[i].UserID]) {
                for (let j = 0; j < Sockets[GroupMembers[i].UserID].length; j++) {
                    io.to(Sockets[GroupMembers[i].UserID][j].id).emit('group-private-key', { groupid: data.groupid, group_encrypted_secret_key: EncryptedKey, group_public_key: KeyPair.PublicKey })
                }
            }
            await GroupKeysModel.AddGroupKey(data.groupid, GroupMembers[i].UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        }
        await GroupModel.UpdatePublicKey(data.groupid, KeyPair.PublicKey)
        await GroupModel.IncreaseNumber(data, groupid)
    })

    socket.on('leave-group', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this group id.')
        const GroupMember = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if (!GroupMember || GroupMember.length === 0) return socket.emit('error', 'This user is not joined to this group yet.')
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMemberModel.DeleteGroupMember(data.groupid, data.userid)
        if (socket.UserData.Role !== 'Admin') {
            if (Sockets[data.userid]) {
                for (let i = 0; i < Sockets[data.userid].length; i++) {
                    Sockets[data.userid][i].leave('Group_' + data.groupid)
                }
            }
        }
        io.to('Group_' + data.groupid).emit('leaved-group', { groupid: data.groupid, userid: data.userid })
        const KeyPair = encryption.GenerateKeyPair()
        const GroupMembers = await GroupMemberModel.getGroupMembersByGroupID2(data.groupid)
        for (let i = 0; i < GroupMembers.length; i++) {
            const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, GroupMembers[i].PublicKey)
            if (Sockets[GroupMembers[i].UserID]) {
                for (let j = 0; j < Sockets[GroupMembers[i].UserID].length; j++) {
                    io.to(Sockets[GroupMembers[i].UserID][j].id).emit('group-private-key', { groupid: data.groupid, group_encrypted_secret_key: EncryptedKey, group_public_key: KeyPair.PublicKey })
                }
            }
            await GroupKeysModel.AddGroupKey(data.groupid, GroupMembers[i].UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        }
        await GroupModel.UpdatePublicKey(data.groupid, KeyPair.PublicKey)
        await GroupModel.DecreaseNumber(data, groupid)
    })

    socket.on('join-channel', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this channel id.')
        const ChannelMember = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if (ChannelMember && ChannelMember.length > 0) return socket.emit('error', 'This user is already joined to this channel.')
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMemberModel.AddChannelMember(data.channelid, data.userid, 'User')
        if (socket.UserData.Role !== 'Admin') {
            if (Sockets[data.userid]) {
                for (let i = 0; i < Sockets[data.userid].length; i++) {
                    Sockets[data.userid][i].join('Channel_' + data.channelid)
                }
            }
        }
        io.to('Channel_' + data.channelid).emit('joined-channel', { channelid: data.channelid, userid: data.userid })
        const KeyPair = encryption.GenerateKeyPair()
        const ChannelMembers = await ChannelMemberModel.getChannelMembersByChannelID2(data.channelid)
        for (let i = 0; i < ChannelMembers.length; i++) {
            const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, ChannelMembers[i].PublicKey)
            if (Sockets[ChannelMembers[i].UserID]) {
                for (let j = 0; j < Sockets[ChannelMembers[i].UserID].length; j++) {
                    io.to(Sockets[ChannelMembers[i].UserID][j].id).emit('channel-private-key', { channelid: data.channelid, channel_encrypted_secret_key: EncryptedKey, channel_public_key: KeyPair.PublicKey })
                }
            }
            await ChannelKeysModel.AddChannelKey(data.channelid, ChannelMembers[i].UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        }
        await ChannelModel.UpdatePublicKey(data.channelid, KeyPair.PublicKey)
        await ChannelModel.IncreaseNumber(data.channelid)
    })

    socket.on('leave-channel', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this channel id.')
        const ChannelMember = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if (!ChannelMember || ChannelMember.length === 0) return socket.emit('error', 'This user is not joined to this channel yet.')
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMemberModel.DeleteChannelMember(data.channelid, data.userid)
        if (socket.UserData.Role !== 'Admin') {
            if (Sockets[data.userid]) {
                for (let i = 0; i < Sockets[data.userid].length; i++) {
                    Sockets[data.userid][i].leave('Channel_' + data.channelid)
                }
            }
        }
        io.to('Channel_' + data.channelid).emit('leaved-channel', { channelid: data.channelid, userid: data.userid })
        const KeyPair = encryption.GenerateKeyPair()
        const ChannelMembers = await ChannelMemberModel.getChannelMembersByChannelID2(data.channelid)
        for (let i = 0; i < ChannelMembers.length; i++) {
            const EncryptedKey = encryption.encrypt(KeyPair.PrivateKey, ChannelMembers[i].PublicKey)
            if (Sockets[ChannelMembers[i].UserID]) {
                for (let j = 0; j < Sockets[ChannelMembers[i].UserID].length; j++) {
                    io.to(Sockets[ChannelMembers[i].UserID][j].id).emit('channel-private-key', { channelid: data.channelid, channel_encrypted_secret_key: EncryptedKey, channel_public_key: KeyPair.PublicKey })
                }
            }
            await ChannelKeysModel.AddChannelKey(data.channelid, ChannelMembers[i].UserID, KeyPair.PublicKey, EncryptedKey, uuid.v4())
        }
        await ChannelModel.UpdatePublicKey(data.channelid, KeyPair.PublicKey)
        await ChannelModel.DecreaseNumber(data.channelid)
    })

    socket.on('group-update-role', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required(),
            role: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if (!Group || Group.length === 0) return socket.emit('error', 'This user is not joined to this group yet.')
        if (socket.UserData.UserID != Group[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await GroupMemberModel.UpdateRole(data.groupid, data.userid, data.role)
        io.to('Group_' + data.groupid).emit('role-updated', { groupid: data.groupid, userid: data.userid, role: data.role })
    })

    socket.on('channel-update-role', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required(),
            role: joi.string().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'This user is not joined to this channel yet.')
        if (socket.UserData.UserID != Channel[0].CreatorID && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        await ChannelMemberModel.UpdateRole(data.channelid, data.userid, data.role)
        io.to('Channel_' + data.channelid).emit('role-updated', { channelid: data.channelid, userid: data.userid, role: data.role })
    })

    socket.on('group-keys', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const GroupMember = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if (!GroupMember || GroupMember.length === 0) return socket.emit('error', 'This user is not joined to this group yet.')
        const GroupKeys = await GroupKeysModel.getGroupKeysByGroupUserID(data.groupid, data.userid)
        socket.emit('group-keys', GroupKeys)
    })

    socket.on('channel-keys', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const ChannelMember = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if (!ChannelMember || ChannelMember.length === 0) return socket.emit('error', 'This user is not joined to this channel yet.')
        const ChannelKeys = await ChannelKeysModel.getChannelKeysByChannelUserID(data.channelid, data.userid)
        socket.emit('channel-keys', ChannelKeys)
    })

    socket.on('last-private-messages', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const User = await UserModel.getUserByID(data.userid)
        if (!User || User.length === 0) return socket.emit('error', 'There is not any user with this id.')
        const LastMessages = await PrivateMessageModel.getLastMessages(data.userid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('last-private-messages', LastMessages)
            }
        }
    })

    socket.on('last-group-messages', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const LastMessages = await GroupMessageModel.getLastMessages(data.userid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('last-group-messages', LastMessages)
            }
        }
    })

    socket.on('last-channel-messages', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const LastMessages = await ChannelMessageModel.getLastMessages(data.userid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('last-channel-messages', LastMessages)
            }
        }
    })

    socket.on('last-group-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this id.')
        const GroupUser = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if ((!GroupUser || GroupUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const LastMessage = await GroupMessageModel.getLastMessage(data.groupid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('last-group-messages', LastMessage[0])
            }
        }
    })

    socket.on('last-channel-message', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        if (socket.UserData.UserID != data.userid && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this id.')
        const ChannelUser = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if ((!ChannelUser || ChannelUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const LastMessage = await ChannelMessageModel.getLastMessage(data.channelid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('last-channel-messages', LastMessage[0])
            }
        }
    })

    socket.on('user-info', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const User = await UserModel.getUserByID(data.userid)
        if (!User || User.length === 0) return socket.emit('error', 'There is not any user with this id.')
        const UserInfo = await UserModel.getUserByID(data.userid)
        if (Sockets[socket.UserData.UserID]) {
            for (let i = 0; i < Sockets[socket.UserData.UserID].length; i++) {
                io.to(Sockets[socket.UserData.UserID][i].id).emit('user-info', { userid: UserInfo[0].UserID, username: UserInfo[0].Username, link: UserInfo[0].Link, bio: UserInfo[0].Bio, publickey: UserInfo[0].PublicKey })
            }
        }
    })

    socket.on('group-info', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            groupid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Group = await GroupModel.getGroupByGroupID(data.groupid)
        if (!Group || Group.length === 0) return socket.emit('error', 'There is not any group with this id.')
        const GroupUser = await GroupMemberModel.getGroupUser(data.groupid, data.userid)
        if ((!GroupUser || GroupUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const GroupInfo = await GroupModel.getGroupByGroupID(data.groupid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('group-info', { groupid: GroupInfo[0].GroupID, groupname: GroupInfo[0].GroupName, creatorid: GroupInfo[0].CreatorID, publickey: GroupInfo[0].PublicKey, membersnumber: GroupInfo[0].MembersNumber, description: GroupInfo[0].Description, link: GroupInfo[0].Link })
            }
        }
    })

    socket.on('channel-info', async (data) => {
        try {
            await rateLimiter.consume(socket.id)
        }
        catch (error) {
            return socket.emit('error', 'Too many request!')
        }
        const schema = {
            channelid: joi.number().required(),
            userid: joi.number().required()
        }
        const Validation = joi.object(schema).validate(data)
        if (Validation.error) return socket.emit('error', Validation.error.details[0].message)
        const Channel = await ChannelModel.getChannelByChannelID(data.channelid)
        if (!Channel || Channel.length === 0) return socket.emit('error', 'There is not any channel with this id.')
        const ChannelUser = await ChannelMemberModel.getChannelUser(data.channelid, data.userid)
        if ((!ChannelUser || ChannelUser.length === 0) && socket.UserData.Role !== 'Admin') return socket.emit('error', 'Access is denied.')
        const ChannelInfo = await ChannelModel.getChannelByChannelID(data.channelid)
        if (Sockets[data.userid]) {
            for (let i = 0; i < Sockets[data.userid].length; i++) {
                io.to(Sockets[data.userid][i].id).emit('channel-info', { groupid: ChannelInfo[0].GroupID, groupname: ChannelInfo[0].GroupName, creatorid: ChannelInfo[0].CreatorID, publickey: ChannelInfo[0].PublicKey, membersnumber: ChannelInfo[0].MembersNumber, description: ChannelInfo[0].Description, link: ChannelInfo[0].Link })
            }
        }
    })

    socket.on('error', (error) => {
        console.log(error)
    })

    socket.on('disconnect', () => {
        if (Sockets[socket.UserData.UserID]) {
            const index = Sockets[socket.UserData.UserID].indexOf(socket)
            if (index !== -1) {
                Sockets[socket.UserData.UserID].splice(index, 1)
                if (Sockets[socket.UserData.UserID].length === 0) delete Sockets[socket.UserData.UserID]
            }
        }
        console.log('Client with ID: ' + socket.id + ' disconnected.')
    })
}

module.exports = {
    events
}