import rateLimit from "express-rate-limit";
import { config } from "../config.js";

const disabled = config.isTest;

const handler = (req, res) => {
  res.status(429).json({
    error: "Too many requests. Please wait a moment and try again.",
    code: "RATE_LIMITED",
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  });
};

/** General API limiter. */
export const apiLimiter = disabled
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      handler,
    });

/** Stricter limiter for credential endpoints. */
export const authLimiter = disabled
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) =>
        res.status(429).json({
          error: "Too many sign-in attempts. Please wait a few minutes and try again.",
          code: "RATE_LIMITED",
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        }),
    });
