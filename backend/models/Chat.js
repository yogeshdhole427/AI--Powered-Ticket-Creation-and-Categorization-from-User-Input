const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Chat = sequelize.define('Chat', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readBy: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'chats',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      name: 'chats_ticketId_idx',
      fields: ['ticketId']
    },
    {
      name: 'chats_senderEmail_idx',
      fields: ['senderEmail']
    },
    {
      name: 'chats_createdAt_idx',
      fields: ['createdAt']
    }
  ]
});

module.exports = Chat;