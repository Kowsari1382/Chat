const { PoolPromise, sql } = require('../utilities/PoolPromiseDB')

class UserModel{
    static async getUsers(){
        const pool = await PoolPromise
        const request = pool.request()
        const result = await request.query('select * from Users')
        return result.recordset
    }

    static async getUserByID(userid){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query('select * from Users where UserID = @UserID')
        return result.recordset
    }

    static async getUserByUsername(username){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Username', sql.NVarChar, username)
        const result = await request.query('select * from Users where Username = @Username')
        return result.recordset
    }

    static async getUserByNumber(number){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Number', sql.NVarChar, number)
        const result = await request.query('select * from Users where Number = @Number')
        return result.recordset
    }

    static async getUserByLink(link){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Link', sql.NVarChar, link)
        const result = await request.query('select * from Users where Link = @Link')
        return result.recordset
    }

    static async UserInfo(userid){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query(`
            select UserID, Username, Link, Bio, PublicKey from Users
            where UserID in (
            select ReceiverID from PrivateMessage
            where SenderID = @UserID
            union
            select ReceiverID from PrivateFile
            where SenderID = @UserID
            union
            select SenderID from PrivateMessage
            where ReceiverID = @UserID
            union
            select SenderID from PrivateFile
            where ReceiverID = @UserID
            )
            `)
        return result.recordset
    }

    static async AddUser(username, password, link, bio, email, number, role, publickey){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('Username', sql.NVarChar, username)
        request.input('Password', sql.NVarChar, password)
        request.input('Link', sql.NVarChar, link)
        request.input('Bio', sql.NVarChar, bio)
        request.input('Email', sql.NVarChar, email)
        request.input('Number', sql.NVarChar, number)
        request.input('Role', sql.NVarChar, role)
        request.input('PublicKey', sql.NVarChar, publickey)
        const result = await request.query('insert into Users(Username, Password, Link, Bio, Email, Number, Role, PublicKey) values(@Username, @Password, @Link, @Bio, @Email, @Number, @Role, @PublicKey)')
        return result.recordset
    }

    static async UpdateUser(userid, username, password, link, bio, email, number, role){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        request.input('Username', sql.NVarChar, username)
        request.input('Password', sql.NVarChar, password)
        request.input('Link', sql.NVarChar, link)
        request.input('Bio', sql.NVarChar, bio)
        request.input('Email', sql.NVarChar, email)
        request.input('Number', sql.NVarChar, number)
        request.input('Role', sql.NVarChar, role)
        const result = await request.query('update Users set Username = @Username, Password = @Password, Link = @Link, Bio = @Bio, Email = @Email, Number = @Number, Role = @Role where UserID = @UserID')
        return result.recordset
    }

    static async DeleteUser(userid){
        const pool = await PoolPromise
        const request = pool.request()
        request.input('UserID', sql.Int, userid)
        const result = await request.query('delete from Users where UserID = @UserID')
        return result.recordset
    }
}

module.exports = UserModel