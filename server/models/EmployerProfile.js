module.exports = (sequelize, DataTypes) => {
  return sequelize.define('EmployerProfile', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    companyName: { type: DataTypes.STRING, allowNull: false },
    companyLogo: { type: DataTypes.STRING },
    website: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.STRING },
    industry: { type: DataTypes.STRING }
  }, {
    timestamps: true,
    tableName: 'EmployerProfiles'
  });
};