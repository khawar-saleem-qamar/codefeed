const Activity = require("../models/activityModel");
const User = require("../models/userModel");
const Campaign = require("../models/campaignModel");
const {sendNotification} = require("../controllers/notificationController")
const {aws} = require("../helpers/otherHelpers")

const createActivity = async (
  userid,
  text,
  campaignid,
  otheruserid,
  notification = null
) => {
  try {
    const user = await User.findById(userid);
    
    if (!user) {
      throw Error("User Not Found");
    }
    var campaign;
    var otheruser;
    if(otheruserid){
      otheruser = await User.findById(otheruserid);
      if (!otheruser) {
        throw Error("User Not Found");
      }
  
      await Activity.create({
        userid,
        otheruserid,
        text
      });
    }else if(campaignid){
      campaign = await Campaign.findById(campaignid);
      if (!campaign) {
        throw Error("Campaign Not Found");
      }
  
      await Activity.create({
        userid,
        text,
        campaignid
      });
    }

    if(notification){
      if(campaign){
        sendNotification(userid, campaign.title, text, notification.type, campaignid)
      }
    }

    // var socketActivity = global.onlineSockets.get(sender._id.toString());

    // if (socketActivity) {
    //   var unreadCount = await Activity.countDocuments({otheruserid: userid, read: false})
    //   for (const socket of socketActivity) {
    //     if (socket) {
    //       socket.emit("unreadActivitiesCount", {
    //         count: unreadCount
    //       });
    //     }
    //   }
    // }
  } catch (error) {
    console.error(error);
  }
};


const deleteActivity = async (
  req, res
) => {
  try {
    const {activityid} = req.body;
    await Activity.deleteOne({
      _id: activityid
    });

    res.status(200).json({
      message: "Activity delete successfully"
    });
  } catch (error) {
    console.error(error);
  }
};

const getActivities = async (req, res) => {
  try {
    const userid = req.params.userid;
    const user = await User.findById(userid);
    if (!user) {
      throw Error("User Nots Found");
    }
    let activities = await Activity.find({ userid })
      .sort({ createdAt: "desc" })
      .select("_id");

    activities = await Promise.all(
      activities.map((id) => {
        return getActivity(id);
      })
    );

    res.status(200).json({
      activities,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

const { getPicUrl } = require("./userController");

const getActivity = async (id) => {
  let activity = await Activity.findById(id);

  try {
    if (!activity) {
      throw Error("Activity Not Found");
    }
    activity = activity.toObject();

    var otherUser = null ;
    var otherUserProfilePic = null;
    if(activity.otheruserid){
      otherUser = await User.findById(activity.otheruserid);
      otherUserProfilePic = await getPicUrl(activity.otheruserid);
      if(otherUser){
        activity.otherUsername = otherUser.username;
      }
      activity.otherUserProfilePic = otherUserProfilePic;
    }
    

    const userProfilePic = await getPicUrl(activity.userid);
    activity.userProfilePic = userProfilePic;
    activity.text = activity.text;

    if (activity.campaignid) {
      const campaign = await Campaign.findById(activity.campaignid);
      if (campaign) {
        activity.otherUsername = campaign.title
        activity.thumbnail = await getCampaignThumbnail(campaign._id);
      }
    }

    return activity;
  } catch (error) {
    console.error(error);
    console.log(activity);
  }
};

// get thumbnail of post
const getThumbnail = async (id) => {
  try {
    let post = await Post.findById(id);

    if (!post) {
      throw Error("Post Not Found");
    }

    const content = post.contents[0];
    console.log("content: ", post.contents)

    if (content) {
      var data = await aws.getLinkFromAWS(content);
      console.log("data:",data);
      return data;
    }
    return "";
  } catch (error) {
    throw new Error(error.message);
  }
};

const getCampaignThumbnail = async (id) => {
  try {
    let campaign = await Campaign.findById(id);

    if (!campaign) {
      throw Error("campaign Not Found");
    }

    const content = campaign.brandLogo;

    if (content) {
      var data = await aws.getLinkFromAWS(content);
      return data;
    }
    return "";
  } catch (error) {
    throw new Error(error.message);
  }
};


const markAsRead = async (req, res) => {
  try{
  var {userid} = req.body;
  var activities = await Activity.find({
    otheruserid: userid,
    read: false
  });

  await Promise.all(
    activities.map(async activity =>{
      await activity.updateOne({
          read: true
      })
    })
  )

  res.status(200).json({
    message: "chat read"
  })
}catch(err){
  res.status(400).json({
    message: err.message
  })
}
}

const getUnreadCount = async (req, res) => {
  try{
      const userid = req.params.userid
  var activities = await Activity.countDocuments({
    otheruserid: userid,
    read: false
  });
 
  res.status(200).json({
    count: activities
  })
}catch(err){
  res.status(400).json({
    message: err.message
  })
}
}


module.exports = { createActivity, getActivities, deleteActivity,markAsRead,getUnreadCount };
