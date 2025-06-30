const User = require("../models/userModel");
// const { Upload } = require("@aws-sdk/lib-storage");
const Client = require('ssh2-sftp-client');
const sftp = new Client();
const path = require("path")

// const {
//   S3Client,
//   PutObjectCommand,
//   GetObjectCommand,
//   CopyObjectCommand,
//   DeleteObjectCommand,
//   HeadObjectCommand,
// } = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

require("dotenv").config();

// bucketName = process.env.BUCKET_NAME;
// bucketRegion = process.env.BUCKET_REGION;
// accessKey = process.env.ACCESS_KEY;
// secretAccessKey = process.env.SECRET_ACCESS_KEY;

const randomName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: accessKey,
//     secretAccessKey: secretAccessKey,
//   },
//   region: bucketRegion,
// });



// var aws = {
//   uploadToAWS : async function(content){
//     const contentFileName = randomName();

//     const contentParams = {
//       Bucket: bucketName,
//       Key: contentFileName,
//       Body: content.buffer,
//     ContentType: content.mimetype,
//     };

//     await uploadToS3(contentParams)

//     return contentFileName;
//   },

//   getLinkFromAWS : async function(key){
//     const getObjectParams = {
//       Bucket: bucketName,
//       Key: key,
//     };
//     const command = new GetObjectCommand(getObjectParams);
//     url = await getSignedUrl(s3, command, { expiresIn: "604800" });
//     return url;
//   }
// }

var db = {
  findOne: async function(model, params){
    params['deleted'] = false;
    var result = await model.findOne(params);
    return result;
  },
  
  find: async function(model, params, skip = null, limit = null, sort = null){
    params['deleted'] = false;
    var result;
    if(skip && limit && sort){
      result = await model.find(params)
        .skip(skip)
        .limit(limit)
        .sort(sort);
    }
    result = await model.find(params);
    return result;
  },

  findById: async function(model, id){
    var params = {
      _id: id,
    }
    params['deleted'] = false;
    var result = await model.findOne(params);
    return result;
  },
}

var is = {  // Image Server
  
  upload: async function (file){

    var fileName = `${randomName()}${path.extname(file.originalname)}`;
    const remotePath = `${fileName}`;
    const config = {
      host: process.env.IMAGE_SERVER_HOST,
      port: '22',
      username: process.env.IMAGE_SERVER_USERNAME,
      password: process.env.IMAGE_SERVER_PASSWORD
    };
  
    try {
      await sftp.connect(config);
  
      const bufferStream = require('stream').Readable.from(file.buffer);
      
      await sftp.put(bufferStream, remotePath);
  
      await sftp.end();
      return `https://211.45.162.49.nip.io/${fileName}`;
    } catch (err) {
      console.error(err.message);
      throw Error("Error: ", err.message)
    }
  }
}


const uploadToS3 = async (params) => {
  const upload = new Upload({
    client: s3,
    params: params,
  });
  await upload.done();
};

function tryCatch(callback, res=null){
  try{
      callback()
  }catch(error){
      if(res){
          error(res, error.message);
      }else{
          throw Error(error.message);
      }
  }
}

function sendRes(res, status, success, body, notThrow = true){
  if(res){
    res.status(status).json({
        success,
        body
    })
  }

  if(!notThrow){
    throw Error(body)
  }
}

async function validateUser(userid, currRole=null){
  const user = await User.findById(userid)
  if(!user){
      error(null, "User not found");
  }

  if(currRole){
    if(user.currentAccountState != currRole){
        error(null, `Please switch to your ${currRole} account`)
    }
  }

  return user;
}

function truncateString(str, maxLength) {
  if (str.length > maxLength) {
      return str.substring(0, maxLength) + '...';
  }
  return str;
}

function paginateArray(array, perPage, pageNo) {
  const startIndex = (pageNo - 1) * perPage;
  return array.slice(startIndex, startIndex + perPage);
}

  module.exports = {  db, is, tryCatch, sendRes, validateUser, truncateString, paginateArray }