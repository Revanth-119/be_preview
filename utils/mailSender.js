import nodemailer from 'nodemailer';
import logger from './logger.js';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const mailSender = async (email, title, body) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: `${email} `, // list of receivers,
    subject: title,
    html: body,
  };
  try {
    let info = await transporter.sendMail(mailOptions);
    logger.info(info.response);
    return info;
  } catch (error) {
    logger.error(error.message);
    throw error;
  }
};

export default mailSender;
