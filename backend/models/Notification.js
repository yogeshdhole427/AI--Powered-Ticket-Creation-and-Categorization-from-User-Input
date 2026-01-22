const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM(
      'ticket_created', 
      'status_updated', 
      'assigned', 
      'feedback_submitted',
      'priority_changed',
      'sla_breach',
      'ai_insight',
      'team_message'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  expiresAt: {
    type: DataTypes.DATE,
    defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      name: 'notifications_userEmail_idx',
      fields: ['userEmail']
    },
    {
      name: 'notifications_createdAt_idx',
      fields: ['createdAt']
    },
    {
      name: 'notifications_expiresAt_idx',
      fields: ['expiresAt']
    }
  ]
});

module.exports = Notification;