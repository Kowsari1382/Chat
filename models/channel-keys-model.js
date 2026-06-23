const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class ChannelKeysModel {
    static async AddChannelKey(channelid, userid, publickey, encodedprivatekey, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        request.input('UserID', sql.Int, userid)
        request.input('PublicKey', sql.NVarChar, publickey)
        request.input('EncodedPrivateKey', sql.NVarChar, encodedprivatekey)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into ChannelKeys(ChannelID, UserID, PublicKey, EncodedPrivateKey, KeyVersion) values(@ChannelID, @UserID, @PublicKey, @EncodedPrivateKey, @KeyVersion)')
        return result.recordset
    }

    static async getChannelKeysByPublicKey(publickey) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('PublicKey', sql.NVarChar, publickey)
        const result = await request.query('select * from ChannelKeys where PublicKey = @PublicKey')
        return result.recordset
    }

    static async getChannelKeysByChannelUserID(channelid, userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        reques.input('UserID', sql.Int, userid)
        const result = await request.query('select * from ChannelKeys where ChannelID = @ChannelID and UserID = @UserID')
        return result.recordset
    }
}

module.exports = ChannelKeysModel