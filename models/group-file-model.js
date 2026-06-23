const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class GroupFileModel {
    static async getFiles() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from GroupFile')
        return result.recordset
    }

    static async getFileByFileID(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('select * from GroupFile where FileID = @FileID')
        return result.recordset
    }

    static async getFileBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from GroupFile where SenderID = @SenderID')
        return result.recordset
    }

    static async getFileByGroupID(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from GroupFile where GroupID = @GroupID')
        return result.recordset
    }

    static async getFileBySenderGroupID(senderid, groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from GroupFile where SenderID = @SenderID and GroupID = @GroupID')
        return result.recordset
    }

    static async getUnseenFiles(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select FileID, GroupFile.GroupID, FilePath, EncodedKey, IV, Date, Seen, KeyVersion from GroupFile, GroupMembers
            where GroupFile.GroupID = GroupMembers.GroupID and GroupMembers.UserID = @UserID and GroupFile.Seen = 0
            `)
        return result.recordset
    }

    static async getFilebyUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select FileID, GroupFile.GroupID, FilePath, EncodedKey, IV, Date, Seen, KeyVersion from GroupFile, GroupMembers
            where GroupFile.GroupID = GroupMembers.GroupID and GroupMembers.UserID = @UserID
            `)
        return result.recordset
    }

    static async AddFile(senderid, groupid, filepath, encodedkey, iv, seen, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('GroupID', sql.Int, groupid)
        request.input('FilePath', sql.NVarChar, filepath)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into GroupFile(SenderID, GroupID, FilePath, EncodedKey, IV, Seen, KeyVersion) values(@SenderID, @GroupID, @FilePath, @EncodedKey, @IV, @Seen, @KeyVersion)')
        return result.recordset
    }

    static async DeleteFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('delete from GroupFile where FileID = @FileID')
        return result.recordset
    }

    static async SeenFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('update GroupFile set Seen = 1 where FileID = @FileID')
        return result.recordset
    }
}

module.exports = GroupFileModel