import rateLimit from 'express-rate-limit';

const trustedIPs = []; //whitelist IPs like admin IPs, monitoring tools

export const createRateLimiter = (
  windowMs = 1,
  max = 5,
  message = 'Please try again after 60 seconds'
) => {
  return rateLimit({
    windowMs: windowMs * 60 * 1000,
    max,
    message: {
      success: false,
      error: message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => trustedIPs.includes(req.ip),
  });
};
