const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class ChannelMemberModel{
    static async getChannelMembers() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from ChannelMembers')
        return result.recordset
    }

    static async getChannelMembersByChannelID(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from ChannelMembers where ChannelID = @ChannelID')
        return result.recordset
    }

    static async getChannelMembersByChannelID2(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query(`
            select ChannelID, UserID, Role, Users.PublicKey from ChannelMembers, Users
            where ChannelMembers.UserID = Users.UserID and ChannelMembers.ChannelID = @ChannelID
            `)
        return result.recordset
    }

    static async getChannelsByUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query('select * from ChannelMembers where UserID = @UserID')
        return result.recordset
    }

    static async getChannelUser(channelid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('UserID', sql.Int, userid)
        const result = await request.query('select * from ChannelMembers where ChannelID = @ChannelID and UserID = @UserID')
        return result.recordset
    }

    static async AddChannelMember(channelid, userid, role) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('UserID', sql.Int, userid)
        request.input('Role', sql.NVarChar, role)
        const result = await request.query('insert into ChannelMembers(ChannelID, UserID, Role) values(@ChannelID, @UserID, @Role)')
        return result.recordset
    }

    static async DeleteChannelMember(channelid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('UserID', sql.Int, userid)
        const result = await request.query('delete from ChannelMembers where ChannelID = @ChannelID and UserID = @UserID')
        return result.recordset
    }

    static async UpdateRole(channelid, userid, role) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('UserID', sql.Int, userid)
        request.input('Role', sql.Int, role)
        const result = await request.query('update ChannelMembers set Role = @Role where ChannelID = @ChannelID and UserID = @UserID')
        return result.recordset
    }
}

module.exports = ChannelMemberModel