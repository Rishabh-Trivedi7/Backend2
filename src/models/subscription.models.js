import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,//one whoo is subscribing is also a user
        ref:"User"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,//channel bhi ek user hi hai
        ref:"User"
    }
},
    {timestamps:true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)