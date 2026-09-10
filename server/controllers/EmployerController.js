const { EmployerProfile, Job, Application, User, sequelize } = require('../models');
const { uploadToS3 } = require('../middleware/uploadMiddleware');
const path = require('path');
const getUploadedFilePath = (file) => file?.location || file?.path || null;

// @desc    Get employer profile
// @route   GET /api/employer/profile
// @access  Private (Employer only)
exports.getProfile = async (req, res) => {
  try {
    const profile = await EmployerProfile.findOne({ where: { userId: req.user.id }, include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get employer profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update employer profile
// @route   PUT /api/employer/profile
// @access  Private (Employer only)
exports.updateProfile = async (req, res) => {
  try {
    const { companyName, website, description, location, industry, name, phone } = req.body;

    if (name || phone) {
      const userUpdateData = {};
      if (name) userUpdateData.name = name;
      if (phone) userUpdateData.phone = phone;
      await User.update(userUpdateData, { where: { id: req.user.id } });
    }

    const updateData = {
      companyName,
      website,
      description,
      location,
      industry
    };

    // Handle company logo upload
    if (req.file) {
      const s3Url = await uploadToS3(req.file.buffer, `${req.user.id}-companyLogo${path.extname(req.file.originalname)}`, req.file.mimetype, 'company-logos');
      updateData.companyLogo = s3Url;
    }

    let profile = await EmployerProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    await profile.update(updateData);
    profile = await EmployerProfile.findByPk(profile.id, { include: [{ model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] });
    res.json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update employer profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get employer's posted jobs
// @route   GET /api/employer/my-jobs
// @access  Private (Employer only)
exports.getMyJobs = async (req, res) => {
  try {

    const jobs = await Job.findAll({ where: { employerId: req.user.id }, order: [['postedDate', 'DESC']] });
    const jobIds = jobs.map(j => j.id);
    const counts = await Application.findAll({ where: { jobId: jobIds }, attributes: ['jobId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['jobId'] });
    const countsMap = {};
    counts.forEach(c => { countsMap[c.jobId] = Number(c.get('count')); });
    const jobsWithCounts = jobs.map(job => {
      const jobObj = job.get({ plain: true });
      jobObj.applicationCount = countsMap[job.id] || 0;
      if (jobObj.removedByAdmin) {
        jobObj.removedByAdmin = true;
        jobObj.removedReason = jobObj.removedReason || 'This job was removed by an administrator.';
      }
      return jobObj;
    });
    res.json({ success: true, count: jobsWithCounts.length, jobs: jobsWithCounts });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};