const express = require('express');
// Using Sequelize for MySQL (replaces mongoose)
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Load environment variables before config/db initializes Sequelize
dotenv.config();
const { connectDB } = require('./config/db');

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 900000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173"
  ],
  credentials: true
}));


// Import and use routes
app.use('/api/auth', require('./routes/AuthRoutes'));
app.use('/api/jobseeker', require('./routes/JobSeekerRoutes'));
app.use('/api/employer', require('./routes/EmployerRoutes'));
app.use('/api/jobs', require('./routes/JobRoutes'));
app.use('/api/applications', require('./routes/ApplicationRoutes'));
app.use('/api/admin', require('./routes/AdminRoutes'));
app.use('/api/location', require('./routes/LocationRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ message: '🚀 Job Portal API is running', status: 'active' });
});


// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});




