const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const UnderSignup = require("../models/underSignupModel");
const {is, sendRes} = require("../helpers/otherHelpers")
const crypto = require("crypto");
const fs = require("fs")
const path = require("path");

const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const qs = require("querystring");
const {catchAsyncError} = require("../utils/catchAsyncError");
const { AppError } = require("../utils/AppError");


require("dotenv").config();


const elitecuircompanyemail = process.env.EMAIL;
const elitecuircompanyemailpassword = process.env.PASSWORD;

const mailTransport = nodemailer.createTransport({
 host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: elitecuircompanyemail,
    pass: elitecuircompanyemailpassword,
  },
  tls: { rejectUnauthorized: false },
});

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_String);
};

const loginUser = async (req, res) => {
  var { identifier, password } = req.body;
  try {
    if (!identifier || !password) {
      sendRes(res, 400, false, "All Fields must be filled");
      return;
    }
    var user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { username: identifier }
      ],
    });

    if (!user) {
      sendRes(res, 400, false, "Incorrect usename or password");
      return;
    }


    if (!user.password) {
      sendRes(res, 400, false, "Please complete your signup first!");
      return;
    }

    const token = createToken(user._id);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      sendRes(res, 400, false, "Incorrect usename or password");
      return;
    }

    var userObject = user.toObject();
    delete userObject.password;
    // userObject["profilePic"] = `${req.protocol}://${req.get('host')}/${user.profilePic}`


    sendRes(res, 200, true, { user: userObject, token });
  } catch (error) {
    console.log(error);
    sendRes(res, 400, false, error.message);
  }
};
  
const signupUser = async (req, res) => {
  const { username, email, phone, password, role } = req.body;

  try {
    const existsEmail = await User.findOne({ email });
    const existsUsername = await User.findOne({ username });
    const existsPhone = await User.findOne({ phone });

    if (existsEmail) {
      sendRes(res, 400, false, "Email already in use");
      return;
    }
    if (existsUsername) {
      sendRes(res, 400, false, "Username unavailable");
      return;
    }
    if (existsPhone) {
      sendRes(res, 400, false, "Phone unavailable");
      return;
    }
    
    if(role == "main-admin"){
      const adminExist = await User.findOne({ role: "admin" });
      if(adminExist){
        sendRes(res, 400, false, "Main adming exist");
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      role
    });
    const wallet = await Wallet.create({ userid: user._id });
    await user.updateOne({
      walletid: wallet._id,
    });

    accountCreationEmail(email, username, password, phone);

    sendRes(res, 200, true, "Signup complete and email sent");
  } catch (error) {
    sendRes(res, 400, false, error.message );
  }
};

function OTP() {
  const min = 1000; // Minimum 4-digit number
  const max = 9999; // Maximum 4-digit number
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const resetPasswordRequest = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      sendRes(res, 400, false, "Email not found");
      return;
    }

    const otp = OTP();
    var prevOtp = await UnderSignup.findOne({email});
    if(prevOtp){
      await prevOtp.deleteOne();
    }

    await UnderSignup.create({ email, otp });

    await sendMail(otp, user.username, email, "password reset");

    sendRes(res, 200, true, "Verification Pending. OTP Sent");
  } catch (error) {
    sendRes(res, 400, false, error.message);
  }
}

const verifyPasswordOtp = async (req, res) => {
  try {
    const email = req.body.email;
    const otp = req.body.otp;

    const user = await User.findOne({ email });
    if (!user) {
      sendRes(res, 400, false, "User Not Found");
    }

    const otpDocument = await UnderSignup.findOne({ email, otp });

    if (otpDocument) {
      await otpDocument.deleteOne();
      sendRes(res, 200, true, "Verification Successful");
    } else {
      sendRes(res, 400, false, "Verification Failed");
    }
  } catch (error) {
    sendRes(res, 400, false, error.message );
  }
}

const newPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });
    if (!user) {
      sendRes(res, 400, false, "User Not Found");
    }
    const newpassword = req.body.newpassword;
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newpassword, salt);
    await user.updateOne({
      password: hashed,
    });
    sendRes(res, 200, true, "Password Reset");
  } catch (error) {
    sendRes(res, 400, false, error.message );
  }
}

const resendPasswordOTP = async (req, res) => {
  try {
    const email = req.body.email;
    const otpDoc = await UnderSignup.findOne({ email });

    if (!otpDoc) {
      sendRes(res, 400, false, "Try resetting again");
      return;
    }
    
    const otp = OTP();
    
    await otpDoc.updateOne({
      otp,
    });
    
    const user = await User.findOne({ email });
    if(!user){
      sendRes(res, 400, false, "Account not found");
      return;
    }
    // let username;

    // if (user) {
    //   username = user.username;
    // }

    await sendMail(otp, user.username, email, "password reset");

    sendRes(res, 200, true, "OTP Resent");
  } catch (error) {
    sendRes(res, 400, false, error.message );
  }
}

const setFcmToken = async (req, res) => {
  try {
    const { userid, fcmtoken } = req.body;
    console.log("fcmtoken: ", fcmtoken)
    const user = await User.findById(userid);

    if (!user) {
      sendRes(res, 400, false, "User Not Found");
      return;
    }

    if (!user.fcmtoken.includes(fcmtoken)) {
      await user.updateOne({
        fcmtoken: [fcmtoken],
      });
    }

    sendRes(res, 200, true, "Token Added");
  } catch (error) {
    sendRes(res, 400, false, error.messages);
  }
};

const deleteFcmToken = async (req, res) => {
  try {
    const { userid, fcmtoken } = req.body;
    const user = await User.findById(userid);

    console.log("userid: ", userid);
    console.log("fcmtoken: ", fcmtoken);
    console.log("user: ", user);
    if (!user) {
      sendRes(res, 400, false, "User Not Found");
      return;
    }

    if (user.fcmtoken.includes(fcmtoken)) {
      await user.updateOne({
        $pull: { fcmtoken },
      });
    }

    sendRes(res, 200, true, "Token Deleted");
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

async function sendMail(subject, email, body) {
  try {
    const mailOptions = {
      from: `"Elite Cuir" <${elitecuircompanyemail}>`,
      to: email,
      subject,
      html: body,
    };

    await mailTransport.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
}

async function accountCreationEmail(email, username, password, phone){
  var subject = "Elite Cuir Employee Portal account created"
  var body = 
  `<html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <p>Dear ${username || 'User'},</p>
        <p>Your new account for the Elite Cuir Employee Portal (ECEP) has been created.</p><br></br>
        <p>Following is the login information you can use to access your account:</p>
        <ul>
          <li><strong>Username:</strong> ${username || 'none'}</li>
          <li><strong>Email:</strong> ${email || 'none'}</li>
          <li><strong>Phone:</strong> ${phone || 'none'}</li>
          <li><strong>Password:</strong> ${password || 'none'}</li>
        </ul><br></br>
        <p>If you have any issues or queries, feel free to contact us:</p>
        <ul>
          <li><strong>Email:</strong> company@elitecuir.com</li>
          <li><strong>WhatsApp:</strong> +923211802109</li>
        </ul><br></br>
        <p>Best regards,<br></br>Team Elite Cuir</p>
      </body>
    </html>`

  sendMail(subject, email, body);
}


const protectedRoutes = catchAsyncError(async (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError("Authorization header missing or invalid", 401));
  }

  // Extract the token
  const token = authHeader.replace('Bearer ', '');
  if (!token) return next(new AppError("Token was not provided!", 401));
  var decoded = jwt.verify(token,process.env.JWT_String)

  let user = await User.findById(decoded.id);
  if (!user) return next(new AppError("Invalid user", 404));

  if (user.passwordChangedAt) {
    let passwordChangedAt = parseInt(user.passwordChangedAt.getTime() / 1000);
    if (passwordChangedAt > decoded.iat)
      return next(new AppError("Invalid token", 401));
  }
  // console.log(decoded.iat, "-------------->",passwordChangedAt);

  req.user = user;
  next();
});

const allowedTo = (...roles) => {
  return catchAsyncError(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError(
          `You are not authorized to access this route. Your are ${req.user.role}`,
          401
        )
      );
    next();
  });
};

module.exports = {
  signupUser,
  setFcmToken,
  deleteFcmToken,
  loginUser,
  resetPasswordRequest,
  verifyPasswordOtp,
  newPassword,
  resendPasswordOTP,
  protectedRoutes,
  allowedTo
};
