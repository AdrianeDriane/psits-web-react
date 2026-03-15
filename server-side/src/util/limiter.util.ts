import { rateLimit } from "express-rate-limit";

// Development mode: More lenient limits for testing
const isDevelopment = process.env.NODE_ENV !== "production";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 100, // 500 attempts in dev, 100 in production
  message:
    "Too many login attempts from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export default loginLimiter;
