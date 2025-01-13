
import dotenv from "dotenv"
dotenv.config({ path: './.env' });
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})




const uploadOnCludinary=async (localFilePath)=>{
    try {
      
        if (!localFilePath) return null
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto",
            folder:"mern Ecommerce store 2nd"
        })
        
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally sved file
        console.log("error while uploading files",error)
        return null;
    }
}


const deleteImagesFromCloudiary = async (publicIds) => {
    try {
      const results = await Promise.all(
        publicIds.map((id) => cloudinary.uploader.destroy(id))
      );
      console.log('Images deleted:', results);
    } catch (error) {
      console.error('Error deleting images:', error);
    }
  };

export {uploadOnCludinary,deleteImagesFromCloudiary}