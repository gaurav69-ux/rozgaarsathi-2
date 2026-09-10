module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Worker', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    jobType: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.GEOMETRY('POINT') },
    isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    availableUntil: { type: DataTypes.DATE, allowNull: false }
  }, {
    timestamps: true,
    tableName: 'Workers'
  });
};
