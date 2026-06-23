const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class GroupKeysModel {
    static async AddGroupKey(groupid, userid, publickey, encodedprivatekey, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        request.input('UserID', sql.Int, userid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('EncodedPrivateKey', sql.NVarChar, encodedprivatekey)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into GroupKeys(GroupID, UserID, PublicKey, EncodedPrivateKey, KeyVersion) values(@GroupID, @UserID, @PublicKey, @EncodedPrivateKey, @KeyVersion)')
        return result.recordset
    }

    static async getGroupKeysByPublicKey(publickey) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('PublicKey', sql.NVarChar, publickey)
        const result = await request.query('select * from GroupKeys where PublicKey = @PublicKey')
        return result.recordset
    }

    static async getGroupKeysByGroupUserID(groupid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        reques.input('UserID', sql.Int, userid)
        const result = await request.query('select * from GroupKeys where GroupID = @GroupID and UserID = @UserID')
        return result.recordset
    }
}

module.exports = GroupKeysModel