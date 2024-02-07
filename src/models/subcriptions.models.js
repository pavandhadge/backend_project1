import mongoose  from "mongoose";
import { Schema } from "mongoose";

const SubcriptonSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is scribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one who is owns the channel
        ref:"User"
    }
},{timestamps:true})

export const Subcripton = mongoose.model("Subscription",SubcriptonSchema)