const dotenv = require('dotenv');
const { sequelize, Worker, GeoJob } = require('../models');

dotenv.config();

const seedData = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Connected to MySQL and ensured schema');

        // Clear existing data
        await Worker.destroy({ where: {} });
        await GeoJob.destroy({ where: {} });
        console.log('Cleared existing geospatial data');

        // Current location (Home/Reference Point) - e.g., Mumbai
        const myLng = 72.8777;
        const myLat = 19.0760;

        // 1. Workers
        const workers = [
            {
                name: 'John Nearby (2km)',
                phone: '1234567890',
                jobType: 'Plumber',
                location: { type: 'Point', coordinates: [72.8900, 19.0850] }, // ~2km away
                isAvailable: true,
                availableUntil: new Date(Date.now() + 86400000) // 24h from now
            },
            {
                name: 'Jane Far (10km)',
                phone: '0987654321',
                jobType: 'Electrician',
                location: { type: 'Point', coordinates: [72.9500, 19.1500] }, // ~10km away
                isAvailable: true,
                availableUntil: new Date(Date.now() + 86400000)
            },
            {
                name: 'Bob Unavailable (1km)',
                phone: '1122334455',
                jobType: 'Plumber',
                location: { type: 'Point', coordinates: [72.8850, 19.0800] }, // ~1km away
                isAvailable: false,
                availableUntil: new Date(Date.now() + 86400000)
            }
        ];

        await Worker.bulkCreate(workers);
        console.log('Seed workers inserted');

        // 2. Jobs
        const jobs = [
            {
                employerName: 'Shop A (3km)',
                shopName: 'SuperMart',
                jobTypeNeeded: 'Cashier',
                pay: 500,
                location: { type: 'Point', coordinates: [72.9000, 19.1000] }, // ~3km away
                expiresAt: new Date(Date.now() + 86400000)
            },
            {
                employerName: 'Shop B (15km)',
                shopName: 'BigStore',
                jobTypeNeeded: 'Manager',
                pay: 1000,
                location: { type: 'Point', coordinates: [73.0000, 19.2000] }, // ~15km away
                expiresAt: new Date(Date.now() + 86400000)
            }
        ];

        await GeoJob.bulkCreate(jobs);
        console.log('Seed jobs inserted');

        console.log('Seeding complete! You can now test the API.');
        console.log(`Reference Coordinates (LNG/LAT): ${myLng}, ${myLat}`);

        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
