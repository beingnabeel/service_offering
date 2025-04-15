/**
 * Application configuration settings
 */

require('dotenv').config();

module.exports = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
  },

  // AWS S3 configuration for file uploads
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
  },

  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8085',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  },

  // Upload settings
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
  },
};
