import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto" 
const userScheema= new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter Your Name"],
        maxLength:[30,"Name Cannot Exceed 30 Characters"],
        minLength:[4,"Name should have atleast 4 characters"],
    },
    email:{
        type:String,
        required:[true,"Please Enter Your Email"],
        unique:true,
        validate:[validator.isEmail,"Please Enter a Valid Email"]
    },
    password:{
        type:String,
        required:[true,"Please Enter Your Password"],
        minLength:[8,"Password should have atleast 8 characters"],
        select:false,
    },
    role:{
        type:String,
        default:"user"
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date
},{timestamps:true})

userScheema.pre("save",async function (next) {
    if (!this.isModified("password")) {
        next()
    }
    this.password=await bcrypt.hash(this.password,10)
    next()
})

userScheema.methods.generateToken=  function () {
    const token= jwt.sign({id:this._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRY
    })

    return token
}
userScheema.methods.comparePassword= async function (enteredPassword) {
    const passwordCompare= await bcrypt.compare(enteredPassword,this.password)
    
    return passwordCompare
}

//genrating password reset token

userScheema.methods.getResetPasswordToken=  function () {
    const resetToken= crypto.randomBytes(20).toString("hex");
    //hasing and adding to user scheema

    this.resetPasswordToken= crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire=  Date.now()+15*60*1000;

    return resetToken
}
const User=mongoose.model("User",userScheema)

export default User