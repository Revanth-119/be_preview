import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, 'username is required'],
    lowercase: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    lowercase: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'password is required'],
  },
  refreshToken: {
    type: String,
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const User = mongoose.model('User', userSchema);
