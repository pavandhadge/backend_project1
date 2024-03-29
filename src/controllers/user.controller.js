import {asynchandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/apierror.js"
import  {User}  from "../models/user.models.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiresponse.js";
import { response } from "express"; 
import  jwt  from "jsonwebtoken";



const generateAccessTokenandRefreshToken = async(userId)=>{
    try{
        const foundUser = await User.findById(userId)
        // console.log("1")
        console.log(foundUser)
        const AccessToken = foundUser.generateAccessToken()
        // console.log("1")
        const RefreshToken = foundUser.generateRefreshToken()
        // console.log("1")
        
        foundUser.refreshToken = RefreshToken
        await foundUser.save({validateBeforeSave:false})
        return {AccessToken,RefreshToken}
    }catch(error){
        throw new ApiError(500,"something went wrong while generation access and refresh token")
    }
}




const registerUser = asynchandler(async(req,res)=>{
    //get user details from frontend
    //validation-not empty
    //check if user already exist:username and email
    //check for images
    //ceck for avatar
    //upload image to cloudnary,check avatar in cloudinary
    //create user object-create entry in db
    //remove password and frereshtoken field from response
    //check for response i.e user creation
    //return response


    //getting user details
    const {fullname,email,username,password}=req.body;
    //console.log("email :",email);

    //old method
    /*
    if(fullname===""){
        throw new ApiError(400,"fullname is empty");
    }
    if(username===""){
        throw new ApiError(400,"fullname is empty");
    }
    if(email===""){
        throw new ApiError(400,"fullname is empty");
    }
    if(password===""){
        throw new ApiError(400,"fullname is empty");
    }
    */

    //new method
    if(
        [fullname,email,password,username].some((fields)=>
        fields?.trim()==="")
    ){
        throw new ApiError(400,"Please fill all compalsery fields")
    }

    const existingUser = await User.findOne({
        $or:[{username} , {email}] //$or: is used to give any arguments at once ,see on google 
    })
    if(existingUser){
        throw new ApiError(409,"User with username and email Already exists")
    }

    //multer give file access to us
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //console.log(`${avatarLocalPath}`)
    //console.log(`${coverImageLocalPath}`)
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){//is array chaeck if argument is an array
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is compalsery")
    }

    const avatar = await uploadonCloudinary(avatarLocalPath)
    const coverImage = await uploadonCloudinary(coverImageLocalPath)



    if(!avatar){
        throw new ApiError(400,"avatar file is required")
    }

    const newUser = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage:coverImage?.url || "",// ? used to give indication that it is opetionsl
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"//desect given item by default all the items are selected
    )

    if(!createdUser){
        throw new ApiError(500,"something went wrong at user creation")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registered successfully")
    )

})

const loginUser = asynchandler(async (req,res)=>{
    //req.body ->data
    //username or email use
    //find the user
    //check password
    //access and refresh token generate
    //send these tokens in sequre cookies
    const {email,username,password}=req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    const foundUser = await User.findOne({
        $or:[{email},{username}]
    })
    if(!foundUser){
        throw new ApiError(404,"user not exist")
    }

    const isPasswordVailid = await foundUser.isPasswordCorrect(password)
    if(!isPasswordVailid){
        throw new ApiError(401,"INvaild password")
    }

    const {AccessToken,RefreshToken}=await generateAccessTokenandRefreshToken(foundUser._id)

    //updating token by calling in db
    //const loggedinUser = await User.findById(foundUser._id).select("-password -refreshToken")

    //updating by using refrence of given user

    //sending cookie
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken",AccessToken,options)
    .cookie("refreshToken",RefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loginUser,AccessToken,RefreshToken
            },
            "user loged in successfully"
        )
    )
})

const logoutUser = asynchandler(async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new : true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(
        new ApiResponse(200,{},"User loged out successfully")
    )
})

const refreshAccessToken = asynchandler(async(req,res)=>{

    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incommingRefreshToken){
        throw new ApiError(40,"untauthorised request")
    }

try {
        const decodedtoken = jwt.verify(
            incommingRefreshToken,
            process.env.ACCESS_TOKEN_SECRET
        )
        const founduser = await User.findById(decodedtoken?._id)
        if(!founduser){
            throw new ApiError(),"Invalid refresh token"
        }
    
        if(incommingRefreshToken != founduser?.refreshToken){
            throw new ApiError(400,"INvalid refresh token refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
        const {newaccessToken,newrefreshToken}=await generateAccessTokenandRefreshToken(founduser._id)
        return res.status(200).cookie("accessToken",newaccessToken).cookie("refreshToken",newrefreshToken).json(
            new ApiResponse(200,{newaccessToken,newrefreshToken},"accesstoken refreshed successfully")
        )
} catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
}
})


const changeCurrentPass = asynchandler(async(req,res)=>{
    const {oldPassword,newPassword}= req.body
    const founduser = await User.findById(req.user?._id)
    const ispasswordcorrect = await founduser.isPasswordCorrect(oldPassword)
    if(!ispasswordcorrect){
        throw new ApiError(400,"Invalid old password")
    }
    User.password = newPassword
    await User.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password Change Successfull"))
})

const getCurrentUser = asynchandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const updateduser = await User.findById(
        req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            }
        },
        {new:true}
        ).select("-password")

        return res.status(200)
        .json(new ApiResponse(200,updateduser,"Account datails updated successfully"))

})

const updateUserAvatar = asynchandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file not found --missing")
    }
    const uploadAvatar = await uploadonCloudinary(avatarLocalPath)
    if(!uploadAvatar.url){
        throw new ApiError(400,"cloudinary - avatar image not uploaded successfuly")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar : uploadAvatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200,updatedUser,"Avatar image updated successfully"))


    //make delete util for old avatar image
})





const updateUserCoverImage = asynchandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file not found --missing")
    }
    const uploadcoverImage = await uploadonCloudinary(coverImageLocalPath)
    if(!uploadcoverImage.url){
        throw new ApiError(400,"cloudinary - cover image not uploaded successfuly")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : uploadcoverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).
    json(new ApiResponse(200,updatedUser,"Cover image updated successfully"))

})


const getUserChannelProfile = asynchandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")

    }
    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribedTo"               
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedTo:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"subscribers.subscriber"]},
                        then :true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelSubscribedTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel not exist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

//agrigation pipeline directly goes to db so write proper syntax
const getWatchHistory=asynchandler(async(req,res)=>{
    const founduser = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200,
            founduser[0].watchHistory,
            "watch history fetched successfully")
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPass,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile
}