import mongoose from "mongoose";
const testimonialScheema= new mongoose.Schema({
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
},{timestamps:true})

const Testimonial=mongoose.model("Testimonial",testimonialScheema)

export default Testimonial