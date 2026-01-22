const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Analytics = sequelize.define('Analytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  metric: {
    type: DataTypes.ENUM(
      'tickets_created',
      'tickets_resolved',
      'avg_response_time',
      'avg_resolution_time',
      'customer_satisfaction',
      'agent_efficiency',
      'ai_accuracy'
    ),
    allowNull: false
  },
  value: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  breakdown: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'analytics',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
  indexes: [
    {
      name: 'analytics_date_idx',
      fields: ['date']
    },
    {
      name: 'analytics_metric_idx',
      fields: ['metric']
    },
    {
      name: 'analytics_date_metric_idx',
      fields: ['date', 'metric']
    }
  ]
});

module.exports = Analytics;