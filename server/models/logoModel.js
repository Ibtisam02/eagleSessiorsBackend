import mongoose from "mongoose";
const LogoScheema= new mongoose.Schema({
    logo:{
        logoLink:{
            type:String,
            required:true
        },
        publicId:{
            type:String,
            required:true
        },

    }
})

const Logo = mongoose.model("Logo", LogoScheema);

export { Logo };