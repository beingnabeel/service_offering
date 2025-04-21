// __mocks__/aws-sdk.js

const mockS3Instance = {
  upload: jest.fn(),
  deleteObject: jest.fn(),
};

const S3 = jest.fn(() => mockS3Instance);

module.exports = {
  S3,
  mockS3Instance,
};
