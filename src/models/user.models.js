import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt"

const UserSchema = new Schema(
    {
        username :{
            type: String,
            required : true,
            unique : true,
            lowercase : true,
            trim:true,
            index:true//really useful in searching 
        },
        email :{
            type: String,
            required : true,
            unique : true,
            lowercase : true,
            trim:true,
        },
        fullname:{
            type: String,
            required : true,
            trim:true,
            index:true//really useful in searching 
        },
        avatar:{
            type:String, //Cloudnary url
            required : true //not necessary but corrently use tru

        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"vedio"//change later with real referance
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshToken:{
            type:String
        }
    },{timestamps:true}
)

UserSchema.pre("save",async function (next){
    if(this.isModified("password")){
        
        this.password = await bcrypt.hash(this.password,10)
        next()
    }
    next()
})

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

UserSchema.methods.generateAccessToken = function(){
    jwt.sign(
        {
            _id:this._id,
            email:this.email,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN-SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY 
        }
    )
}

UserSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN-SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY 
        }
    )
}
export const User = mongoose.model("User",UserSchema)