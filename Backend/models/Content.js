const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('image', 'text', 'video', 'audio'),
    allowNull: false,
  },
  contentUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  isDownloadable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
}, {
  timestamps: true,
});

module.exports = Content;
