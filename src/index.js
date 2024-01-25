import mongoose from "mongoose"
import dotenv from "dotenv"
import dbConnect from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
    path:"./env"
})

dbConnect()
.then(()=>{
    app.on("error",(error)=>{
        console.log("error :",error)
        throw error
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log("server is running at port = "+`${process.env.PORT}`)
    })
})
.catch((err)=>{
        console.log("MONGOO DB connection failed !!!!",err)

})