import { rateLimit } from "express-rate-limit";

// Development mode: More lenient limits for testing
const isDevelopment = process.env.NODE_ENV !== "production";

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: isDevelopment ? 1000 : 500, // 1000 attempts in dev, 500 in production
  skipSuccessfulRequests: true,
  message:
    "Too many login attempts from this IP, please try again after 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export default loginLimiter;
