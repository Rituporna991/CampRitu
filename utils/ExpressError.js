class ExpressError extends Error{
    constructor(message,statusCode){
        super();
        this.message=message;
        this.statudCode=statusCode;
    }
}

module.exports=ExpressError;