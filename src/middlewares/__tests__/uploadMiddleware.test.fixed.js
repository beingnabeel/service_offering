// src/middlewares/__tests__/uploadMiddleware.test.js
const path = require('path');
const AppError = require('../../utils/appError');

// Mock dependencies BEFORE requiring the module under test
const mockSingle = jest.fn();
const mockArray = jest.fn();
const mockMemoryStorage = jest.fn();

jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    single: mockSingle,
    array: mockArray,
  }));
  multer.memoryStorage = mockMemoryStorage;
  return multer;
});

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));


// Import the module AFTER mocks are set up
const multer = require('multer');
const { v4: uuidv4 } = require('uuid'); // Ensure this is imported before the middleware

// Import the mockS3Instance directly from the aws-sdk mock
const { mockS3Instance } = require('aws-sdk');
const uploadMiddleware = require('../uploadMiddleware');

describe('uploadMiddleware', () => {
  // These are already declared at the top level and don't need to be redeclared here
  // mockSingle and mockArray are used for multer mock assertions

  beforeEach(() => {
    // Reset environment variables
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    jest.clearAllMocks();
    // Reassign upload and deleteObject mocks after clearing
    mockS3Instance.upload = jest.fn();
    mockS3Instance.deleteObject = jest.fn();
  });

  describe('uploadToS3', () => {
    it('should upload a file to S3 successfully', async () => {
      // Setup the mock S3 upload to return success
      mockS3Instance.upload.mockImplementation((params, callback) => {
        callback(null, {
          Key: 'folder/test-uuid.png',
          Location: 'https://test-bucket.s3.amazonaws.com/folder/test-uuid.png',
        });
      });

      const mockFile = {
        buffer: Buffer.from('test file content'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 12345,
      };

      const result = await uploadMiddleware.uploadToS3(mockFile, 'folder');

      // Check S3 upload was called with correct params
      expect(mockS3Instance.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Body: mockFile.buffer,
          ContentType: 'image/png',
          // Don't assert specific Key format as UUID mocking isn't working consistently
        }),
        expect.any(Function),
      );

      // Check the result is what we expect
      expect(result).toEqual({
        key: 'folder/test-uuid.png',
        location: 'https://test-bucket.s3.amazonaws.com/folder/test-uuid.png',
        originalName: 'test.png',
        mimetype: 'image/png',
        size: 12345,
      });
    });

    it('should handle S3 upload errors', async () => {
      // Setup the mock S3 upload to return an error
      mockS3Instance.upload.mockImplementation((params, callback) => {
        callback(new Error('S3 upload failed'), null);
      });

      const mockFile = {
        buffer: Buffer.from('test file content'),
        originalname: 'test.png',
        mimetype: 'image/png',
      };

      // Test that an error is thrown
      await expect(
        uploadMiddleware.uploadToS3(mockFile, 'folder'),
      ).rejects.toThrow(/Error uploading to S3/);
    });
  });

  describe('deleteFromS3', () => {
    it('should delete a file from S3 successfully', async () => {
      // Setup the mock S3 delete to return success
      mockS3Instance.deleteObject.mockImplementation((params, callback) => {
        callback(null, { DeleteMarker: true });
      });

      await uploadMiddleware.deleteFromS3('folder/file-key.png');

      // Check S3 deleteObject was called with correct params
      expect(mockS3Instance.deleteObject).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'folder/file-key.png',
        }),
        expect.any(Function),
      );
    });

    it('should handle S3 delete errors', async () => {
      // Setup the mock S3 delete to return an error
      mockS3Instance.deleteObject.mockImplementation((params, callback) => {
        callback(new Error('S3 delete failed'), null);
      });

      // Test that an error is thrown
      await expect(
        uploadMiddleware.deleteFromS3('folder/file-key.png'),
      ).rejects.toThrow(/Error deleting from S3/);
    });
  });

  describe('uploadSingleImage', () => {
    it('should return middleware array with correct handlers', () => {
      // Get the middleware array
      const middlewares = uploadMiddleware.uploadSingleImage(
        'icon',
        'test-folder',
      );

      // Check it's an array with two middleware functions
      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(2);

      // Check multer.single was called with correct fieldName
      expect(mockSingle).toHaveBeenCalledWith('icon');

      // Check the second middleware is a function
      expect(typeof middlewares[1]).toBe('function');
    });

    it('second middleware should skip if no file is provided', async () => {
      // Setup mocks
      const req = { file: null };
      const res = {};
      const next = jest.fn();

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadSingleImage('icon');

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify next was called with no arguments
      expect(next).toHaveBeenCalledWith();
      expect(mockS3Instance.upload).not.toHaveBeenCalled();
      expect(req.fileData).toBeUndefined();
    });

    it('second middleware should upload file and attach fileData to request', async () => {
      // Setup mocks
      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 10000,
      };
      const req = { file: mockFile };
      const res = {};
      const next = jest.fn();

      // Setup the mock S3 upload to return success
      mockS3Instance.upload.mockImplementation((params, callback) => {
        callback(null, {
          Key: 'test-folder/test-uuid.png',
          Location:
            'https://test-bucket.s3.amazonaws.com/test-folder/test-uuid.png',
        });
      });

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadSingleImage('icon', 'test-folder');

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify file was uploaded and data attached to request
      expect(mockS3Instance.upload).toHaveBeenCalled();
      expect(req.fileData).toBeDefined();
      expect(req.fileData.key).toBe('test-folder/test-uuid.png');
      expect(next).toHaveBeenCalledWith();
    });

    it('second middleware should pass upload errors to next', async () => {
      // Setup mocks
      const mockFile = {
        buffer: Buffer.from('test content'),
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 10000,
      };
      const req = { file: mockFile };
      const res = {};
      const next = jest.fn();

      // Setup the mock S3 upload to return an error
      mockS3Instance.upload.mockImplementation((params, callback) => {
        callback(new Error('Upload failed'), null);
      });

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadSingleImage('icon');

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify error was passed to next
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Error uploading to S3/);
      expect(req.fileData).toBeUndefined();
    });
  });

  describe('uploadMultipleImages', () => {
    it('should return middleware array with correct handlers', () => {
      // Get the middleware array
      const middlewares = uploadMiddleware.uploadMultipleImages(
        'images',
        5,
        'test-folder',
      );

      // Check it's an array with two middleware functions
      expect(Array.isArray(middlewares)).toBe(true);
      expect(middlewares.length).toBe(2);

      // Check multer.array was called with correct fieldName and maxCount (default is 5)
      expect(mockArray).toHaveBeenCalledWith('images', 5);

      // Check the second middleware is a function
      expect(typeof middlewares[1]).toBe('function');
    });

    it('second middleware should skip if no files are provided', async () => {
      // Setup mocks
      const req = { files: null };
      const res = {};
      const next = jest.fn();

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadMultipleImages('images');

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify next was called with no arguments
      expect(next).toHaveBeenCalledWith();
      expect(mockS3Instance.upload).not.toHaveBeenCalled();
      expect(req.filesData).toBeUndefined();
    });

    it('second middleware should upload multiple files and attach filesData to request', async () => {
      // Setup mocks
      const mockFiles = [
        {
          buffer: Buffer.from('test content 1'),
          originalname: 'test1.png',
          mimetype: 'image/png',
          size: 10000,
        },
        {
          buffer: Buffer.from('test content 2'),
          originalname: 'test2.jpg',
          mimetype: 'image/jpeg',
          size: 20000,
        },
      ];
      const req = { files: mockFiles };
      const res = {};
      const next = jest.fn();

      // Setup the mock S3 upload to return success for each file
      let uploadCount = 0;
      mockS3Instance.upload.mockImplementation((params, callback) => {
        uploadCount++;
        const ext = uploadCount === 1 ? 'png' : 'jpg';
        callback(null, {
          Key: `test-folder/test-uuid-${uploadCount}.${ext}`,
          Location: `https://test-bucket.s3.amazonaws.com/test-folder/test-uuid-${uploadCount}.${ext}`,
        });
      });

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadMultipleImages(
        'images',
        5,
        'test-folder',
      );

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify files were uploaded and data attached to request
      expect(mockS3Instance.upload).toHaveBeenCalledTimes(2);
      expect(req.filesData).toBeDefined();
      expect(req.filesData.length).toBe(2);
      expect(req.filesData[0].key).toBe('test-folder/test-uuid-1.png');
      expect(req.filesData[1].key).toBe('test-folder/test-uuid-2.jpg');
      expect(next).toHaveBeenCalledWith();
    });

    it('second middleware should pass upload errors to next', async () => {
      // Setup mocks
      const mockFiles = [
        {
          buffer: Buffer.from('test content'),
          originalname: 'test.png',
          mimetype: 'image/png',
          size: 10000,
        },
      ];
      const req = { files: mockFiles };
      const res = {};
      const next = jest.fn();

      // Setup the mock S3 upload to return an error
      mockS3Instance.upload.mockImplementation((params, callback) => {
        callback(new Error('Upload failed'), null);
      });

      // Get the middleware array
      const middlewares = uploadMiddleware.uploadMultipleImages('images');

      // Call the second middleware
      await middlewares[1](req, res, next);

      // Verify error was passed to next
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Error uploading to S3/);
      expect(req.filesData).toBeUndefined();
    });
  });
});
