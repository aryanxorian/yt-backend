import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from  "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken  = user.generateAccessToken();
        const refreshToken  = user.generateRefreshToken();
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const resgisterUser = asyncHandler( async (req, res) => {

    const {fullName, email, username, password} = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() ==="")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({$or: [{ email }, { username }]});

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.legth > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if ( !avatarLocalPath ) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({fullName, avatar: avatar, 
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong with registering a user");
    }

    return res.status(201).json(new ApiResponse(200,createdUser, "User registered successfully"))


});

const loginUser =  asyncHandler(async(req,res) => {
    const {email, username, password} = req.body
    
    if (!(username ||email)) {
        throw new ApiError(400,"Username or email required")
    } 

    const user = await User.findOne({ 
        $or: [{username}, {email}]
    })
    // const user  = await User.find()
    // console.log(user)
    if (!user) {
        throw new ApiError(404, "User doesn't exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Password incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken,refreshToken
        }, "User logged in Successfully")
    )
})

const logoutUser  = asyncHandler(async (req,res) => {
     User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken : undefined
        }
     },{
        new :true
     })

     const options = {
        httpOnly: true,
        secure:true
     }

     return res.status(200).clearCookie("refreshToken", options).clearCookie("accessToken", options).json(new ApiResponse(200, {}, "User Logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request");
    }
    try {
        const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is invalid or used");
        } 
        const options = {
            httpOnly: true,
            secure:true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user?._id)
    
        return res.status(200).cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(new ApiResponse(200,{
            accessToken,
            refreshToken: newRefreshToken,
    
        }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {resgisterUser, loginUser, logoutUser, refreshAccessToken} ;