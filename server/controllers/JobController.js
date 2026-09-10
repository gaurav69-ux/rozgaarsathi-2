const { Job, JobSeekerProfile, EmployerProfile, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res) => {
  try {
    const {
      title,
      location,
      category,
      jobType,
      minSalary,
      maxSalary,
      page = 1,
      limit = 10
    } = req.query;

    // Build Sequelize where clause
    const where = { status: 'active', removedByAdmin: { [Op.ne]: true } };
    if (title) where.title = { [Op.like]: `%${title}%` };
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (category) where.category = category;
    if (jobType) where.jobType = jobType;
    if (minSalary) where.salaryMin = { [Op.gte]: Number(minSalary) };
    if (maxSalary) where.salaryMax = { [Op.lte]: Number(maxSalary) };

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Job.findAndCountAll({
      where,
      include: [{ model: User, as: 'employer', attributes: ['name', 'email'] }],
      order: [['postedDate', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      jobs: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, { include: [{ model: User, as: 'employer', attributes: ['name', 'email'] }] });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer only)
exports.createJob = async (req, res) => {
  try {
    // Fetch employer profile for company name
    const profile = await EmployerProfile.findOne({ where: { userId: req.user.id } });
    const jobData = { ...req.body, employerId: req.user.id, companyName: profile ? profile.companyName : 'Independent Employer' };
    const job = await Job.create(jobData);
    res.status(201).json({ success: true, message: 'Job created successfully', job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer only)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to update this job' });
    const updatedJob = await job.update(req.body);
    res.json({ success: true, message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer or Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, { include: [{ model: User, as: 'employer', attributes: ['email', 'name'] }] });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    let deletedBy = 'employer';
    if (req.user.role === 'admin') {
      deletedBy = 'admin';
      await job.update({ removedByAdmin: true, removedReason: 'This job was removed by an administrator.' });
    } else if (job.employerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    } else {
      await job.destroy();
    }
    res.json({
      success: true,
      message: deletedBy === 'admin' ? 'Job deleted by admin. Employer will be notified.' : 'Job deleted successfully',
      deletedBy,
      employer: job.employer ? { email: job.employer.email, name: job.employer.name } : null,
      jobTitle: job.title
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Save/Unsave job (bookmark)
// @route   POST /api/jobs/:id/save
// @access  Private (Job Seeker only)
exports.saveJob = async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const jobId = Number(req.params.id);
    const isSaved = await profile.hasSavedJob(jobId);
    if (isSaved) {
      await profile.removeSavedJob(jobId);
      return res.json({ success: true, message: 'Job removed from saved list', saved: false });
    }
    await profile.addSavedJob(jobId);
    res.json({ success: true, message: 'Job saved successfully', saved: true });
  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};