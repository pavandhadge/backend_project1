import { Router } from "express";
import { changeCurrentPass,
        getCurrentUser,
        getUserChannelProfile,
        getWatchHistory, 
        loginUser, 
        logoutUser,
        registerUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage 
        } from "../controllers/user.controller.js";
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
userRouter.route("/change_password").post(verifyJWT,changeCurrentPass)
userRouter.route("/current_user").get(verifyJWT,getCurrentUser)
userRouter.route("/update_account").patch(verifyJWT,updateAccountDetails)
userRouter.route("/update_avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
userRouter.route("/update_cover_image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
//using params
userRouter.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
userRouter.route("/watch_history").get(verifyJWT,getWatchHistory)
export default userRouter