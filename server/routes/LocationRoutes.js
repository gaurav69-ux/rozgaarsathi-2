const express = require('express');
const router = express.Router();

const { Worker, GeoJob, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * @route   GET /api/location/workers/nearby
 * @desc    Get nearby workers within dynamic radius (default 5km)
 * @query   lat, lng, jobType, radius
 */
router.get('/workers/nearby', async (req, res) => {
    try {
        const { lat, lng, jobType, radius } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDist = radius ? parseFloat(radius) * 1000 : 5000; // Default to 5km if not specified

        // Use MySQL spatial functions (ST_Distance_Sphere) to compute distances
        const pointWkt = `POINT(${longitude} ${latitude})`;
        let sql = `SELECT *, ST_Distance_Sphere(location, ST_GeomFromText(:point)) AS distance FROM Workers WHERE isAvailable = 1 AND availableUntil > NOW()`;
        if (jobType) sql += ` AND jobType = :jobType`;
        sql += ` AND ST_Distance_Sphere(location, ST_GeomFromText(:point)) <= :maxDist ORDER BY distance ASC`;

        const replacements = { point: pointWkt, maxDist };
        if (jobType) replacements.jobType = jobType;

        const nearbyWorkers = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

        res.status(200).json({ success: true, count: nearbyWorkers.length, radiusLimit: maxDist, data: nearbyWorkers });
    } catch (error) {
        console.error('Error fetching nearby workers:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

/**
 * @route   GET /api/location/jobs/nearby
 * @desc    Get nearby jobs within dynamic radius (default 5km)
 * @query   lat, lng, radius
 */
router.get('/jobs/nearby', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDist = radius ? parseFloat(radius) * 1000 : 5000;

        const pointWkt = `POINT(${longitude} ${latitude})`;
        let sql = `SELECT *, ST_Distance_Sphere(location, ST_GeomFromText(:point)) AS distance FROM GeoJobs WHERE expiresAt > NOW()`;
        sql += ` AND ST_Distance_Sphere(location, ST_GeomFromText(:point)) <= :maxDist ORDER BY distance ASC`;
        const nearbyJobs = await sequelize.query(sql, { replacements: { point: pointWkt, maxDist }, type: QueryTypes.SELECT });
        res.status(200).json({ success: true, count: nearbyJobs.length, radiusLimit: maxDist, data: nearbyJobs });
    } catch (error) {
        console.error('Error fetching nearby jobs:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
