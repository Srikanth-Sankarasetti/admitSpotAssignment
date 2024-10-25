//mail sending using modemailer

const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
console.log(process.env.MAIL_PORT);

const sendmail = async (options) => {
  //transportation creation
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Srikanth@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendmail;
