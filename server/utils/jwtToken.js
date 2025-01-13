
const sendToken=async(user,statusCode,res)=>{
    
    
    
    const token=user.generateToken();
    console.log(token);
    console.log(process.env.COOKIE_EXPIRY);
    
    let options={
        expires:new Date(Date.now() + process.env.COOKIE_EXPIRY*24*60*60*1000),
        httpOnly:true,
        sameSite: 'None', 
        secure: true
    }

    res.status(statusCode).cookie("token",token,options).json({
        success:true,
        user,
        token
    })
}

export {sendToken}