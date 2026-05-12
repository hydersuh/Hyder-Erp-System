const path = require("path");

module.exports = {
  database: {
    path: process.env.DB_PATH || path.join(__dirname, "erp.db"),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "erp_system_secret_key_2024",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
  },

  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, "uploads"),
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  webhook: {
    retryCount: parseInt(process.env.WEBHOOK_RETRY_COUNT) || 3,
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS) || 5000,
  },
};
