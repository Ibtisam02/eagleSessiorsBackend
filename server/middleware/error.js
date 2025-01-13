import { ErrorHandler } from "../utils/errorHandler.js";


export default (err,req,res,next)=>{
    err.statusCode=err.statusCode || 500;
    err.message=err.message||"internal server error"

    //cast error form mongodb (not an Id)

    if (err.name==="CastError") {
        const message=`Resource Not Found! Invalid ${err.path}`
        err=new ErrorHandler(message,400)
    }

    //mongodb duplicate key error
    if (err.code===11000) {
        const message=`Duplicat ${Object.keys(err.keyValue)} entered`
        err=new ErrorHandler(message,400)
    }
    // wrong jwt error

    if (err.name==="JsonWebTokenError") {
        const message=`json web token is invalid please try again`
        err=new ErrorHandler(message,400)
    }
    if (err.name==="TokenExpiredError") {
        const message=`json web token is expired please try again`
        err=new ErrorHandler(message,400)
    }

    res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}