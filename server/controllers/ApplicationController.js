const { Application, Job, User } = require('../models');
const path = require('path');

const getUploadedFilePath = (file) => file?.location || file?.path || null;

// @desc    Apply to a job
// @route   POST /api/applications
// @access  Private (Job Seeker only)
exports.applyJob = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'active') return res.status(400).json({ message: 'This job is no longer accepting applications' });

    const existingApplication = await Application.findOne({ where: { jobId, jobSeekerId: req.user.id } });
    if (existingApplication) return res.status(400).json({ message: 'You have already applied to this job' });

    let resumeUrl = null;
    if (req.file) {
      const { uploadToS3 } = require('../middleware/uploadMiddleware');
      resumeUrl = await uploadToS3(req.file.buffer, `${req.user.id}-resume${path.extname(req.file.originalname)}`, req.file.mimetype, 'resumes');
    }

    const application = await Application.create({ jobId, jobSeekerId: req.user.id, resume: resumeUrl, coverLetter });
    const appWithJob = await Application.findByPk(application.id, { include: [{ model: Job, as: 'job', attributes: ['title', 'companyName'] }] });
    res.status(201).json({ success: true, message: 'Application submitted successfully', application: appWithJob });
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get my applications (for job seeker)
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker only)
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.findAll({
      where: { jobSeekerId: req.user.id },
      include: [{ model: Job, as: 'job', include: [{ model: User, as: 'employer', attributes: ['name', 'email'] }] }],
      order: [['appliedDate', 'DESC']]
    });
    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get applications for a specific job (for employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer only)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.employerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to view these applications' });

    const applications = await Application.findAll({ where: { jobId }, include: [{ model: User, as: 'jobSeeker', attributes: ['name', 'email', 'phone'] }], order: [['appliedDate', 'DESC']] });
    res.json({ success: true, count: applications.length, jobTitle: job.title, applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status value' });

    const application = await Application.findByPk(req.params.id, { include: [{ model: Job, as: 'job' }] });
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.job.employerId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to update this application' });

    await application.update({ status });
    res.json({ success: true, message: 'Application status updated successfully', application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all applications for employer's jobs
// @route   GET /api/applications/job/all
// @access  Private (Employer only)
exports.getApplicationsForEmployer = async (req, res) => {
  try {
    const jobs = await Job.findAll({ where: { employerId: req.user.id }, attributes: ['id', 'title'] });
    const jobIds = jobs.map(j => j.id);
    const applications = await Application.findAll({ where: { jobId: jobIds }, include: [{ model: Job, as: 'job', attributes: ['title'] }, { model: User, as: 'jobSeeker', attributes: ['name', 'email'] }], order: [['appliedDate', 'DESC']] });
    res.json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error('Get employer applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};