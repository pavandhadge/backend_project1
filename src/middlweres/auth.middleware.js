import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asynchandler(async(req,res,next)=>{
    try{
        // console.log("00000")
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // console.log("00000")
        console.log(token)
        if(!token){
            throw new ApiError(401,"AccessToken not present\nUnauthorised token")

        }
        //await is optional here
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        // console.log("00000")
        const foundUser = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!foundUser){
            throw new ApiError(401,"Invalid Access Token user not found")
        }
        req.user = foundUser;
        next()
    }catch(error){
        throw new ApiError(401,error?.massage || "Invalid access token")
    }
})