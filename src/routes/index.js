const express = require("express");
const router = express.Router();

// Import route modules
const serviceCategoryRoutes = require("./serviceCategoryRoutes");
const serviceTypeRoutes = require("./serviceTypeRoutes");

// API Routes v1

// Mount service category routes
router.use("/api/v1/categories", serviceCategoryRoutes);
router.use("/api/v1/types", serviceTypeRoutes);

// Additional API routes can be mounted here

module.exports = router;
