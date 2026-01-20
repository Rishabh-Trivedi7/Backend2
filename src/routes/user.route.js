import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

// Secured Route (Sirf logged-in users ke liye)
router.route("/logout").post(verifyJWT, logoutUser) 
// Pehle verifyJWT chalega, phir logoutUser


export default router


