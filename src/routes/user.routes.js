import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlweres/multer.middleware.js";
import { verifyJWT } from "../middlweres/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

const userRouter = Router()
userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1,
        },
        {
            name:"coverImage",
            maxCount:1,
        }
    ]),
    registerUser)
userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)

export default userRouter