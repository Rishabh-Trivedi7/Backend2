// require('dotenv').config()
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({path:'./env'})

connectDB()
























/*
import express from "express"

const app = express()

( async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) => { 
            console.log("ERROR : app cant coonect to db",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App listening at ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("ERROR  : " , error);
        throw err
    }
} )()

*/

