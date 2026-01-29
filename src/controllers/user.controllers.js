import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken = refreshToken
        // Yahan humne bola: "Sirf refresh token save karo, 
        // baaki fields (jo required hain par abhi nahi bheji) unhe check mat karo."
        await user.save({validateBeforeSave : false})
        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access tokens")
    }
}

const registerUser = asyncHandler( async (req,res) =>{

    //steps to follow :
    //get user details from frontend
    //validation - not empty
    //check if user already exists : username,email
    //check for images , check for avatar
    //upload them to cloudinary,avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation 
    //return res

    //note:
    //destructuring object : 
    // earlier : const user = {
    //     username: "hitesh",
    //     email: "hitesh@chai.com",
    //     role: "admin"
    // }
    // const username = user.username;
    // const email = user.email;

    //destructuring : 
    // const { username, email } = user;


    const {fullname,email,username,password} = req.body
    console.log("email : ",email);

    // if(fullname===""){
    //     throw new ApiError(400,"full name is required");
    // }
    if (
        [fullname,email,username,password].some((field)=> field?.trim()==="")
    ) {
        throw new ApiError(400,"All Fields are required")
    }

    const existedUser  =await User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required , upload it !");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Avatar file is required , upload it !");
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering a user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req,res) => {
    // req body -> data
    // username or email 
    // find the user
    // check password
    // access and refresh token
    // send cookies

    const {email , username, password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or email is required")
    }
    const user=await User.findOne({
        $or:[{email},{username}]
    })
    if (!user) {
        throw new ApiError(404,"user does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Password incorrect , Invalid user credentials")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    const loggeInUser =await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure : true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggeInUser,accessToken,refreshToken
            },
            "user logged in Successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {new:true}
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAcccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used")   
        }
    
        const options = {
            httpOnly:true,
            secure : true
        }
    
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,{
                accessToken,
                refreshToken:newRefreshToken 
            },"Access Token refresh")
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "something went wrong while refreshing access token")
    }


})

const changeCurrentPassword = asyncHandler(async (req,res)=> {
    const {oldPassword , newPassword} = req.body

    const user = User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }
    this.password=newPassword

    await user.save({validateBeforeSave:true})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"Current user fetched successfully")
})

const updateAccountDetail = asyncHandler(async (req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath =req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar =await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading the avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    )
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar successfully changed"))
})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const CoverImageLocalPath =req.file?.path
    if(!CoverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }
    const coverImage =await uploadOnCloudinary(CoverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading the Cover Image")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    )
    return res
    .status(200)
    .json(new ApiResponse(200,user,"cover image successfully uploaded"))
})
export {registerUser,
        loginUser,
        logoutUser,
        refreshAcccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetail,
        updateUserAvatar,
        updateUserCoverImage
}