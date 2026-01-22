const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'agent'),
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  position: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  newsletterSubscribed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      name: 'users_email_idx',
      fields: ['email'],
      unique: true
    },
    {
      name: 'users_role_idx',
      fields: ['role']
    }
  ]
});

module.exports = User;