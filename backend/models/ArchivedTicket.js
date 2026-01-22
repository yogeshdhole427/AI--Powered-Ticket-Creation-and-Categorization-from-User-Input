// models/ArchivedTicket.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ArchivedTicket = sequelize.define('ArchivedTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  originalTicketId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'open'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category_confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  priority_confidence: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  entities: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  feedbackSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feedbackRating: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feedbackComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedbackDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  handledByAI: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiAnalysis: {
    type: DataTypes.JSON,
    allowNull: true
  },
  needsClarification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  archiveReason: {
    type: DataTypes.STRING,
    allowNull: false
  },
  archivedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  archivedByUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  originalCreatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  originalUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  originalResolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'archived_tickets',
  timestamps: true,
  createdAt: 'archivedAt',
  updatedAt: 'updatedAt'
});

module.exports = ArchivedTicket;