const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class ChannelModel {
    static async getChannels() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from Channels')
        return result.recordset
    }

    static async getChannelByChannelID(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from Channels where ChannelID = @ChannelID')
        return result.recordset
    }

    static async getChannelByChannelName(channelname) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelName', sql.NVarChar, channelname)
        const result = await request.query('select * from Channels where ChannelName = @ChannelName')
        return result.recordset
    }

    static async getChannelByCreatorID(creatorid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('CreatorID', sql.Int, creatorid)
        const result = await request.query('select * from Channels where CreatorID = @CreatorID')
        return result.recordset
    }

    static async getChannelByLink(link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Link', sql.NVarChar, link)
        const result = await request.query('select * from Channels where Link = @Link')
        return result.recordset
    }

    static async ChannelInfo(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select * from Channels
            where ChannelID in (select ChannelID from ChannelMembers
            where UserID = @UserID) 
            `)
        return result.recordset
    }

    static async AddChannel(channelname, creatorid, publickey, membersnumber, description, link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelName', sql.NVarChar, channelname)
        request.input('CreatorID', sql.Int, creatorid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('MembersNumber', sql.Int, membersnumber)
        request.input('Description', sql.NVarChar, description)
        request.input('Link', sql.NVarChar, link)
        const result = await request.query(`
            insert into Channels(ChannelName, CreatorID, PublicKey, MembersNumber, Description, Link) 
            values(@ChannelName, @CreatorID, @PublicKey, @MembersNumber, @Description, @Link)
            SELECT SCOPE_IDENTITY() AS ChannelID;
            `)
        return result.recordset
    }

    static async UpdateChannel(channelid, chanelname, creatorid, publickey, membersnumber, description, link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('ChannelName', sql.NVarChar, chanelname)
        request.input('CreatorID', sql.Int, creatorid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('MembersNumber', sql.Int, membersnumber)
        request.input('Description', sql.NVarChar, description)
        request.input('Link', sql.NVarChar, link)
        const result = await request.query('update Channels set ChannelName = @ChannelName, CreatorID = @CreatorID, PublicKey = @PublicKey, MembersNumber = @MembersNumber, Description = @Description, Link = @Link where ChannelID = @ChannelID')
        return result.recordset
    }

    static async DeleteChannel(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('delete from Channels where ChannelID = @ChannelID')
        return result.recordset
    }

    static async UpdatePublicKey(channelid, publickey) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('PublicKey', sql.NVarChar, publickey)
        const result = await request.query('update Channels set PublicKey = @PublicKey where ChannelID = @ChannelID')
        return result.recordset
    }

    static async IncreaseNumber(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('update Channels set MembersNumber += 1 where ChannelID = @ChannelID')
        return result.recordset
    }

    static async DecreaseNumber(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('update Channels set MembersNumber -= 1 where ChannelID = @ChannelID')
        return result.recordset
    }
}

module.exports = ChannelModel