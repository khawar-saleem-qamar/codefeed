const dotenv = require("dotenv");
const nodemailer = require('nodemailer');
dotenv.config();
const twilio = require('twilio');
const { paymentTransationModel } = require("../../Database/models/paymenttransaction.model.js");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com', // Zoho SMTP server
    port: 587, // TLS port
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL, // Your Zoho email
        pass: process.env.EMAILPASSWORD // Use an app-specific password from Zoho
    }
});

let OTP = ()=> {
  const max = 999999; // Maximum 4-digit number
  const min = 100000; // Minimum 4-digit number
  // return Math.floor(Math.random() * (max - min + 1)) + min;
  return 123456;
}

async function getRandomString(model) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  
  let randomString = "";
  do{
      for (let i = 0; i < 3; i++) {
      randomString += letters.charAt(Math.floor(Math.random() * letters.length));
      }
  
      randomString += digits.charAt(Math.floor(Math.random() * digits.length));
  
      let remainingChars = [];
      
      let lettersToAdd = Math.floor(Math.random() * 2) + 1; 
      let digitsToAdd = 8 - lettersToAdd;
  
      for (let i = 0; i < lettersToAdd; i++) {
      remainingChars.push(letters.charAt(Math.floor(Math.random() * letters.length)));
      }
  
      for (let i = 0; i < digitsToAdd; i++) {
      remainingChars.push(digits.charAt(Math.floor(Math.random() * digits.length)));
      }
  
      remainingChars = remainingChars.sort(() => 0.5 - Math.random());
      randomString += remainingChars.join('');
  }while(
      model == "paymentTransation" 
      ? await paymentTransationModel.findOne({orderid: randomString}) 
      : true)
        // ? await orderModel.findOne({id: randomString}) 
        // : model == "orangemoneypayment" 
        //   ? await orangemoneypaymentModel.findOne({orderid: randomString}) 
        //   : true)

  return randomString;
}

const twilioClient = twilio(accountSid, authToken);

const sendOtp = async ({ phone, otp, channel = 'sms' }) => {
  try {
    if(!["sms", "whatsapp", "email"].includes(channel)){np
      return {
        success: false,
        error: "Invalid channel it can be sms, whatsapp or email"
      };
    }else{
      if(channel == "email"){
        console.log("phone: ", phone)
        const mailOptions = {
            from: process.env.EMAIL,
            to: phone, // Recipient's email
            subject: `SolveIt OTP`,
            text: `Your SolveIt OTP is: ${otp}.`
        };

        // Send email
        try{
          var mailResponse = await transporter.sendMail(mailOptions);
          console.log('Email sent:', mailResponse);
          return {
            success: true,
            message: "Email send"
          }
        }catch(e){
          console.log("error: ", e);
          return {
            success: false,
            error: e.message
          };
        }
      }else{
        const formattedNumber = channel === 'whatsapp' ? `whatsapp:${phone}` : phone;
    
        const message = await twilioClient.messages.create({
          body: `Your SolveIt OTP is: ${otp}`,
          from: channel === 'whatsapp'
            ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
            : process.env.TWILIO_PHONE_NUMBER,
          to: formattedNumber
        });
    
        return {
          success: true,
          sid: message.sid
        };
      }
    }
  } catch (error) {
    console.error("Twilio Error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {OTP, getRandomString, sendOtp}