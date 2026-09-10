const { JobSeekerProfile, Job, User } = require('../models');
const path = require('path');
const getUploadedFilePath = (file) => file?.location || file?.path || null;

// @desc    Get job seeker profile
// @route   GET /api/jobseeker/profile
// @access  Private (Job Seeker only)
exports.getProfile = async (req, res) => {
  try {
    const profile = await JobSeekerProfile.findOne({ where: { userId: req.user.id }, include: [{ model: Job, as: 'savedJobs' }] });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update job seeker profile with personal details and photo
// @route   POST /api/jobseeker/profile
// @access  Private (Job Seeker only)
exports.updateProfileDetails = async (req, res) => {
  try {
    const { name, email, address, age, about } = req.body;

    const updateData = {
      name: name || undefined,
      email: email || undefined,
      address: address || undefined,
      age: age || undefined,
      about: about || undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    // Handle profile photo upload to S3
    const { uploadToS3 } = require('../middleware/uploadMiddleware');
    if (req.files?.profilePhoto) {
      const file = req.files.profilePhoto[0];
      const s3Url = await uploadToS3(file.buffer, `${req.user.id}-profilePhoto${path.extname(file.originalname)}`, file.mimetype, 'profile-photos');
      updateData.profilePhoto = s3Url;
    }

    // Handle resume upload to S3
    if (req.files?.resume) {
      const file = req.files.resume[0];
      const s3Url = await uploadToS3(file.buffer, `${req.user.id}-resume${path.extname(file.originalname)}`, file.mimetype, 'resumes');
      updateData.resume = s3Url;
    }

    let profile = await JobSeekerProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) {
      updateData.userId = req.user.id;
      profile = await JobSeekerProfile.create(updateData);
    } else {
      await profile.update(updateData);
      profile = await JobSeekerProfile.findByPk(profile.id);
    }
    res.json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update job seeker profile (skills, experience, education)
// @route   PUT /api/jobseeker/profile
// @access  Private (Job Seeker only)
exports.updateProfile = async (req, res) => {
  try {
    const { skills, experience, education } = req.body;

    const updateData = {};

    // Handle JSON string fields
    if (skills) {
      updateData.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    }
    if (experience) {
      updateData.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;
    }
    if (education) {
      updateData.education = typeof education === 'string' ? JSON.parse(education) : education;
    }

    // Handle resume file upload
    if (req.file) {
      const { uploadToS3 } = require('../middleware/uploadMiddleware');
      const s3Url = await uploadToS3(req.file.buffer, `${req.user.id}-resume${path.extname(req.file.originalname)}`, req.file.mimetype, 'resumes');
      updateData.resume = s3Url;
    }

    let profile = await JobSeekerProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    await profile.update(updateData);
    profile = await JobSeekerProfile.findByPk(profile.id);
    res.json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get job seeker profile by user id (for employer view)
// @route   GET /api/jobseeker/:userId/profile
// @access  Private (Employer only)
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await JobSeekerProfile.findOne({ where: { userId }, include: [{ model: Job, as: 'savedJobs' }, { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }] });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile by userId error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};