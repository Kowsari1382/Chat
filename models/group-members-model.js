const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class GroupMemberModel {
    static async getGroupMembers() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from GroupMembers')
        return result.recordset
    }

    static async getGroupMembersByGroupID(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from GroupMembers where GroupID = @GroupID')
        return result.recordset
    }

    static async getGroupMembersByGroupID2(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query(`
            select GroupID, UserID, Role, Users.PublicKey from GroupMembers, Users
            where GroupMembers.UserID = Users.UserID and GroupMembers.GroupID = @GroupID
            `)
        return result.recordset
    }

    static async getGroupsByUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query('select * from GroupMembers where UserID = @UserID')
        return result.recordset
    }

    static async getGroupUser(groupid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('UserID', sql.Int, userid)
        const result = await request.query('select * from GroupMembers where GroupID = @GroupID and UserID = @UserID')
        return result.recordset
    }

    static async AddGroupMember(groupid, userid, role) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('UserID', sql.Int, userid)
        request.input('Role', sql.NVarChar, role)
        const result = await request.query('insert into GroupMembers(GroupID, UserID, Role) values(@GroupID, @UserID, @Role)')
        return result.recordset
    }

    static async DeleteGroupMember(groupid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('UserID', sql.Int, userid)
        const result = await request.query('delete from GroupMembers where GroupID = @GroupID and UserID = @UserID')
        return result.recordset
    }

    static async UpdateRole(groupid, userid, role) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('UserID', sql.Int, userid)
        request.input('Role', sql.Int, role)
        const result = await request.query('update GroupMembers set Role = @Role where GroupID = @GroupID and UserID = @UserID')
        return result.recordset
    }
}

module.exports = GroupMemberModel