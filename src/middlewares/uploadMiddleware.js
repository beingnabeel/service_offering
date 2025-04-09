// src/middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../utils/appError");

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function to validate images
const imageFileFilter = (req, file, cb) => {
  // Check both MIME type and file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (
    allowedExtensions.includes(fileExtension) &&
    allowedMimes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file format. Please upload only image files (.jpg, .jpeg, .png, .gif, .webp, .svg).",
        400
      ),
      false
    );
  }
};

// Create basic multer upload configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

// Helper function to upload a file to S3
const uploadToS3 = (file, folder = "general") => {
  return new Promise((resolve, reject) => {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExtension}`;

    // Set upload parameters
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL parameter removed as bucket may have Block Public Access settings enabled
      // To make objects public, configure bucket policies instead
    };

    // Upload to S3
    s3.upload(params, (err, data) => {
      if (err) {
        return reject(
          new AppError(`Error uploading to S3: ${err.message}`, 500)
        );
      }

      // Return the file data
      resolve({
        key: data.Key,
        location: data.Location,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
    });
  });
};

// Delete a file from S3
const deleteFromS3 = (key) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        return reject(
          new AppError(`Error deleting from S3: ${err.message}`, 500)
        );
      }
      resolve(data);
    });
  });
};

// Middleware for handling single image upload and saving to S3
const uploadSingleImage = (fieldName, folder = "general") => {
  return [
    // First use multer to handle the upload
    upload.single(fieldName),

    // Then upload to S3 if file exists
    async (req, res, next) => {
      try {
        if (!req.file) {
          return next();
        }

        // Upload to S3
        const fileData = await uploadToS3(req.file, folder);

        // Add the file data to the request object
        req.fileData = fileData;
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

// Middleware for handling multiple image uploads
const uploadMultipleImages = (fieldName, maxCount = 5, folder = "general") => {
  return [
    // First use multer to handle the uploads
    upload.array(fieldName, maxCount),

    // Then upload all files to S3
    async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          return next();
        }

        // Upload each file to S3
        const uploadPromises = req.files.map((file) =>
          uploadToS3(file, folder)
        );
        const filesData = await Promise.all(uploadPromises);

        // Add the files data to the request object
        req.filesData = filesData;
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
};

// Service-specific folder configurations
const folders = {
  serviceCategory: "service-categories",
  serviceType: "service-types",
  serviceComponent: "service-components",
  serviceOffering: "service-offerings",
  additionalFeature: "additional-features",
  servicePackage: "service-packages",
  sparePart: "spare-parts",
  serviceTemplate: "service-templates",
};

// Export the configured upload middleware and helpers
module.exports = {
  // Basic multer upload for custom configurations
  upload,

  // Helper functions
  uploadToS3,
  deleteFromS3,

  // Pre-configured middlewares for different entities
  uploadServiceCategoryIcon: uploadSingleImage("icon", folders.serviceCategory),
  uploadServiceTypeImage: uploadSingleImage(
    "displayImage",
    folders.serviceType
  ),
  uploadServiceOfferingImages: uploadMultipleImages(
    "images",
    10,
    folders.serviceOffering
  ),
  uploadAdditionalFeatureIcon: uploadSingleImage(
    "displayIcon",
    folders.additionalFeature
  ),
  uploadServicePackageImage: uploadSingleImage(
    "displayImage",
    folders.servicePackage
  ),
  uploadSparePartImage: uploadSingleImage("image", folders.sparePart),

  // Generic uploads with custom folder
  uploadSingleImage,
  uploadMultipleImages,

  // Folder configuration for reference
  folders,
};
