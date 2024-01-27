import {asynchandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/apierror.js"
import  {User}  from "../models/user.models.js";
import {uploadonCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiresponse.js";
import { response } from "express";

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

export {registerUser}