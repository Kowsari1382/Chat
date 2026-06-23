const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class GroupMessageModel {
    static async getMessages() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from GroupMessage')
        return result.recordset
    }

    static async getMessageByMessageID(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('select * from GroupMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async getMessageBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from GroupMessage where SenderID = @SenderID')
        return result.recordset
    }

    static async getMessageByGroupID(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from GroupMessage where GroupID = @GroupID')
        return result.recordset
    }

    static async getMessageBySenderGroupID(senderid, groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query('select * from GroupMessage where SenderID = @SenderID and GroupID = @GroupID')
        return result.recordset
    }

    static async getUnseenMessages(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select MessageID, GroupMessage.GroupID, EncodedText, EncodedKey, IV, Date, Seen, KeyVersion from GroupMessage, GroupMembers
            where GroupMessage.GroupID = GroupMembers.GroupID and GroupMembers.UserID = @UserID and GroupMessage.Seen = 0
            `)
        return result.recordset
    }

    static async getMessagebyUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select MessageID, GroupMessage.GroupID, EncodedText, EncodedKey, IV, Date, Seen, KeyVersion from GroupMessage, GroupMembers
            where GroupMessage.GroupID = GroupMembers.GroupID and GroupMembers.UserID = @UserID
            `)
        return result.recordset
    }

    static async getLastMessage(groupid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('GroupID', sql.Int, groupid)
        const result = await request.query(`
            select top 1 * from (
            select *, 'Message' as type from GroupMessage
            where GroupID = @GroupID
            union all
            select *, 'File' as type from GroupFile
            where GroupID = @GroupID
            ) t
            order by t.Date desc
            `)
        return result.recordset
    }

    static async getLastMessages(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            WITH AllGroupItems AS (
    SELECT 
        MessageID AS ItemID,
        SenderID,
        GroupID,
        EncodedText AS Content,
        EncodedKey,
        IV,
        Seen,
        KeyVersion,
        Date,
        'Message' AS type
    FROM GroupMessage
    WHERE GroupID IN (SELECT GroupID FROM GroupMembers WHERE UserID = @UserID)

    UNION ALL

    SELECT 
        FileID AS ItemID,
        SenderID,
        GroupID,
        FilePath AS Content,
        EncodedKey,
        IV,
        Seen,
        KeyVersion,
        Date,
        'File' AS type
    FROM GroupFile
    WHERE GroupID IN (SELECT GroupID FROM GroupMembers WHERE UserID = @UserID)
),
Ranked AS (
    SELECT
        a.*,
        ROW_NUMBER() OVER (
            PARTITION BY GroupID
            ORDER BY Date DESC
        ) AS rn
    FROM AllGroupItems a
)
SELECT
    ItemID,
    SenderID,
    GroupID,
    Content,
    EncodedKey,
    IV,
    Seen,
    KeyVersion,
    Date,
    type
FROM Ranked
WHERE rn = 1
            `)
        return result.recordset
    }

    static async AddMessage(senderid, groupid, encodedtext, encodedkey, iv, seen, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('GroupID', sql.Int, groupid)
        request.input('EncodedText', sql.NVarChar, encodedtext)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into GroupMessage(SenderID, GroupID, EncodedText, EncodedKey, IV, Seen, KeyVersion) values(@SenderID, @GroupID, @EncodedText, @EncodedKey, @IV, @Seen, @KeyVersion)')
        return result.recordset
    }

    static async UpdateMessage(messageid, encodedtext, encodedkey, iv, seen, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        request.input('EncodedText', sql.NVarChar, encodedtext)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('update GroupMessage set EncodedText = @EncodedText, EncodedKey = @EncodedKey, IV = @IV, Seen = @Seen, KeyVersion = @KeyVersion where MessageID = @MessageID ')
        return result.recordset
    }

    static async DeleteMessage(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('delete from GroupMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async SeenMessage(messageid){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID' ,sql.Int, messageid)
        const result = await request.query('update GroupMessage set Seen = 1 where MessageID = @MessageID')
        return result.recordset
    }
}

module.exports = GroupMessageModel