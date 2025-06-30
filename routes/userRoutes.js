const express = require('express')
const router = express.Router()

const { uploadSingleFile } = require("../multer/multer.js");


// const {getUserById , getUserProfile,getAllFollowersAndFollowing, followUser, blockUser, searchUsers, getAllFollowers, getAllFollowing, getBlocked, setProfilePic, getProfilePic, deleteProfilePic,changePassword,editProfile,getAllUsers,resetPasswordRequest,verifyPasswordOtp ,newPassword,setVerified,getVideos,getUserReels ,getImages, deleteUser, deleteUserByUsername, generateShareableProfileLink} 
const {
    getProfilePic,
    setProfilePic,
    getUserById,
    deleteUser,
    deleteUserByUsername,
    generateShareableProfileLink,
    searchUsers,
    getAllUsers,
    getUserProfile,
    setTestStarted,
    setTestEnded,
    updateProfile,
    setBio,
    getUserWalletById
} = require("../controllers/userController")


// const requireAuth = require("../middleware/requireAuth")
// router.use(requireAuth)

router.get("/getUserById/:userid",getUserById)
router.get("/getUserWalletById/:userid",getUserWalletById)
// router.get("/getUserProfile/:userid",getUserProfile)
router.get("/getAllUsers",getAllUsers)

router.get("/searchUsers", searchUsers)

router.get("/getProfilePic/:userid", getProfilePic)
router.patch("/setProfilePic", uploadSingleFile("image", "profilePictures"), setProfilePic)
router.patch("/setBio", setBio)
router.patch("/setTestStarted", setTestStarted);
router.patch("/setTestEnded", setTestEnded);


router.delete("/deleteUser", deleteUser);
router.get("/deleteUser", deleteUserByUsername);
router.get("/getUserProfile/:userid", getUserProfile);
router.get("/generateShareableProfileLink/:userId", generateShareableProfileLink);
// router.post("/updateProfile", upload.single("profilePic"), updateProfile)


module.exports = router

