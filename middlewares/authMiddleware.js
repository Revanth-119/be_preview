import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/apiResponseWrappers.js';
import jwt from 'jsonwebtoken';

const authenticateUser = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers?.Authorization?.split('Bearer ')[1];
    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
    if (!user) {
      throw new ApiError(401, 'Invalid Access Token');
    }
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(403, 'Access token expired');
    }
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

export { authenticateUser };
