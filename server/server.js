import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from "./config/database.js";



//handling uncought expception
process.on("uncaughtException",(err)=>{
    console.log("Error: "+err.message)
    console.log("shutting down the server due to uncought expception")
    
        process.exit(1);

})

connectDB()
const server=app.listen(process.env.PORT,()=>{
    console.log("server is working on "+ process.env.port)
})


//unhandeled Promis rejection

process.on("unhandledRejection",(err)=>{
    console.log("Error: "+err.message)
    console.log("shutting down the server due to Unhandled Promis Rejection")
    server.close(()=>{
        process.exit(1);
    })
})