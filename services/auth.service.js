const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users.model');
const nodemailer = require('nodemailer')

exports.register = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({ ...userData, password: hashedPassword });
  return user;
};

exports.login = async (emailID, password) => {
  const user = await User.findOne({ where: { email: emailID } });
  if (!user) throw new Error('User not found');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid credentials');

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return { user, token };
};


// write a forgetPassword service 
exports.forgetPassword = async (emailID) => {
  console.log("email: ",emailID);
  
  const user = await User.findOne({ where: { email: emailID } });
  if (!user) throw new Error('User not found');
  // generate a token and send it to the user's email
  const token = Math.round(Math.random()*9999)
  user.otp =token
  await user.save()
  // send the token to the user's email using nodemailer
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emailID,
    subject: 'Reset Password',
    text: `Your password reset code is: ${token}`,
  };
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log('Email sent: ' + info.response);
  });
  return "success";
};


exports.verifyPassword = async (emailID, otp, newPassword) => {
  console.log("email:",emailID);
  
  // Find user by email
  const user = await User.findOne({ where: { email: emailID } });
  if (!user) throw new Error('User not found');

  // Verify OTP
  if (user.otp != otp) {
    throw new Error('Invalid OTP');
  }

  // Check if OTP is expired (assuming resetTokenExpiry exists)
  if (user.otpExpiry && user.otpExpiry < Date.now()) {
    throw new Error('OTP has expired');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password and clear the reset token fields
  user.password = hashedPassword;
  user.otp = null; // Clear OTP
  await user.save();

  return { success: true, message: 'Password successfully updated' };
};
