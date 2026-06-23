const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class ChannelFileModel {
    static async getFiles() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from ChannelFile')
        return result.recordset
    }

    static async getFileByFileID(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('select * from ChannelFile where FileID = @FileID')
        return result.recordset
    }

    static async getFileBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from ChannelFile where SenderID = @SenderID')
        return result.recordset
    }

    static async getFileByChannelID(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from ChannelFile where ChannelID = @ChannelID')
        return result.recordset
    }

    static async getFileBySenderChannelID(senderid, channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from ChannelFile where SenderID = @SenderID and ChannelID = @ChannelID')
        return result.recordset
    }

    static async getUnseenFiles(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select FileID, ChannelFile.ChannelID, FilePath, EncodedKey, IV, Date, Seen, KeyVersion from ChannelFile, ChannelMembers
            where ChannelFile.ChannelID = ChannelMembers.ChannelID and ChannelMembers.UserID = @UserID and ChannelFile.Seen = 0
            `)
        return result.recordset
    }

    static async getFilebyUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select FileID, ChannelFile.ChannelID, FilePath, EncodedKey, IV, Date, Seen, KeyVersion from ChannelFile, ChannelMembers
            where ChannelFile.ChannelID = ChannelMembers.ChannelID and ChannelMembers.UserID = @UserID
            `)
        return result.recordset
    }

    static async AddFile(senderid, channelid, filepath, encodedkey, iv, seen, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ChannelID', sql.Int, channelid)
        request.input('FilePath', sql.NVarChar, filepath)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into ChannelFile(SenderID, ChannelID, FilePath, EncodedKey, IV, Seen, KeyVersion) values(@SenderID, @ChannelID, @FilePath, @EncodedKey, @IV, @Seen, @KeyVersion)')
        return result.recordset
    }

    static async DeleteFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('delete from ChannelFile where FileID = @FileID')
        return result.recordset
    }

    static async SeenFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('update ChannelFile set Seen = 1 where FileID = @FileID')
        return result.recordset
    }
}

module.exports = ChannelFileModel