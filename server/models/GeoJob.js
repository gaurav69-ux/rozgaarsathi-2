module.exports = (sequelize, DataTypes) => {
  return sequelize.define('GeoJob', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employerName: { type: DataTypes.STRING, allowNull: false },
    shopName: { type: DataTypes.STRING, allowNull: false },
    jobTypeNeeded: { type: DataTypes.STRING, allowNull: false },
    pay: { type: DataTypes.FLOAT, allowNull: false },
    // Use GEOMETRY POINT for coordinates when supported
    location: { type: DataTypes.GEOMETRY('POINT') },
    expiresAt: { type: DataTypes.DATE, allowNull: false }
  }, {
    timestamps: true,
    tableName: 'GeoJobs'
  });
};
