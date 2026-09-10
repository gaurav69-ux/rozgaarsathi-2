const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');

// Import model factory functions
const UserModel = require('./User');
const JobModel = require('./Job');
const ApplicationModel = require('./Application');
const EmployerProfileModel = require('./EmployerProfile');
const JobSeekerProfileModel = require('./JobSeekerProfile');
const GeoJobModel = require('./GeoJob');
const WorkerModel = require('./Worker');

// Initialize models
const User = UserModel(sequelize, DataTypes);
const Job = JobModel(sequelize, DataTypes);
const Application = ApplicationModel(sequelize, DataTypes);
const EmployerProfile = EmployerProfileModel(sequelize, DataTypes);
const JobSeekerProfile = JobSeekerProfileModel(sequelize, DataTypes);
const GeoJob = GeoJobModel(sequelize, DataTypes);
const Worker = WorkerModel(sequelize, DataTypes);

// Associations
User.hasMany(Job, { foreignKey: 'employerId', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'employerId', as: 'employer' });

User.hasOne(EmployerProfile, { foreignKey: 'userId', as: 'employerProfile' });
EmployerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(JobSeekerProfile, { foreignKey: 'userId', as: 'seekerProfile' });
JobSeekerProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

User.hasMany(Application, { foreignKey: 'jobSeekerId', as: 'applicationsByUser' });
Application.belongsTo(User, { foreignKey: 'jobSeekerId', as: 'jobSeeker' });

// Saved jobs many-to-many between JobSeekerProfile and Job
JobSeekerProfile.belongsToMany(Job, { through: 'SavedJobs', as: 'savedJobs', foreignKey: 'jobSeekerProfileId' });
Job.belongsToMany(JobSeekerProfile, { through: 'SavedJobs', as: 'savedBy', foreignKey: 'jobId' });

module.exports = {
  sequelize,
  DataTypes,
  User,
  Job,
  Application,
  EmployerProfile,
  JobSeekerProfile,
  GeoJob,
  Worker
};
