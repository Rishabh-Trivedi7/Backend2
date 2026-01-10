import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

// hve aa cors ne cookie parse , ek vaar app bani jai pchi configure thy ske
// sau thi pehla security guard (cors)


app.use(cors({
    //cors_origin env ma fronted app nu URL nakhvanu hoi , * etle badha frontend thi request accept thava mandse 
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit:"16kb"})) // json formet ma je kai data aavse enu config

app.use(express.urlencoded({limit : "16kb",extended:true})) //URL thi deta aave ena mate pn encoder hoi , like space nu %20 kri nakhe to express ne kevu pde k e samje ne configure kriye express ne jethi e deta accept kri ske easily


app.use(express.static("public")) //pdf ke images aave to aapda server ma store krvu hoi to public folder ma rakhi skye ne te gme te access pn kri ske


app.use(cookieParser()) //cookieparser thi server => user na browser ni cookies access kri ske ne set pn kri ske


//router import
import userRouter from './routes/user.route.js'

//router declaration
app.use("/api/v1/users",userRouter)

export {app}