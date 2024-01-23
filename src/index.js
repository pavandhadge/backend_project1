import mongoose from "mongoose"
import dotenv from "dotenv"
import dbConnect from "./db/index.js"

dotenv.config({
    path:"./env"
})

dbConnect()