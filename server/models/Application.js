module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define('Application', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    jobSeekerId: { type: DataTypes.INTEGER, allowNull: false },
    resume: { type: DataTypes.STRING },
    coverLetter: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('applied', 'under_review', 'shortlisted', 'rejected', 'accepted'), defaultValue: 'applied' },
    appliedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: true,
    tableName: 'Applications',
    indexes: [
      { unique: true, fields: ['jobId', 'jobSeekerId'] }
    ]
  });

  return Application;
};