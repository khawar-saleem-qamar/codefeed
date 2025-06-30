const admin = require("firebase-admin");
const User = require("../models/userModel")
const {truncateString} = require("../helpers/otherHelpers")
const {google} = require('googleapis')
const axios = require("axios")
require("dotenv").config();

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
const serviceAccount = require("../firebaseEliteCuir.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const sendNotification = async(userid, title, body, type = null, modelid = null, sender = null)=>{
  if(sender){
    if(sender == userid){
      return;
    }
  }
  try{
      const user = await User.findById(userid)
      if(!user){
          throw Error ("User Not Found")
      }

      title = truncateString(title, 30)
      body = truncateString(body, 60)

      await Promise.all(
          user.fcmtoken.map(async(token)=>{
              const key = serviceAccount;
              const jwtClient = new google.auth.JWT(
              key.client_email,
              null,
              key.private_key,
              SCOPES,
              null
              );
              jwtClient.authorize(async function(err, tokens) {
              if (err) {
                  throw Error("Error in Auth2.0 access token")
              }

              var message
              if(type){
                message = {
                  message: {
                    token,
                    notification: {
                      title,
                      body,
                    },
                    data: {
                      type,
                      modelid
                    }
                  },
                };
              }else{
                message = {
                  message: {
                    token,
                    notification: {
                      title,
                      body,
                    }
                  },
                };
              }
            
              try {
                const response = await axios.post(
                  `https://fcm.googleapis.com/v1/projects/${key.project_id}/messages:send`,
                  message,
                  {
                    headers: {
                      'Authorization': `Bearer ${tokens.access_token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                console.log('Message sent successfully:', response.data);
              } catch (error) {
                console.error('Error sending message:', error);
              }
              });
          })
      )

  }catch(error){
      console.error(error)
  }
}

module.exports = {sendNotification}