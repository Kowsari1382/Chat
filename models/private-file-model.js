const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class PrivateFileModel {
    static async getFiles() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from PrivateFile')
        return result.recordset
    }

    static async getFileByFileID(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('select * from PrivateFile where FileID = @FileID')
        return result.recordset
    }

    static async getFileBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from PrivateFile where SenderID = @SenderID')
        return result.recordset
    }

    static async getFileByReceiverID(receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateFile where ReceiverID = @ReceiverID')
        return result.recordset
    }

    static async getFileBySenderReceiverID(senderid, receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateFile where SenderID = @SenderID and ReceiverID = @ReceiverID')
        return result.recordset
    }

    static async getUnseenFiles(receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateFile where ReceiverID = @ReceiverID and Seen = 0')
        return result.recordset
    }

    static async AddFile(senderid, receiverid, filepath, encodedkey, iv, seen) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ReceiverID', sql.Int, receiverid)
        request.input('FilePath', sql.NVarChar, filepath)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        const result = await request.query('insert into PrivateFile(SenderID, ReceiverID, FilePath, EncodedKey, IV, Seen) values(@SenderID, @ReceiverID, @FilePath, @EncodedKey, @IV, @Seen)')
        return result.recordset
    }

    static async DeleteFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('delete from PrivateFile where FileID = @FileID')
        return result.recordset
    }

    static async SeenFile(fileid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('FileID', sql.Int, fileid)
        const result = await request.query('update PrivateFile set Seen = 1 where FileID = @FileID')
        return result.recordset
    }
}

module.exports = PrivateFileModel