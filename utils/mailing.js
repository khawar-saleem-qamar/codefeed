const nodemailer = require("nodemailer");
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

module.exports = {sendMail}