import express from 'express';
import collegeController from '../controllers/collegeController.js';
import { createRateLimiter } from '../middlewares/rateLimiter.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateUser);

//limited to 60 req per 5min or 1 req per 5sec
const collegesR_L = createRateLimiter(5, 60, 'Too many requests, please try again later');
const compareR_L = createRateLimiter(1, 10, 'Too many requests, please try again later');

router.post('/preferences', collegesR_L, collegeController.findEligibleColleges);

router.post('/compare', compareR_L, collegeController.findComparedColleges);

export default router;
