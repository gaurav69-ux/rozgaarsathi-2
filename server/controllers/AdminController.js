const { User, Job, Application } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all applications (excluding those for jobs removed by admin)
// @route   GET /api/admin/applications
// @access  Private/Admin
exports.getAllApplications = async (req, res) => {
    try {
        const removedJobs = await Job.findAll({ where: { removedByAdmin: true }, attributes: ['id'] });
        const removedJobIds = removedJobs.map(j => j.id);
        const where = removedJobIds.length ? { jobId: { [Op.notIn]: removedJobIds } } : {};

        const applications = await Application.findAll({ where, include: [{ model: Job, as: 'job', attributes: ['title'] }, { model: User, as: 'jobSeeker', attributes: ['name', 'email'] }], order: [['createdAt', 'DESC']] });

        const result = applications.map(app => ({
            id: app.id,
            jobTitle: app.job?.title || 'Deleted Job',
            applicantName: app.jobSeeker?.name || 'Unknown',
            applicantEmail: app.jobSeeker?.email || 'Unknown',
            createdAt: app.createdAt
        }));

        res.json({ success: true, applications: result });
    } catch (error) {
        console.error('Admin get all applications error:', error);
        res.status(500).json({ message: 'Server error fetching applications', error: error.message });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const jobseekersCount = await User.count({ where: { role: 'jobseeker' } });
        const employersCount = await User.count({ where: { role: 'employer' } });
        const adminsCount = await User.count({ where: { role: 'admin' } });

        const totalJobs = await Job.count({ where: { removedByAdmin: { [Op.ne]: true } } });
        const activeJobs = await Job.count({ where: { status: 'active', removedByAdmin: { [Op.ne]: true } } });

        const removedJobs = await Job.findAll({ where: { removedByAdmin: true }, attributes: ['id'] });
        const removedJobIds = removedJobs.map(j => j.id);
        const totalApplications = await Application.count({ where: removedJobIds.length ? { jobId: { [Op.notIn]: removedJobIds } } : {} });

        const recentUsers = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']], limit: 5 });

        res.json({ success: true, stats: { users: { total: totalUsers, jobseekers: jobseekersCount, employers: employersCount, admins: adminsCount }, jobs: { total: totalJobs, active: activeJobs }, applications: { total: totalApplications } }, recentUsers });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Server error fetching admin stats', error: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Admin get all users error:', error);
        res.status(500).json({ message: 'Server error fetching users', error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.id === req.user.id) return res.status(400).json({ message: 'Admin cannot delete themselves' });
        await user.destroy();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ message: 'Server error deleting user', error: error.message });
    }
};
