import mongoose from "mongoose";



const connectDB=()=>{
    mongoose.connect(`${process.env.DB_URI}/${process.env.DB_NAME}`,)
    .then((data)=>{
        console.log(`mongodb is connected with server: ${data.connection.host}`)
        
    })
    
}

export default connectDB