import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new mongoose.Schema(
    {
        videoFile : {
            type : String ,//Cloudinary -> returns URL which can be used when required
            required : true
        },
        thumbnail:{
            type : String ,//Cloudinary -> returns URL which can be used when required
            required : true
        },
        title:{
            type : String ,
            required : true
        },
        description:{
            type : String ,
            required : true
        },
        duration:{
            type : Number ,
            required : true
        },
        view : {
            type : Number ,
            default : 0
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : mongoose.Schema.Types.ObjectId,
            ref : "User"
        }

    },
    {timestamps:true}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)