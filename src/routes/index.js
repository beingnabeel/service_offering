const express = require('express');
const router = express.Router();

const serviceCategoryRoutes = require('./serviceCategoryRoutes');
const serviceTypeRoutes = require('./serviceTypeRoutes');
const serviceComponentRoutes = require('./serviceComponentRoutes');
const serviceCenterOfferingRoutes = require('./serviceCenterOfferingRoutes');

router.use('/api/v1/categories', serviceCategoryRoutes);
router.use('/api/v1/types', serviceTypeRoutes);
router.use('/api/v1/components', serviceComponentRoutes);
router.use('/api/v1/service-centers', serviceCenterOfferingRoutes);

module.exports = router;
