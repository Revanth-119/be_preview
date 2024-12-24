import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import otpGenerator from 'otp-generator';

import { User } from '../models/userModel.js';
import { ApiError, ApiResponse } from '../utils/apiResponseWrappers.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import mailSender from '../utils/mailSender.js';
import {
  passwordReset,
  passwordUpdated,
  verifyAccount,
  welcomeEmail,
} from '../utils/mailTemplates.js';
import { Otp } from '../models/otpModel.js';
dotenv.config();

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error(`error generating refresh & access token ${error}`);
    throw new ApiError(500, `error generating refresh & access token`);
  }
};

const handleLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, 'email is required');
  }
  const user = await User.findOne({
    email: email,
  });
  if (!user) {
    throw new ApiError(404, 'user not found');
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'password is incorrect');
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select('-password -refreshToken -_id');
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'user logged in successfully'
      )
    );
});

const handleRegister = asyncHandler(async (req, res) => {
  const { email, username, password, otp } = req.body;
  if ([email, username, password, otp].some((field) => !field || field?.trim() === '')) {
    throw new ApiError(400, 'All fields are required');
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, 'email or username already taken');
  }
  //add profile photo image handling using uploadcare and validation
  const otpDoc = await Otp.findOne({ email });
  if (!otpDoc || otpDoc.expiresAt < Date.now()) {
    throw new ApiError(400, 'Invalid details or OTP expired');
  }
  if (otpDoc.otp !== otp) {
    throw new ApiError(400, 'Invalid OTP');
  }
  const user = await User.create({
    email,
    password,
    username: username.toLowerCase(),
  });
  const createdUser = await User.findById(user._id).select('-password -refreshToken -_id');
  if (!createdUser) {
    throw new ApiError(500, 'something went wrong while registering user');
  }
  await Otp.deleteOne({ email });
  try {
    await mailSender(
      createdUser.email,
      'Welcome to Siddhi',
      welcomeEmail(createdUser.email, createdUser.username)
    );
    return res.status(201).json(new ApiResponse(201, {}, 'User registered successfully'));
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error}`);
    throw new ApiError(500, 'something went wrong sending mail, please try again later');
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'refreshToken missing');
  }
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, 'Refresh token is expired');
  }
  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', newRefreshToken, options)
    .json(
      new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Access token refreshed')
    );
});

const handleLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged Out'));
});

const handleForgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    // returing success for security concerns
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'If mail is registered, reset link has been sent'));
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = Date.now() + 10 * 60 * 1000;

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_BASE_URL}/auth/verify-reset-token/${resetToken}`;
  try {
    await mailSender(
      user.email,
      'Password Reset',
      passwordReset(user.email, user.username, resetUrl)
    );
    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'If mail is registered, reset link has been sent'));
  } catch (error) {
    logger.error(`Failed to send reset password email: ${error}`);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'something went wrong sending mail, please try again later');
  }
});

const handleVerifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw new ApiError(400, 'Token is required');
  }

  const user = await User.findOne({ resetPasswordToken: token });
  if (!user || !user.resetPasswordToken) {
    throw new ApiError(400, 'Invalid token');
  }

  if (user.resetPasswordExpires < Date.now()) {
    user.resetPasswordToken = null; //cleanup token
    await user.save({ validateBeforeSave: false });
    throw new ApiError(400, 'Token expired');
  }
  return res.status(200).json(new ApiResponse(200, { valid: true }, 'Token is valid'));
});

const handleResetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword?.trim()) {
    throw new ApiError(400, 'Token and newPassword are required');
  }
  const user = await User.findOne({ resetPasswordToken: token });
  if (!user || !user.resetPasswordToken) {
    throw new ApiError(400, 'Invalid token');
  }
  if (user.resetPasswordExpires < Date.now()) {
    throw new ApiError(400, 'Token expired');
  }
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save({ validateBeforeSave: false });

  try {
    await mailSender(
      user.email,
      'Password Update confirmation',
      passwordUpdated(user.email, user.username)
    );
    return res.status(200).json(new ApiResponse(200, {}, 'Password updated successfully'));
  } catch (error) {
    logger.error(`Failed to send password confirmation email: ${error}`);
    throw new ApiError(500, 'something went wrong sending mail, please try again later');
  }
});

const generateOtp = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  if (!email | !username) {
    throw new ApiError(400, 'All details are required');
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, 'email or username already taken');
  }
  const otpCode = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  let otpDoc = await Otp.findOne({ email });
  if (otpDoc) {
    otpDoc.otp = otpCode;
    otpDoc.expiresAt = expiresAt;
    otpDoc.createdAt = Date.now();
    await otpDoc.save();
  } else {
    otpDoc = await Otp.create({ email, otp: otpCode, expiresAt });
  }
  try {
    await mailSender(email, 'Account Verification OTP', verifyAccount(email, otpCode));
    return res.status(200).json(new ApiResponse(200, {}, 'Verification OTP sent successfully'));
  } catch (error) {
    logger.error(`Failed to send account verification otp: ${error}`);
    throw new ApiError(500, 'something went wrong sending mail, please try again later');
  }
});

export default {
  handleLogin,
  handleRegister,
  refreshAccessToken,
  handleLogout,
  handleForgotPassword,
  handleVerifyResetToken,
  handleResetPassword,
  generateOtp,
};
