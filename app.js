require("dotenv").config();

const cors = require("cors");
const express = require("express");
const winston = require("winston");
const AppError = require("./src/utils/appError");
const globalErrorHandler = require("./src/controllers/errorController");
const { requestLogger, errorLogger } = require("./src/utils/logger");
const { logRequest, logPerformance, logError } = require('./src/middlewares/loggerMiddleware');
const routes = require('./src/routes');

const app = express();

const corsOptions = {
  origin: "http://localhost:8085",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionSuccessStatus: 200,
};

// Global middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middlewares
app.use(logRequest);
app.use(logPerformance);

// Mount API routes
const apiRoutes = require('./src/routes/index');
app.use(apiRoutes);

// Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(logError);
app.use(globalErrorHandler);

module.exports = app;
