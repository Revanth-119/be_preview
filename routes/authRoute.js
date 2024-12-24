import express from 'express';
import authController from '../controllers/authController.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const authRouter = express.Router();

const loginR_L = createRateLimiter(
    1,
    5,
    'Too many login attempts. Please try again after 60 seconds'
  ),
  registerR_L = createRateLimiter(
    1,
    2,
    'Too many registration attempts. Please try again after 60 seconds'
  ),
  refreshTokenR_L = createRateLimiter(1, 10, 'Too many requests. Please try again later');
const forgotPasswordR_L = createRateLimiter(
    1,
    5,
    'Too many forgot-password attempts. Please try again after 60 seconds'
  ),
  verifyTokenR_L = createRateLimiter(
    1,
    5,
    'Too many token verification attempts. Please try again after 60 seconds'
  ),
  resetPasswordR_L = createRateLimiter(
    1,
    5,
    'Too many password reset attempts. Please try again after 60 seconds'
  );

authRouter.post('/login', loginR_L, authController.handleLogin);
authRouter.post('/register', registerR_L, authController.handleRegister);
authRouter.post('/refresh-token', refreshTokenR_L, authController.refreshAccessToken);

authRouter.post('/forgot-password', forgotPasswordR_L, authController.handleForgotPassword);
authRouter.post('/verify-reset-token', verifyTokenR_L, authController.handleVerifyResetToken);
authRouter.post('/reset-password', resetPasswordR_L, authController.handleResetPassword);
authRouter.post('/verify-account', authController.generateOtp);

//protected routes
authRouter.use(authenticateUser);
authRouter.get('/logout', authController.handleLogout);

export default authRouter;
