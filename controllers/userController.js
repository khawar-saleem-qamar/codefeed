const User = require("../models/userModel");
// const Wallet = require("../models/walletModel");
require('dotenv').config();
const OtpPass = require("../models/otpPassModel");
const {tryCatch, error, validateUser} = require("../helpers/otherHelpers")
const fs = require("fs")
const path = require("path")


const nodemailer = require("nodemailer");
const {is, sendRes} = require("../helpers/otherHelpers")

const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Wallet = require("../models/walletModel");

require("dotenv").config();

const getUserById = async (req, res) => {
  try {
    const userid = req.params.userid;
    let user = await User.findById(userid).select("-password");
    if (!user) {
      throw Error("User Not Found");
    }

    user = user.toObject();
    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

const getUserWalletById = async (req, res) => {
  try {
    const userid = req.params.userid;
    const {type} = req.query
    let wallet = await Wallet.findOne({userid}).lean()
    if (!wallet) {
      throw Error("Wallet Not Found");
    }

    if(type != "history"){
      delete wallet.history
    }

    res.status(200).json({
      success: true,
      wallet
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getProfilePic = async (req, res) => {
  try {
    const userid = req.params.userid;

    let url = await getPicUrl(userid);

    res.status(200).json({
      url,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

const getPicUrl = async (id) => {
  try {
    let user = await User.findById(id);
    if (!user) {
      return("user deleted")
    }
    return user.profilePic;
  } catch (error) {
    throw error.message;
  }
};

const setProfilePic = async (req, res) => {
    try {
      const {userid} = req.body
      let user = await User.findById(userid);
      if (!user) {
        return("user deleted")
      }
  
      var profilePic = null;
      if (req.file) {
        profilePic = `uploads/profilePictures/${req.file.filename}`
        await user.updateOne({
            profilePic
        })
      }else{
        res.status(400).json({
        success: false,
        error: "Image not found"
      })
      }
      res.status(200).json({
        success: true,
        profilePic
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
};

const setBio = async (req, res) => {
    try {
      const {userid, bio} = req.body
      let user = await User.findById(userid);
      if (!user) {
        return("user deleted")
      }
      await user.updateOne({
        bio
      })
      res.status(200).json({
        success: true,
        bio
      })
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
    }
};

const deleteUser = async (req, res) => {
  try {
    var {userid} = req.body;
    var user = await User.findById(userid);
    if(user){
      await user.deleteOne();
      var models = [Activity, Wallet];
      await Promise.all(
        models.map(async model => {
          var modelDatas = await model.find({
            $or: [
              { userid: userid },
              { otheruserid: userid }
            ]          
          })
          await Promise.all(
            modelDatas.map(async modelData => {
              await modelData.deleteOne();
              console.log("model: ", model, ", Model data: ", modelData);
            })
          )
        })
      )
    }
      res.status(200).json({
        message: "User deleted successfully"
      });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
}

const generateShareableProfileLink = async (req, res) => {
  const userId = req.params.userId;
  var user = await User.findById(userId);
  if(user){
    const deepLink = `${process.env.BASE_URL}/OtherProfileView/${userId}`;
    res.send({ deepLink });
  }else{
    res.send("Invalid userid");
  }
}

const deleteUserByUsername = async (req, res) => {
    try {
        var {username} = req.body;
        var user = await User.findOne({username});
        if(user){
            var userid = user._id;
          await user.deleteOne();
          var models = [Activity, Wallet];
          await Promise.all(
            models.map(async model => {
              var modelDatas = await model.find({
                $or: [
                  { userid: userid },
                  { otheruserid: userid }
                ]          
              })
              await Promise.all(
                modelDatas.map(async modelData => {
                  await modelData.deleteOne();
                  console.log("model: ", model, ", Model data: ", modelData);
                })
              )
            })
          )
        }
          res.status(200).json({
            message: "User deleted successfully"
          });
      } catch (err) {
        res.status(400).json({
          error: err.message
        });
      }
}


  const searchUsers = async (req, res) => {
    try {
      const search = req.body.search || "";
      const { pageNo, perPage, userid, friends } = req.body;
      let users;

      if (friends) {
        const user = await User.findById(userid);

        if (!user) {
          throw Error("User Not Found");
        }
        const friends = user.friends;

        users = await User.find({
          _id: { $in: friends },
          username: { $regex: search, $options: "i" },
        })
          .select("-password")
          .skip((pageNo - 1) * perPage)
          .limit(perPage);
      } else {
        users = await User.find({
          username: { $regex: search, $options: "i" },
        })
          .select("-password")
          .skip((pageNo - 1) * perPage)
          .limit(perPage);
      }

      users = await Promise.all(
        users.map(async (user) => {
          user = user.toObject();
          const url = await getPicUrl(user._id);
          user.profilePic = url;
          return user;
        })
      );

      res.status(200).json({
        users,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  }

  const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select("-password");
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      res.status(200).json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  const getUserProfile = async (req, res) => {
    const {userid} = req.params;
    var user = await User.findById(userid);
    if(!user){
      throw Error("User not Found");
    }

    var updatedUser = user.toObject();
    updatedUser.dob = new Date(updatedUser.dob);
    delete updatedUser.password
    delete updatedUser.walletid
    delete updatedUser.fcmtoken

    res.status(200).json(updatedUser);
  }

  const setTestStarted = async (req, res)=>{
    try{
      var {userid} = req.body
  
      var user = await User.findById(userid);
      if(!user){
        sendRes(res, 400, false, "User not found");
        return;
      }
  
      await user.updateOne({
        testStarted: ++user.testStarted
      })

      sendRes(res, 200, true, ++user.testStarted)
    }catch(error){
      sendRes(res, 400, false, error.message);
    }
  }

  const setTestEnded = async (req, res)=>{
    try{
      var {userid, seconds} = req.body
  
      var user = await User.findById(userid);
      if(!user){
        sendRes(res, 400, false, "User not found");
        return;
      }
  
      await user.updateOne({
        testEnded: ++user.testEnded,
        typedSeconds: seconds
      })

      sendRes(res, 200, true, ++user.testEnded)
    }catch(error){
      sendRes(res, 400, false, error.message);
    }
  }

  async function updateProfile(req, res){
    try{
      var {username, bio, requestNotifications, chatNotifications, requestAnnouncements, updateNotifications, userid} = req.body;
      var user = await User.findById(userid);
      if(!user){
        sendRes(res, 400, false, "User not found");
      }
      var body = req.body;
      if(requestNotifications){
        requestNotifications = true;
        body["requestNotifications"]  = true; 
      }else{
        requestNotifications = false;
        body["requestNotifications"] = false;
      }
      if(chatNotifications){
        chatNotifications = true;
        body["chatNotifications"]  = true; 
      }else{
        chatNotifications = false;
        body["chatNotifications"] = false;
      }
      if(updateNotifications){
        updateNotifications = true;
        body["updateNotifications"]  = true; 
      }else{
        updateNotifications = false;
        body["updateNotifications"] = false;
      }
      if(requestAnnouncements){
        requestAnnouncements = true;
        body["requestAnnouncements"]  = true; 
      }else{
        requestAnnouncements = false;
        body["requestAnnouncements"] = false;
      }
      await user.updateOne({
        username,
        bio,
        requestNotifications,
        chatNotifications,
        requestAnnouncements,
        updateNotifications
      })
      if (req.file) {
        var randomName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");
        var fileName = randomName();
        const specificFileName = fileName+"."+req.file.originalname.split(".")[req.file.originalname.split(".").length - 1];
        const filePath = path.join(__dirname, '../uploads/profilePictures/', specificFileName);

        // Save the file manually
        fs.writeFile(filePath, req.file.buffer, async (err) => {
            if (err) {
                sendRes(res, 500, false, "unable to upload image")
                return;
            }
            var saveFileName = `profilePictures/${specificFileName}`
            body["profilePic"] = `${req.protocol}://${req.get('host')}/uploads/${saveFileName}`;
            await user.updateOne({
              profilePic: saveFileName
            })
            sendRes(res, 200, true, req.body)
            return;
        });
      }
      if(req.file){
        return;
      }
      sendRes(res, 200, true, req.body);
    }catch(error){
      sendRes(res, 200, false, error.message)
    }
  }

module.exports = {
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
};