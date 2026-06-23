class ErrorClass extends Error{
    constructor(StatusCode, Message, ErrorCode){
        super(Message)
        this.statuscode = StatusCode
        this.errorcode = ErrorCode
    }
}

module.exports = ErrorClass