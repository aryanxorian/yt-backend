import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY.API_KEY, 
  api_secret: process.env.CLOUDINARY.API_SECRET 
});

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.v2.uploader.upload(localFilePath,{
            resource_type: "auto"
        });

        console.log("file is uploaded on cloudinary")
        console.log(response)

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the local temp file if error in upload method
        return null
    }
}

export {uploadOnCloudinary};