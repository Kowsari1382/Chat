const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class GroupModel {
    static async getGroups() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from Groups')
        return result.recordset
    }

    static async getGroupByGroupID(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from Groups where GroupID = @GroupID')
        return result.recordset
    }

    static async getGroupByGroupName(groupname) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupName', sql.NVarChar, groupname)
        const result = await request.query('select * from Groups where GroupName = @GroupName')
        return result.recordset
    }

    static async getGroupByCreatorID(creatorid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('CreatorID', sql.Int, creatorid)
        const result = await request.query('select * from Groups where CreatorID = @CreatorID')
        return result.recordset
    }

    static async getGroupByLink(link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Link', sql.NVarChar, link)
        const result = await request.query('select * from Groups where Link = @Link')
        return result.recordset
    }

    static async GroupInfo(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select * from Groups
            where GroupID in (select GroupID from GroupMembers
            where UserID = @UserID) 
            `)
        return result.recordset
    }

    static async AddGroup(groupname, creatorid, publickey, membersnumber, description, link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupName', sql.NVarChar, groupname)
        request.input('CreatorID', sql.Int, creatorid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('MembersNumber', sql.Int, membersnumber)
        request.input('Description', sql.NVarChar, description)
        request.input('Link', sql.NVarChar, link)
        const result = await request.query(`
            insert into Groups(GroupName, CreatorID, PublicKey, MembersNumber, Description, Link) 
            values(@GroupName, @CreatorID, @PublicKey, @MembersNumber, @Description, @Link);
            SELECT SCOPE_IDENTITY() AS GroupID;
            `)
        return result.recordset
    }

    static async UpdateGroup(groupid, groupname, creatorid, publickey, membersnumber, description, link) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('GroupName', sql.NVarChar, groupname)
        request.input('CreatorID', sql.Int, creatorid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('MembersNumber', sql.Int, membersnumber)
        request.input('Description', sql.NVarChar, description)
        request.input('Link', sql.NVarChar, link)
        const result = await request.query('update Groups set GroupName = @GroupName, CreatorID = @CreatorID, PublicKey = @PublicKey, MembersNumber = @MembersNumber, Description = @Description, Link = @Link where GroupID = @GroupID')
        return result.recordset
    }

    static async DeleteGroup(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('delete from Groups where GroupID = @GroupID')
        return result.recordset
    }

    static async UpdatePublicKey(groupid, publickey) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('PublicKey', sql.NVarChar, publickey)
        const result = await request.query('update Groups set PublicKey = @PublicKey where GroupID = @GroupID')
        return result.recordset
    }

    static async IncreaseNumber(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('update Groups set MembersNumber += 1 where GroupID = @GroupID')
        return result.recordset
    }

    static async DecreaseNumber(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('update Groups set MembersNumber -= 1 where GroupID = @GroupID')
        return result.recordset
    }
}

module.exports = GroupModel