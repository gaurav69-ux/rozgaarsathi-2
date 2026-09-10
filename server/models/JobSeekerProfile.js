module.exports = (sequelize, DataTypes) => {
  const JobSeekerProfile = sequelize.define('JobSeekerProfile', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    age: { type: DataTypes.INTEGER },
    about: { type: DataTypes.TEXT },
    profilePhoto: { type: DataTypes.STRING },
    resume: { type: DataTypes.STRING },
    skills: { type: DataTypes.JSON },
    experience: { type: DataTypes.JSON },
    education: { type: DataTypes.JSON }
  }, {
    timestamps: true,
    tableName: 'JobSeekerProfiles'
  });

  return JobSeekerProfile;
};