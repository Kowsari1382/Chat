const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class ChannelMessageModel {
    static async getMessages() {
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from ChannelMessage')
        return result.recordset
    }

    static async getMessageByMessageID(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('select * from ChannelMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async getMessageBySenderID(senderid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        const result = await request.query('select * from ChannelMessage where SenderID = @SenderID')
        return result.recordset
    }

    static async getMessageByChannelID(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from ChannelMessage where ChannelID = @ChannelID')
        return result.recordset
    }

    static async getMessageBySenderChannelID(senderid, channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query('select * from ChannelMessage where SenderID = @SenderID and ChannelID = @ChannelID')
        return result.recordset
    }

    static async getUnseenMessages(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select MessageID, ChannelMessage.ChannelID, EncodedText, EncodedKey, IV, Date, Seen, KeyVersion from ChannelMessage, ChannelMembers
            where ChannelMessage.ChannelID = ChannelMembers.ChannelID and ChannelMembers.UserID = @UserID and ChannelMessage.Seen = 0
            `)
        return result.recordset
    }

    static async getMessagebyUserID(userid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select MessageID, ChannelMessage.ChannelID, EncodedText, EncodedKey, IV, Date, Seen, KeyVersion from ChannelMessage, ChannelMembers
            where ChannelMessage.ChannelID = ChannelMembers.ChannelID and ChannelMembers.UserID = @UserID
            `)
        return result.recordset
    }

    static async getLastMessage(channelid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('ChannelID', sql.Int, channelid)
        const result = await request.query(`
            select top 1 * from (
            select *, 'Message' as type from ChannelMessage
            where ChannelID = @ChannelID
            union all
            select *, 'File' as type from ChannelFile
            where ChannelID = @ChannelID
            ) t
            order by t.Date desc
            `)
        return result.recordset
    }

    static async getLastMessages(userid) {
        const pool = await PoolPromise;
        const request = pool.request();
        request.input('UserID', sql.Int, userid);
        const result = await request.query(`
        WITH AllChannelItems AS (
            SELECT 
                MessageID AS ItemID,
                SenderID,
                ChannelID,
                EncodedText AS Content,
                EncodedKey,
                IV,
                Seen,
                KeyVersion,
                Date,
                'Message' AS type
            FROM ChannelMessage
            WHERE ChannelID IN (SELECT ChannelID FROM ChannelMembers WHERE UserID = @UserID)

            UNION ALL

            SELECT 
                FileID AS ItemID,
                SenderID,
                ChannelID,
                FilePath AS Content,
                EncodedKey,
                IV,
                Seen,
                KeyVersion,
                Date,
                'File' AS type
            FROM ChannelFile
            WHERE ChannelID IN (SELECT ChannelID FROM ChannelMembers WHERE UserID = @UserID)
        ),
        Ranked AS (
            SELECT
                a.*,
                ROW_NUMBER() OVER (
                    PARTITION BY ChannelID
                    ORDER BY Date DESC
                ) AS rn
            FROM AllChannelItems a
        )
        SELECT
            ItemID,
            SenderID,
            ChannelID,
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

    static async AddMessage(senderid, channelid, encodedtext, encodedkey, iv, seen, keyversion) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('SenderID', sql.Int, senderid)
        request.input('ChannelID', sql.Int, channelid)
        request.input('EncodedText', sql.NVarChar, encodedtext)
        request.input('EncodedKey', sql.NVarChar, encodedkey)
        request.input('IV', sql.NVarChar, iv)
        request.input('Seen', sql.Bit, seen)
        request.input('KeyVersion', sql.NVarChar, keyversion)
        const result = await request.query('insert into ChannelMessage(SenderID, ChannelID, EncodedText, EncodedKey, IV, Seen, KeyVersion) values(@SenderID, @ChannelID, @EncodedText, @EncodedKey, @IV, @Seen, KeyVersion)')
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
        const result = await request.query('update ChannelMessage set EncodedText = @EncodedText, EncodedKey = @EncodedKey, IV = @IV, Seen = @Seen, KeyVersion = @KeyVersion where MessageID = @MessageID ')
        return result.recordset
    }

    static async DeleteMessage(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('delete from ChannelMessage where MessageID = @MessageID')
        return result.recordset
    }

    static async SeenMessage(messageid) {
        const pool = await PoolPromise
        const request = pool.request()
        request.input('MessageID', sql.Int, messageid)
        const result = await request.query('update ChannelMessage set Seen = 1 where MessageID = @MessageID')
        return result.recordset
    }
}

module.exports = ChannelMessageModel