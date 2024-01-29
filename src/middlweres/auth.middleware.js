import { User } from "../models/user.models";
import { ApiError } from "../utils/apierror";
import { asynchandler } from "../utils/asynchandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asynchandler(async(req,res,next)=>{
    try{
        const token = req.cookie?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
    
    if(!token){
        throw new ApiError(401,"AccessToken not present\nUnauthorised token")

    }
    //await is optional here
    const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN-SECRET)

    const foundUser = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!foundUser){
        throw new ApiError(401,"Invalid Access Token")
    }
    req.user = foundUser;
    next()
    }catch(error){
        throw new ApiError(401,error?.massage || "Invalid access token")
    }
})