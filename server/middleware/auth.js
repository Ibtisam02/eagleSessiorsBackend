import User from "../models/userModel.js";
import { ErrorHandler } from "../utils/errorHandler.js";
import asyncHandler from "./asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJWT =asyncHandler(async (req,res,next)=>{
    const {token}=req.cookies;
    if (!token) {
        return next( new ErrorHandler("Please Login to access this resource",401))
    }

    let decodedToken=jwt.verify(token,process.env.JWT_SECRET)
    if (!decodedToken) {
        return next( new ErrorHandler("Invalid Token!",401))
    }
    req.user=await User.findById(decodedToken.id)

    next();
})


const authorizeRole=(...roles)=>{
    return (req,res,next)=>{
        if (!roles.includes(req.user.role)) {
            return next( new ErrorHandler(`Role ${req.user.role} is not allowed to access this resource`,403))
        }
        next();
    }

}

export {verifyJWT,authorizeRole}