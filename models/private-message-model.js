const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class PrivateMessageModel {
    static async getMessages() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from PrivateMessage')
        return result.recordset
    }

    static async getMessageByMessageID(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('select * from PrivateMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async getMessageBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from PrivateMessage where SenderID = @SenderID')
        return result.recordset
    }

    static async getMessageByReceiverID(receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateMessage where ReceiverID = @ReceiverID')
        return result.recordset
    }

    static async getMessageBySenderReceiverID(senderid,receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateMessage where SenderID = @SenderID and ReceiverID = @ReceiverID')
        return result.recordset
    }

    static async getUnseenMessages(receiverid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ReceiverID', sql.Int, receiverid)
        const result = await request.query('select * from PrivateMessage where ReceiverID = @ReceiverID and Seen = 0')
        return result.recordset
    }

    static async getLastMessages(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            WITH AllPrivate AS (
    SELECT 
        MessageID AS ItemID,
        SenderID,
        ReceiverID,
        EncodedText AS Content,
        EncodedKey,
        IV,
        Date,
        Seen,
        'Message' AS type
    FROM PrivateMessage
    WHERE SenderID = @UserID OR ReceiverID = @UserID

    UNION ALL

    SELECT 
        FileID AS ItemID,
        SenderID,
        ReceiverID,
        FilePath AS Content,
        EncodedKey,
        IV,
        Date,
        Seen,
        'File' AS type
    FROM PrivateFile
    WHERE SenderID = @UserID OR ReceiverID = @UserID
),
Ranked AS (
    SELECT 
        a.*,
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE 
                    WHEN a.SenderID = @UserID THEN a.ReceiverID
                    ELSE a.SenderID
                END
            ORDER BY a.Date DESC
        ) AS rn
    FROM AllPrivate a
)
SELECT 
    ItemID,
    SenderID,
    ReceiverID,
    Content,
    EncodedKey,
    IV,
    Date,
    Seen,
    type
FROM Ranked
WHERE rn = 1
            `)
        return result.recordset
    }

    static async AddMessage(senderid, receiverid, encodedtext, encodedkey, iv, seen) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ReceiverID', sql.Int, receiverid)
        request.input('EncodedText', sql.NVarChar, encodedtext)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        const result = await request.query('insert into PrivateMessage(SenderID, ReceiverID, EncodedText, EncodedKey, IV, Seen) values(@SenderID, @ReceiverID, @EncodedText, @EncodedKey, @IV, @Seen)')
        return result.recordset
    }

    static async UpdateMessage(messageid, encodedtext, encodedkey, iv, seen) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        request.input('EncodedText', sql.NVarChar, encodedtext)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        const result = await request.query('update PrivateMessage set EncodedText = @EncodedText, EncodedKey = @EncodedKey, IV = @IV, Seen = @Seen where MessageID = @MessageID ')
        return result.recordset
    }

    static async DeleteMessage(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('delete from PrivateMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async SeenMessage(messageid){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID' ,sql.Int, messageid)
        const result = await request.query('update PrivateMessage set Seen = 1 where MessageID = @MessageID')
        return result.recordset
    }
}

module.exports = PrivateMessageModel