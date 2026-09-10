module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    companyName: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT, allowNull: false },
    requirements: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING },
    jobType: { type: DataTypes.ENUM('full-time', 'part-time', 'remote', 'contract'), allowNull: false },
    salaryMin: { type: DataTypes.FLOAT },
    salaryMax: { type: DataTypes.FLOAT },
    salaryCurrency: { type: DataTypes.STRING, defaultValue: 'USD' },
    location: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    experienceLevel: { type: DataTypes.STRING },
    postedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deadline: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM('active', 'closed'), defaultValue: 'active' },
    removedByAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
    removedReason: { type: DataTypes.STRING, defaultValue: '' }
  }, {
    timestamps: true,
    tableName: 'Jobs'
  });
};