// #region Imports:packages
require("dotenv").config();
const cors = require("cors")
const express = require("express");
const mongoose = require("mongoose");
const path = require("path")
const crypto = require("crypto");
const http = require("http");
const axios = require("axios")
const fs = require("fs")
const bcrypt = require("bcrypt");
// #endregion Imports:packages

// #region Imports:local
// #endregion Imports:local

// #region Models
const User  = require("./models/userModel");
const Wallet  = require("./models/walletModel");


// #endregion Models

// #region Controllers
const {sendNotification}  = require("./controllers/notificationController");


// #endregion Models

// #region App Initializations
const app = express();
app.set("view engine", "ejs");
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({storage:storage})
const server = http.createServer(app);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static("uploads"));
app.use(cors());
app.use(express.json());

// #endregion App Initializations End

// #region Routes
// const nameRoutes = require("./routes/nameRoutes");
// const userRoutes = require("./routes/userRoutes");
// app.use("/user", userRoutes);
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);
const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);
const jobRoutes = require("./routes/jobRoutes");
app.use("/job", jobRoutes);
const assetRoutes = require("./routes/assetRoutes");
const { sendMail } = require("./utils/mailing");
app.use("/asset", assetRoutes);


app.use("/", (req, res) => {
  res.send(`${req.method} Route ${req.path} not found !`);
});


// #endregion Routes
 
// #region MongoDb connection
mongoose
.connect(process.env.DATABASE_URL)
.then(() => {
    server.listen(process.env.PORT, () => {
    console.log("Connected to DB and Server is Running");
    });
})
.catch((error) => {
    console.log(error);
});
// #endregion MongoDb connection




// #region Custom Manipulation
async function mainAdminValidation(req, res){
  var mainAdmin = await User.findOne({role: "main-admin"})
  if(!mainAdmin){
    username= "elite cuir main admin"
    email= "elitecuirstore@gmail.com"
    password= "Qwerty123456!@"
    phone= "+923211802109"
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
  
    const user = await User.create({
      username,
      email,
      password: hashed,
      phone,
      role: "main-admin"
    });
    const wallet = await Wallet.create({ userid: user._id });
    await user.updateOne({
      walletid: wallet._id,
    });
    if(!mainAdmin){
      var body = 
      `<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Dear ${username || 'User'},</p>
          <p>Your new main admin account for the Elite Cuir Employee Portal (ECEP) has been created.</p><br></br>
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
      await sendMail("New main admin account created", "elitecuirstore@gmail.com", body);
    }
  }
}



mainAdminValidation()

// #endregion Custom server manipulation


async function manual(){
  var users = await User.find({});
  await Promise.all(
    users.map(async user => {
      await sendNotification(user._id, "test notificatio", "sent by server side", "test", "modelid for test")
    })
  )
}

async function manualLoop(){
  setInterval(async ()=>{
    await manual();
  }, 5000)
}

// manualLoop();