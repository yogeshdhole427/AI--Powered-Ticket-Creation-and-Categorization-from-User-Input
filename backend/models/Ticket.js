const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
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
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  assignedTo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  firstResponseAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  category_confidence: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0,
      max: 1
    }
  },
  priority_confidence: {
    type: DataTypes.FLOAT,
    validate: {
      min: 0,
      max: 1
    }
  },
  entities: {
    type: DataTypes.JSONB,
    defaultValue: {
      devices: [],
      usernames: [],
      error_codes: [],
      ip_addresses: [],
      urls: []
    }
  },
  feedbackSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  feedbackRating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedbackComment: {
    type: DataTypes.TEXT
  },
  feedbackDate: {
    type: DataTypes.DATE
  },
  resolution: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  aiSummary: {
    type: DataTypes.TEXT
  },
  slaBreached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  escalationLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 3
    }
  },
  relatedTickets: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  }
}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updatedAt',
  indexes: [
    // Index for userEmail
    {
      name: 'tickets_userEmail_idx',
      fields: ['userEmail']
    },
    // Index for category
    {
      name: 'tickets_category_idx',
      fields: ['category']
    },
    // Index for priority
    {
      name: 'tickets_priority_idx',
      fields: ['priority']
    },
    // Index for status
    {
      name: 'tickets_status_idx',
      fields: ['status']
    },
    // Index for assignedTo
    {
      name: 'tickets_assignedTo_idx',
      fields: ['assignedTo']
    },
    // Index for created_at
    {
      name: 'tickets_created_at_idx',
      fields: ['created_at']
    },
    // Compound index for status and priority
    {
      name: 'tickets_status_priority_idx',
      fields: ['status', 'priority']
    },
    // Compound index for category and status
    {
      name: 'tickets_category_status_idx',
      fields: ['category', 'status']
    }
  ]
});

module.exports = Ticket;