import mongoose from "mongoose";
const bannerScheema= new mongoose.Schema({
    image:{
            url:{
                type:String,
                required:true
            },
            publicId:{
                type:String,
                required:true
            }
        
    },
    title:{
        type:String,
        default:""
    },
    description:{
        type:String,
        default:""
    },
    subTitle:{
        type:String,
        default:""
    },
    buttonText:{
        type:String,
        default:""
    },
    link:{
        type:String,
        default:""
    }
},{timestamps:true})

const Banner=mongoose.model("Banner",bannerScheema)

export default Banner