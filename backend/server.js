const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const Groq = require('groq-sdk');


const { Sequelize, Op, where, fn, col, literal } = require('sequelize');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000',
  'https://ai-powered-ticket-creation-and-l700.onrender.com',
  'https://ai-powered-ticket-creation-andl700.onrender.com',
  /\.onrender\.com$/, // Allows any Render subdomain
  /\.vercel\.app$/,   // Allows any Vercel deployment
];

// Update your corsOptions in server.js
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Production: Use your existing allowed origins
    if (!origin) return callback(null, true);
    
    for (let allowedOrigin of allowedOrigins) {
      if (typeof allowedOrigin === 'string') {
        if (allowedOrigin === origin) {
          return callback(null, true);
        }
      } else if (allowedOrigin instanceof RegExp) {
        if (allowedOrigin.test(origin)) {
          return callback(null, true);
        }
      }
    }
    
    console.error(`CORS blocked for origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// ✅ Handle preflight requests explicitly
// ✅ Fixed - handle all OPTIONS requests
app.use(cors(corsOptions));

app.use(express.json());

// ✅ UPDATED Socket.IO CORS
const io = new Server(server, { 
  cors: { 
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      for (let allowedOrigin of allowedOrigins) {
        if (typeof allowedOrigin === 'string') {
          if (allowedOrigin === origin) {
            return callback(null, true);
          }
        } else if (allowedOrigin instanceof RegExp) {
          if (allowedOrigin.test(origin)) {
            return callback(null, true);
          }
        }
      }
      
      console.error(`Socket.IO CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ Add security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// ✅ Debug middleware (optional, remove in production)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`Origin: ${req.headers.origin}`);
    console.log(`User-Agent: ${req.headers['user-agent']}`);
    next();
  });
}

// Import models
const User = require('./models/User');
const Ticket = require('./models/Ticket');
const Notification = require('./models/Notification');
const Analytics = require('./models/Analytics');
const ArchivedTicket = require('./models/ArchivedTicket');
const { classifyIssueType, generateAIResponse } = require('./utils/aiAssistant');
// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Import routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Initialize database
const sequelize = require('./config/sequelize');

// Sync database
sequelize.sync({ alter: true, force: false })
  .then(() => {
    console.log('Database synced successfully');
    console.log('Active tickets table: tickets');
    console.log('Archive table: archived_tickets');
    
    // Test the connection to ArchivedTicket table
    return ArchivedTicket.findOne();
  })
  .then(testResult => {
    console.log('ArchivedTicket table test successful');
  })
  .catch(err => {
    console.error('Database sync error:', err);
    console.error('Error details:', err.message);
  });

// --- LEADERBOARD API ---
app.get('/api/agents/leaderboard', async (req, res) => {
  try {
    const board = await Ticket.findAll({
      where: {
        status: "resolved",
        assignedTo: { [Op.ne]: null }
      },
      attributes: [
        'assignedTo',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['assignedTo'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    
    // Format response to match MongoDB structure
    const formattedBoard = board.map(item => ({
      _id: item.assignedTo,
      count: item.count
    }));
    
    res.json(formattedBoard);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
// Test CORS endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    allowedOrigins: allowedOrigins,
    yourOrigin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});
// --- TICKET GENERATION API ---
// Add at top of your server file


// Update the ticket generation endpoint
// --- TICKET GENERATION API ---
// --- TICKET GENERATION API (FIXED VERSION) ---
app.post('/api/tickets/generate', async (req, res) => {
  try {
    console.log("Received ticket generation request:", req.body);
    const { title, description, userId } = req.body;
    
    if (!title || !description || !userId) {
      return res.status(400).json({ 
        error: "Title, description, and user ID are required",
        received: { title, description, userId }
      });
    }

    // Check for minimum length
    if (description.length < 10) {
      return res.status(400).json({
        error: "Description too short",
        message: "Please provide more details (at least 10 characters) for better assistance.",
        type: "INSUFFICIENT_DETAILS",
        suggestion: "Include specific error messages, steps to reproduce, and what you were trying to accomplish."
      });
    }

    // First, get user details
    let user;
    try {
      user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } catch (userError) {
      console.error("User lookup error:", userError);
      return res.status(404).json({ error: "User not found" });
    }

    // Step 1: Enhanced AI Classification
    const aiAnalysis = await classifyIssueType(title, description);
    console.log("AI Analysis Result:", JSON.stringify(aiAnalysis, null, 2));

    // ========== UPDATED LOGIC: ALWAYS CREATE TICKET FOR VALID QUERIES ==========
    
    // Check if it's just a greeting
    const isJustGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|what's up)$/i.test(description.toLowerCase().trim());
    
    if (isJustGreeting || description.length < 15) {
      return res.status(400).json({
        error: "Description too vague",
        message: "Please provide details about your technical issue.",
        type: "INSUFFICIENT_DETAILS",
        suggestion: "Example: 'My Outlook is not opening' or 'I cannot connect to the WiFi'"
      });
    }

    // Determine category based on AI analysis
    let category = aiAnalysis.category || "General IT";
    let priority = aiAnalysis.priority || "medium";
    
    // Override for non-technical queries - still create ticket but mark appropriately
    if (aiAnalysis.isTechnical === false) {
      category = "Non-Technical Query";
      priority = "low";
    }

    // If it's a mixed query, use the technical parts for categorization
    if (aiAnalysis.mixedQuery && aiAnalysis.technicalParts && aiAnalysis.technicalParts.length > 0) {
      // Determine category based on technical parts
      if (aiAnalysis.technicalParts.some(p => p.includes('email') || p.includes('outlook'))) {
        category = "Email/Outlook";
      } else if (aiAnalysis.technicalParts.some(p => p.includes('wifi') || p.includes('network'))) {
        category = "Network";
      } else {
        category = "Mixed Technical";
      }
    }

    // Get AI classification from your external service (for technical issues)
    let aiServiceResponse;
    if (aiAnalysis.useMainModel !== false) {
      try {
        console.log("Calling AI service at https://rakshh12-ai-ticketing-engine.hf.space");
        aiServiceResponse = await axios.post('https://rakshh12-ai-ticketing-engine.hf.space/classify', {
          title,
          description
        }, { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log("AI Service Response:", aiServiceResponse.data);
        
        if (aiServiceResponse.data && aiServiceResponse.data.category) {
          category = aiServiceResponse.data.category;
          priority = aiServiceResponse.data.priority?.toLowerCase() || priority;
        }
        
      } catch (aiError) {
        console.error("AI service error, using fallback:", aiError.message);
        // Fallback logic...
      }
    }

    // Create ticket
    const ticketData = {
      title: title,
      description: description,
      userEmail: user.email,
      userId: userId,
      category: category,
      priority: priority,
      status: "open",
      category_confidence: aiAnalysis.confidence || 0.5,
      priority_confidence: 0.5,
      entities: aiServiceResponse?.data?.entities || { devices: [], usernames: [], error_codes: [] },
      aiAnalysis: aiAnalysis,
      handledByAI: false,
      mixedQuery: aiAnalysis.mixedQuery || false
    };

    // Store AI response if available
    if (aiAnalysis.aiResponse) {
      ticketData.aiResponse = aiAnalysis.aiResponse;
    }

    console.log("Creating ticket with data:", ticketData);

    const ticket = await Ticket.create(ticketData);
    
    // Create notification for new ticket
    await Notification.create({
      userEmail: user.email,
      userId: userId,
      type: 'ticket_created',
      title: 'Ticket Created',
      message: `Your ticket "${title.substring(0, 50)}..." has been created`,
      data: {
        ticketId: ticket.id,
        title: title,
        category: ticket.category,
        priority: ticket.priority
      },
      read: false
    });
    
    // Emit socket event
    io.emit('ticket_created', {
      ticketId: ticket.id,
      userEmail: user.email,
      category: ticket.category,
      priority: ticket.priority,
      timestamp: new Date()
    });
    
    console.log("Ticket created successfully:", ticket.id);
    
    // Return response based on query type
    const response = {
      success: true,
      ticket: ticket,
      message: "Ticket created successfully"
    };
    
    // Add AI response for mixed queries
    if (aiAnalysis.mixedQuery && aiAnalysis.aiResponse) {
      response.aiResponse = aiAnalysis.aiResponse;
      response.message = "Ticket created for technical issue. Additional guidance provided above.";
    }
    
    res.json(response);
    
  } catch (err) {
    console.error('Ticket creation failed:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: "Ticket creation failed", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
// Get AI responses for a ticket
app.get('/api/tickets/:id/ai-response', async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    // If ticket already has AI response, return it
    if (ticket.aiResponse) {
      return res.json({
        hasAIResponse: true,
        response: ticket.aiResponse,
        handledByAI: ticket.handledByAI || false,
        createdAt: ticket.created_at
      });
    }
    
    // Generate new AI response if needed
    if (ticket.category_confidence < 0.4) {
      const { generateAIResponse } = require('./utils/aiAssistant');
      const aiReply = await generateAIResponse({
        title: ticket.title,
        description: ticket.description
      }, ticket.category === "General");
      
      // Update ticket with AI response
      ticket.aiResponse = aiReply;
      ticket.aiRespondedAt = new Date();
      await ticket.save();
      
      return res.json({
        hasAIResponse: true,
        response: aiReply,
        handledByAI: false,
        createdAt: new Date()
      });
    }
    
    res.json({
      hasAIResponse: false,
      message: "This ticket doesn't require AI assistance"
    });
    
  } catch (error) {
    console.error("AI response error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});
// --- SUPPORT TEAM API ---
app.get('/api/stats/support-team', async (req, res) => {
  try {
    // Count users with role 'agent'
    const supportTeamCount = await User.count({ where: { role: 'agent' } });
    
    // Get list of active support agents
    const supportTeam = await User.findAll({
      where: { role: 'agent' },
      attributes: ['name', 'email', 'department', 'position'],
      limit: 10
    });
    
    res.json({
      count: supportTeamCount,
      team: supportTeam,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error fetching support team:', err);
    res.status(500).json({ error: "Failed to fetch support team data" });
  }
});

// --- DYNAMIC LIVE STATS API ---
app.get('/api/stats/live', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const last30Days = new Date(todayStart);
    last30Days.setDate(last30Days.getDate() - 30);

    // 1. Count total support team members (users with role 'agent')
    const supportTeamMembers = await User.count({ where: { role: 'agent' } });

    // 2. DYNAMIC AGENT COUNT: Get from the Socket Map
    const onlineAgentsCount = Array.from(activeUsers.values())
      .filter(u => u.role === 'agent').length;

    // 3. Fetch Ticket counts
    const ticketsToday = await Ticket.count({ 
      where: { 
        created_at: { [Op.gte]: todayStart } 
      } 
    });
    
    const resolvedToday = await Ticket.count({ 
      where: { 
        status: 'resolved', 
        updatedAt: { [Op.gte]: todayStart } 
      } 
    });
    
    const activeTickets = await Ticket.count({ 
      where: { 
        status: { [Op.in]: ['open', 'in_progress'] } 
      } 
    });

    // 4. Calculate DYNAMIC average response time (in minutes)
    const recentResolvedTickets = await Ticket.findAll({
      where: {
        status: 'resolved',
        updatedAt: { [Op.gte]: last30Days },
        created_at: { [Op.ne]: null },
        updatedAt: { [Op.ne]: null }
      },
      attributes: ['created_at', 'updatedAt']
    });

    let totalResponseTimeMinutes = 0;
    let responseTimeCount = 0;
    
    recentResolvedTickets.forEach(ticket => {
      if (ticket.created_at && ticket.updatedAt) {
        const responseTimeMs = ticket.updatedAt - ticket.created_at;
        const responseTimeMinutes = Math.floor(responseTimeMs / (1000 * 60));
        
        // Only count reasonable response times (less than 7 days)
        if (responseTimeMinutes > 0 && responseTimeMinutes < 10080) {
          totalResponseTimeMinutes += responseTimeMinutes;
          responseTimeCount++;
        }
      }
    });

    // Calculate average response time
    let avgResponseMinutes = responseTimeCount > 0 ? 
      Math.round(totalResponseTimeMinutes / responseTimeCount) : 30; // Default 30 minutes
    
    let avgResponseTime;
    if (avgResponseMinutes < 60) {
      avgResponseTime = `${avgResponseMinutes}m`;
    } else if (avgResponseMinutes < 1440) {
      const hours = Math.floor(avgResponseMinutes / 60);
      const minutes = avgResponseMinutes % 60;
      avgResponseTime = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(avgResponseMinutes / 1440);
      const hours = Math.floor((avgResponseMinutes % 1440) / 60);
      avgResponseTime = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }

    // 5. Calculate DYNAMIC satisfaction rate from feedback
    const feedbackTickets = await Ticket.findAll({
      where: {
        feedbackSubmitted: true,
        feedbackRating: { [Op.between]: [1, 5] },
        feedbackDate: { [Op.gte]: last30Days }
      },
      attributes: ['feedbackRating']
    });

    let satisfactionRate = 'N/A';
    if (feedbackTickets.length > 0) {
      const totalRating = feedbackTickets.reduce((sum, ticket) => 
        sum + (ticket.feedbackRating || 0), 0
      );
      const averageRating = totalRating / feedbackTickets.length;
      
      // Convert 1-5 star rating to percentage (1 star = 20%, 5 stars = 100%)
      const percentage = Math.round((averageRating / 5) * 100);
      satisfactionRate = `${percentage}%`;
    }

    // 6. Calculate resolution rate for today
    const resolutionRateToday = ticketsToday > 0 ? 
      Math.round((resolvedToday / ticketsToday) * 100) : 0;

    // 7. Calculate overall resolution rate (last 30 days)
    const totalTicketsLast30Days = await Ticket.count({
      where: { created_at: { [Op.gte]: last30Days } }
    });
    
    const resolvedTicketsLast30Days = await Ticket.count({
      where: { 
        status: 'resolved',
        updatedAt: { [Op.gte]: last30Days }
      }
    });
    
    const overallResolutionRate = totalTicketsLast30Days > 0 ? 
      Math.round((resolvedTicketsLast30Days / totalTicketsLast30Days) * 100) : 0;

    // 8. Calculate today's vs yesterday comparison for trend
    const ticketsYesterday = await Ticket.count({
      where: { 
        created_at: { 
          [Op.gte]: yesterdayStart,
          [Op.lt]: todayStart
        }
      }
    });
    
    const resolvedYesterday = await Ticket.count({
      where: { 
        status: 'resolved',
        updatedAt: { 
          [Op.gte]: yesterdayStart,
          [Op.lt]: todayStart
        }
      }
    });

    // Determine trend based on comparison
    let ticketsTrend = 'stable';
    if (ticketsToday > ticketsYesterday && ticketsYesterday > 0) {
      ticketsTrend = 'up';
    } else if (ticketsToday < ticketsYesterday && ticketsToday > 0) {
      ticketsTrend = 'down';
    }

    let resolvedTrend = 'stable';
    if (resolvedToday > resolvedYesterday && resolvedYesterday > 0) {
      resolvedTrend = 'up';
    } else if (resolvedToday < resolvedYesterday && resolvedToday > 0) {
      resolvedTrend = 'down';
    }

    res.json({
      // Team stats
      supportTeamMembers: supportTeamMembers,
      activeAgents: onlineAgentsCount,
      
      // Ticket stats
      ticketsToday: ticketsToday,
      resolvedToday: resolvedToday,
      activeTickets: activeTickets,
      ticketsTrend: ticketsTrend,
      resolvedTrend: resolvedTrend,
      
      // Performance metrics
      satisfactionRate: satisfactionRate,
      avgResponseTime: avgResponseTime,
      avgResponseMinutes: avgResponseMinutes,
      
      // Resolution rates
      resolutionRate: resolutionRateToday,
      overallResolutionRate: overallResolutionRate,
      
      // Additional info
      feedbackCount: feedbackTickets.length,
      totalTickets: totalTicketsLast30Days,
      resolvedTickets: resolvedTicketsLast30Days,
      
      // Timestamp
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('Error fetching live stats:', err);
    res.status(500).json({ 
      error: "Stats failure",
      message: err.message 
    });
  }
});

// --- GET TICKETS API ---
app.get('/api/tickets', async (req, res) => {
  try {
    const { userEmail, userId } = req.query;
    let where = {};
    
    if (userEmail) {
      where.userEmail = userEmail;
    } else if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        where.userEmail = user.email;
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    }
    
    const tickets = await Ticket.findAll({ 
      where,
      order: [['created_at', 'DESC']] 
    });
    res.json(tickets);
  } catch (err) { 
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: "Failed to fetch tickets" }); 
  }
});

// --- UPDATE TICKET STATUS API ---
app.patch('/api/tickets/:id/status', async (req, res) => {
  try {
    const { status, agentEmail } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    ticket.status = status;
    ticket.assignedTo = agentEmail;
    ticket.updatedAt = new Date();
    await ticket.save();
    
    // Create notification for status update
    await Notification.create({
      userEmail: ticket.userEmail,
      userId: ticket.userId,
      type: 'status_updated',
      title: 'Ticket Status Updated',
      message: `Your ticket #${ticket.id.slice(-8).toUpperCase()} has been ${status}`,
      data: {
        ticketId: ticket.id,
        status: status,
        assignedTo: agentEmail
      },
      read: false
    });
    
    // Emit socket event
    io.emit('ticket_updated', {
      ticketId: ticket.id,
      status: status,
      userEmail: ticket.userEmail,
      timestamp: new Date()
    });
    
    res.json(ticket);
  } catch (err) { 
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: "Update failed" }); 
  }
});

// --- NOTIFICATIONS API ---
app.get('/api/notifications', async (req, res) => {
  try {
    const { userEmail, userId } = req.query;
    
    if (!userEmail && !userId) {
      return res.status(400).json({ error: "User email or ID is required" });
    }
    
    let userEmailToQuery = userEmail;
    if (!userEmail && userId) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      userEmailToQuery = user.email;
    }
    
    const notifications = await Notification.findAll({
      where: { userEmail: userEmailToQuery },
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id, 
        userEmail: user.email 
      }
    });
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found or unauthorized" });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// --- PROFILE API ENDPOINTS ---

// Get user profile by ID
app.get('/api/auth/profile/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
app.put('/api/auth/profile/:id', async (req, res) => {
  try {
    const { name, phone, department, position, notifications, newsletter } = req.body;
    const userId = req.params.id;
    
    // Find user and update
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    user.name = name;
    user.phone = phone;
    user.department = department;
    user.position = position;
    user.notificationsEnabled = notifications;
    user.newsletterSubscribed = newsletter;
    user.updatedAt = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: user
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // In a real application, you should verify current password
    // For now, we'll assume validation is done by authentication middleware
    
    // Update password (Note: In production, you should hash this)
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Export user data
app.get('/api/user/export-data', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Find user
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get user's tickets
    const tickets = await Ticket.findAll({
      where: { userEmail: user.email },
      order: [['created_at', 'DESC']]
    });
    
    // Get user's notifications
    const notifications = await Notification.findAll({
      where: { userEmail: user.email },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    
    // Get user's feedback
    const feedbackTickets = tickets.filter(ticket => 
      ticket.feedbackSubmitted && ticket.feedbackRating
    );
    
    // Calculate favorite category
    const categoryCount = {};
    tickets.forEach(ticket => {
      if (ticket.category) {
        categoryCount[ticket.category] = (categoryCount[ticket.category] || 0) + 1;
      }
    });
    
    const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No tickets';
    
    const exportData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || 'Not provided',
        department: user.department || 'Not provided',
        position: user.position || 'Not provided',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      stats: {
        totalTickets: tickets.length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
        openTickets: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
        feedbackProvided: feedbackTickets.length,
        averageRating: feedbackTickets.length > 0 ? 
          (feedbackTickets.reduce((sum, ticket) => sum + ticket.feedbackRating, 0) / feedbackTickets.length).toFixed(2) : 0,
        favoriteCategory: favoriteCategory
      },
      tickets: tickets,
      notifications: notifications,
      feedback: feedbackTickets.map(ticket => ({
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        rating: ticket.feedbackRating,
        comment: ticket.feedbackComment,
        date: ticket.feedbackDate
      })),
      exportInfo: {
        exportedAt: new Date().toISOString(),
        dataVersion: '1.0',
        totalRecords: tickets.length + notifications.length + 1
      }
    };
    
    res.json(exportData);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ error: "Failed to export user data" });
  }
});

// --- LIVE STATS API (Simplified) ---
app.get('/api/stats/live/simple', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get all tickets
    const allTickets = await Ticket.findAll();
    
    // Calculate active agents (agents with tickets assigned in last 4 hours)
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    const activeAgentsSet = new Set();
    
    allTickets.forEach(ticket => {
      if (ticket.assignedTo && ticket.updatedAt > fourHoursAgo) {
        activeAgentsSet.add(ticket.assignedTo);
      }
    });
    
    const activeAgents = activeAgentsSet.size;

    // Calculate tickets created today
    const ticketsToday = allTickets.filter(ticket => 
      new Date(ticket.created_at) >= todayStart
    ).length;

    // Calculate resolved tickets today
    const resolvedToday = allTickets.filter(ticket => 
      ticket.status === 'resolved' && 
      new Date(ticket.updatedAt) >= todayStart
    ).length;

    // Calculate active tickets (not resolved or closed)
    const activeTickets = allTickets.filter(ticket => 
      !['resolved', 'closed'].includes(ticket.status)
    ).length;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    
    allTickets.forEach(ticket => {
      if (ticket.status === 'resolved' && ticket.updatedAt && ticket.created_at) {
        const responseTime = (new Date(ticket.updatedAt) - new Date(ticket.created_at)) / (1000 * 60); // minutes
        totalResponseTime += responseTime;
        responseCount++;
      }
    });
    
    let avgResponseMinutes = responseCount > 0 ? totalResponseTime / responseCount : 5;
    const avgResponseTime = `${Math.floor(avgResponseMinutes)}m ${Math.round((avgResponseMinutes % 1) * 60)}s`;

    // Calculate satisfaction rate from feedback
    const feedbackTickets = allTickets.filter(ticket => 
      ticket.feedbackSubmitted && ticket.feedbackRating
    );
    
    let satisfactionRate = '95%';
    if (feedbackTickets.length > 0) {
      const avgRating = feedbackTickets.reduce((sum, ticket) => 
        sum + ticket.feedbackRating, 0
      ) / feedbackTickets.length;
      
      const percentage = Math.round((avgRating / 5) * 100);
      satisfactionRate = `${percentage}%`;
    }

    res.json({
      activeAgents: activeAgents || 0,
      avgResponseTime: avgResponseTime || '5m 0s',
      satisfactionRate: satisfactionRate || '95%',
      ticketsToday: ticketsToday || 0,
      resolvedToday: resolvedToday || 0,
      activeTickets: activeTickets || 0,
      totalTickets: allTickets.length,
      resolutionRate: allTickets.length > 0 ? 
        Math.round((allTickets.filter(t => t.status === 'resolved').length / allTickets.length) * 100) : 0
    });
  } catch (err) {
    console.error('Error fetching live stats:', err);
    res.status(500).json({ 
      error: "Failed to fetch live stats",
      details: err.message 
    });
  }
});

// --- FEEDBACK API ---
app.post('/api/feedback', async (req, res) => {
  try {
    const { ticketId, rating, comment, userId } = req.body;
    
    if (!ticketId || !rating || !userId) {
      return res.status(400).json({ 
        error: "Ticket ID, rating, and user ID are required" 
      });
    }
    
    // Get user first
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Find the ticket first
    const ticket = await Ticket.findByPk(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    
    if (ticket.userEmail !== user.email) {
      return res.status(403).json({ error: "Unauthorized to provide feedback for this ticket" });
    }
    
    if (ticket.feedbackSubmitted) {
      return res.status(400).json({ error: "Feedback already submitted for this ticket" });
    }
    
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      return res.status(400).json({ error: "Can only provide feedback for resolved tickets" });
    }
    
    // Update the ticket with feedback
    ticket.feedbackSubmitted = true;
    ticket.feedbackRating = rating;
    ticket.feedbackComment = comment;
    ticket.feedbackDate = new Date();
    ticket.updatedAt = new Date();
    await ticket.save();
    
    // Create a notification for the user
    await Notification.create({
      userEmail: user.email,
      userId: userId,
      type: 'feedback_submitted',
      title: 'Feedback Submitted',
      message: `Thank you for your ${rating}-star feedback`,
      data: {
        ticketId: ticketId,
        rating: rating,
        comment: comment,
        ticketTitle: ticket.title
      },
      read: false
    });
    
    // Emit socket event for system-wide updates
    io.emit('feedback_added', {
      ticketId,
      rating,
      userEmail: user.email,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: "Feedback submitted successfully",
      ticket: {
        id: ticket.id,
        feedbackSubmitted: ticket.feedbackSubmitted,
        feedbackRating: ticket.feedbackRating,
        feedbackDate: ticket.feedbackDate
      }
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ 
      error: "Failed to submit feedback",
      message: err.message 
    });
  }
});
// Add this near other GET endpoints
// --- AGENTS API ---
app.get('/api/agents', async (req, res) => {
  try {
    // Get all users with agent role
    const agents = await User.findAll({
      where: { role: 'agent' },
      attributes: ['id', 'name', 'email', 'department', 'position', 'createdAt'],
      raw: true
    });

    // Calculate active tickets for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const activeTickets = await Ticket.count({
          where: {
            assignedTo: agent.email,
            status: { [Op.in]: ['open', 'in_progress'] }
          }
        });

        const resolvedTickets = await Ticket.count({
          where: {
            assignedTo: agent.email,
            status: 'resolved'
          }
        });

        return {
          ...agent,
          activeTickets,
          resolvedTickets,
          totalTickets: activeTickets + resolvedTickets,
          efficiency: Math.round((resolvedTickets / (activeTickets + resolvedTickets || 1)) * 100)
        };
      })
    );

    // Sort by efficiency
    agentsWithStats.sort((a, b) => b.efficiency - a.efficiency);

    res.json(agentsWithStats);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ 
      error: "Failed to fetch agents",
      message: err.message 
    });
  }
});
// --- ARCHIVE TICKET ENDPOINT ---
// Handle OPTIONS preflight requests
app.options('/api/tickets/:id/archive', cors(corsOptions));


app.post('/api/tickets/:id/archive', async (req, res) => {
  try {
    console.log("Archive request received:", {
      ticketId: req.params.id,
      body: req.body
    });

    const { userId, reason } = req.body;
    
    if (!userId || !reason) {
      return res.status(400).json({ 
        error: "User ID and reason are required",
        received: { userId, reason }
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check authorization
    if (!['admin', 'agent'].includes(user.role)) {
      return res.status(403).json({ 
        error: "Unauthorized",
        message: "Only agents and admins can archive tickets"
      });
    }

    // Get ticket
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Found ticket:", {
      id: ticket.id,
      title: ticket.title,
      status: ticket.status
    });

    // Check if already archived
    const alreadyArchived = await ArchivedTicket.findOne({
      where: { originalTicketId: req.params.id }
    });
    
    if (alreadyArchived) {
      return res.status(400).json({ 
        error: "Ticket already archived",
        archiveId: alreadyArchived.id
      });
    }

    // Create archived ticket record (matching your model schema)
    const archivedTicketData = {
      originalTicketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
      userEmail: ticket.userEmail,
      userId: ticket.userId,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      assignedTo: ticket.assignedTo,
      assignedAt: ticket.assignedAt,
      firstResponseAt: ticket.firstResponseAt,
      resolved_at: ticket.resolved_at,
      category_confidence: ticket.category_confidence || 0,
      priority_confidence: ticket.priority_confidence || 0,
      entities: ticket.entities || {},
      feedbackSubmitted: ticket.feedbackSubmitted || false,
      feedbackRating: ticket.feedbackRating,
      feedbackComment: ticket.feedbackComment,
      feedbackDate: ticket.feedbackDate,
      resolution: ticket.resolution,
      tags: ticket.tags,
      aiSummary: ticket.aiSummary,
      slaBreached: ticket.slaBreached,
      escalationLevel: ticket.escalationLevel,
      relatedTickets: ticket.relatedTickets,
      reassignmentHistory: ticket.reassignmentHistory,
      aiResponse: ticket.aiResponse,
      handledByAI: ticket.handledByAI || false,
      aiAnalysis: ticket.aiAnalysis,
      needsClarification: ticket.needsClarification || false,
      archiveReason: reason,
      archivedBy: user.email,
      archivedByUserId: user.id,
      originalCreatedAt: ticket.created_at,
      originalUpdatedAt: ticket.updatedAt,
      originalResolvedAt: ticket.resolved_at
    };

    console.log("Creating archived ticket with data:", archivedTicketData);

    const archivedTicket = await ArchivedTicket.create(archivedTicketData);

    // Delete from active tickets
    await ticket.destroy();

    console.log("Ticket archived successfully. Archived ID:", archivedTicket.id);

    // Emit socket event
    io.emit('ticket_archived', {
      ticketId: req.params.id,
      archivedBy: user.email,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: "Ticket archived successfully",
      archivedTicketId: archivedTicket.id,
      originalTicketId: req.params.id,
      data: {
        id: archivedTicket.id,
        title: archivedTicket.title,
        archivedAt: archivedTicket.archivedAt
      }
    });

  } catch (err) {
    console.error('Archive error:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    
    // Log specific Sequelize errors
    if (err.name === 'SequelizeValidationError') {
      console.error('Validation errors:', err.errors.map(e => ({ path: e.path, message: e.message })));
    }
    
    res.status(500).json({ 
      error: "Failed to archive ticket",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: err.name,
        errors: err.errors,
        stack: err.stack
      } : undefined
    });
  }
});



// Get archived tickets
app.get('/api/tickets/archived', async (req, res) => {
  try {
    const { userId, adminView = false, page = 1, limit = 50 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let where = {};
    
    // If not admin, only show user's own tickets
    if (!adminView && user.role !== 'admin' && user.role !== 'agent') {
      where.userId = userId;
    }

    const offset = (page - 1) * limit;
    
    const tickets = await ArchivedTicket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['archivedAt', 'DESC']]
    });

    res.json({
      tickets: tickets.rows,
      total: tickets.count,
      page: parseInt(page),
      totalPages: Math.ceil(tickets.count / limit)
    });
  } catch (err) {
    console.error('Error fetching archived tickets:', err);
    res.status(500).json({ error: "Failed to fetch archived tickets" });
  }
});

// Restore archived ticket (unarchive)
app.post('/api/tickets/:id/restore', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can restore tickets" });
    }

    const archivedTicket = await ArchivedTicket.findByPk(req.params.id);
    if (!archivedTicket) {
      return res.status(404).json({ error: "Archived ticket not found" });
    }

    // Check if ticket already exists
    const existingTicket = await Ticket.findByPk(archivedTicket.originalTicketId);
    if (existingTicket) {
      return res.status(400).json({ error: "Active ticket already exists with this ID" });
    }

    // Restore to active tickets
    const restoredTicket = await Ticket.create({
      id: archivedTicket.originalTicketId,
      title: archivedTicket.title,
      description: archivedTicket.description,
      userEmail: archivedTicket.userEmail,
      userId: archivedTicket.userId,
      category: archivedTicket.category,
      priority: archivedTicket.priority,
      status: archivedTicket.status,
      assignedTo: archivedTicket.assignedTo,
      assignedAt: archivedTicket.assignedAt,
      firstResponseAt: archivedTicket.firstResponseAt,
      resolved_at: archivedTicket.resolved_at,
      category_confidence: archivedTicket.category_confidence,
      priority_confidence: archivedTicket.priority_confidence,
      entities: archivedTicket.entities,
      feedbackSubmitted: archivedTicket.feedbackSubmitted,
      feedbackRating: archivedTicket.feedbackRating,
      feedbackComment: archivedTicket.feedbackComment,
      feedbackDate: archivedTicket.feedbackDate,
      resolution: archivedTicket.resolution,
      tags: archivedTicket.tags,
      aiSummary: archivedTicket.aiSummary,
      slaBreached: archivedTicket.slaBreached,
      escalationLevel: archivedTicket.escalationLevel,
      relatedTickets: archivedTicket.relatedTickets,
      reassignmentHistory: archivedTicket.reassignmentHistory,
      aiResponse: archivedTicket.aiResponse,
      handledByAI: archivedTicket.handledByAI,
      aiAnalysis: archivedTicket.aiAnalysis,
      needsClarification: archivedTicket.needsClarification,
      created_at: archivedTicket.originalCreatedAt,
      updatedAt: archivedTicket.originalUpdatedAt
    });

    // Delete from archived tickets
    await archivedTicket.destroy();

    res.json({ 
      success: true, 
      message: "Ticket restored successfully",
      ticket: restoredTicket
    });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: "Failed to restore ticket" });
  }
});

// Permanent delete archived ticket
app.delete('/api/tickets/archived/:id', async (req, res) => {
  try {
    const { userId, confirm } = req.body;
    
    if (!userId || confirm !== 'DELETE') {
      return res.status(400).json({ error: "User ID and confirmation required" });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can permanently delete" });
    }

    const archivedTicket = await ArchivedTicket.findByPk(req.params.id);
    if (!archivedTicket) {
      return res.status(404).json({ error: "Archived ticket not found" });
    }

    await archivedTicket.destroy();

    res.json({ 
      success: true, 
      message: "Archived ticket permanently deleted"
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: "Failed to delete archived ticket" });
  }
});

// Bulk archive tickets
app.post('/api/tickets/bulk-archive', async (req, res) => {
  try {
    const { userId, ticketIds, reason } = req.body;
    
    if (!userId || !ticketIds || !Array.isArray(ticketIds) || !reason) {
      return res.status(400).json({ error: "User ID, ticket IDs, and reason are required" });
    }

    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
      return res.status(403).json({ error: "Unauthorized to bulk archive tickets" });
    }

    const tickets = await Ticket.findAll({
      where: {
        id: ticketIds
      }
    });

    const archivePromises = tickets.map(async (ticket) => {
      // Create archived ticket record
      await ArchivedTicket.create({
        originalTicketId: ticket.id,
        title: ticket.title,
        description: ticket.description,
        userEmail: ticket.userEmail,
        userId: ticket.userId,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assignedTo,
        assignedAt: ticket.assignedAt,
        firstResponseAt: ticket.firstResponseAt,
        resolved_at: ticket.resolved_at,
        category_confidence: ticket.category_confidence,
        priority_confidence: ticket.priority_confidence,
        entities: ticket.entities,
        feedbackSubmitted: ticket.feedbackSubmitted,
        feedbackRating: ticket.feedbackRating,
        feedbackComment: ticket.feedbackComment,
        feedbackDate: ticket.feedbackDate,
        resolution: ticket.resolution,
        tags: ticket.tags,
        aiSummary: ticket.aiSummary,
        slaBreached: ticket.slaBreached,
        escalationLevel: ticket.escalationLevel,
        relatedTickets: ticket.relatedTickets,
        reassignmentHistory: ticket.reassignmentHistory,
        aiResponse: ticket.aiResponse,
        handledByAI: ticket.handledByAI,
        aiAnalysis: ticket.aiAnalysis,
        needsClarification: ticket.needsClarification,
        archiveReason: reason,
        archivedBy: user.email,
        archivedByUserId: user.id,
        originalCreatedAt: ticket.created_at,
        originalUpdatedAt: ticket.updatedAt,
        originalResolvedAt: ticket.resolved_at,
        ticketData: ticket.toJSON()
      });

      // Delete from active tickets
      return ticket.destroy();
    });

    await Promise.all(archivePromises);

    res.json({ 
      success: true, 
      message: `${tickets.length} tickets archived successfully`
    });
  } catch (err) {
    console.error('Bulk archive error:', err);
    res.status(500).json({ error: "Failed to bulk archive tickets" });
  }
});
// Cleanup old archived tickets (admin only)
app.delete('/api/tickets/archived/cleanup', async (req, res) => {
  try {
    const { userId, daysOld = 90, confirm } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (confirm !== 'I understand this action is irreversible') {
      return res.status(400).json({ error: "Confirmation message is required" });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Only admins can permanently delete tickets" });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Ticket.destroy({
      where: {
        isArchived: true,
        archivedAt: { [Op.lt]: cutoffDate }
      }
    });

    res.json({ 
      success: true, 
      message: `${result} archived tickets permanently deleted`,
      deletedCount: result
    });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: "Failed to cleanup archived tickets" });
  }
});
// Reassign ticket
// --- REASSIGN TICKET ENDPOINT (FIXED) ---
app.patch('/api/tickets/:id/reassign', async (req, res) => {
  try {
    console.log("Reassignment request received:", {
      ticketId: req.params.id,
      body: req.body,
      headers: req.headers
    });

    const { assignedTo, reassignedBy } = req.body;
    
    if (!assignedTo || !reassignedBy) {
      console.error("Missing required fields:", { assignedTo, reassignedBy });
      return res.status(400).json({ 
        error: "assignedTo and reassignedBy are required",
        received: { assignedTo, reassignedBy }
      });
    }

    // Get ticket using UUID
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      console.error("Ticket not found:", req.params.id);
      return res.status(404).json({ error: "Ticket not found" });
    }

    console.log("Found ticket:", {
      id: ticket.id,
      title: ticket.title,
      currentAssignedTo: ticket.assignedTo
    });

    // Check if reassignedBy user exists
    const reassigningUser = await User.findOne({ 
      where: { email: reassignedBy } 
    });
    
    if (!reassigningUser) {
      console.error("Reassigning user not found:", reassignedBy);
      return res.status(404).json({ 
        error: "User not found", 
        message: `User ${reassignedBy} does not exist` 
      });
    }

    // Check authorization
    if (reassigningUser.role !== 'admin' && reassigningUser.role !== 'agent') {
      console.error("Unauthorized reassignment attempt:", {
        email: reassignedBy,
        role: reassigningUser.role
      });
      return res.status(403).json({ 
        error: "Unauthorized", 
        message: "Only admins and agents can reassign tickets" 
      });
    }

    // Check if new assignee exists
    const newAgent = await User.findOne({ 
      where: { 
        email: assignedTo,
        role: 'agent'
      }
    });
    
    if (!newAgent) {
      console.error("New assignee not found or not an agent:", assignedTo);
      return res.status(400).json({ 
        error: "Invalid assignee", 
        message: "New assignee must be an existing agent" 
      });
    }

    // Initialize reassignment history if not exists
    const history = ticket.reassignmentHistory || [];
    
    // Add to history
    history.push({
      from: ticket.assignedTo || "Unassigned",
      to: assignedTo,
      by: reassignedBy,
      at: new Date().toISOString(),
      ticketId: ticket.id,
      ticketTitle: ticket.title
    });

    // Store previous agent for notification
    const previousAgent = ticket.assignedTo;
    
    // Update ticket
    ticket.assignedTo = assignedTo;
    ticket.reassignmentHistory = history;
    ticket.assignedAt = new Date();
    ticket.updatedAt = new Date();
    
    await ticket.save();
    
    console.log("Ticket reassigned successfully:", {
      ticketId: ticket.id,
      from: previousAgent,
      to: assignedTo,
      by: reassignedBy
    });

    // Create notification for new agent
    try {
      await Notification.create({
        userEmail: assignedTo,
        userId: newAgent.id,
        type: 'ticket_assigned',
        title: 'New Ticket Assigned',
        message: `Ticket "${ticket.title.substring(0, 30)}..." has been assigned to you`,
        data: {
          ticketId: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
          assignedBy: reassignedBy,
          timestamp: new Date().toISOString()
        },
        read: false
      });
      console.log("Notification created for new agent:", assignedTo);
    } catch (notifError) {
      console.error("Failed to create notification for new agent:", notifError);
    }

    // Create notification for previous agent if exists
    if (previousAgent && previousAgent !== assignedTo) {
      try {
        const previousUser = await User.findOne({ where: { email: previousAgent } });
        if (previousUser) {
          await Notification.create({
            userEmail: previousAgent,
            userId: previousUser.id,
            type: 'ticket_unassigned',
            title: 'Ticket Unassigned',
            message: `Ticket "${ticket.title.substring(0, 30)}..." has been reassigned`,
            data: {
              ticketId: ticket.id,
              title: ticket.title,
              reassignedTo: assignedTo,
              reassignedBy: reassignedBy,
              timestamp: new Date().toISOString()
            },
            read: false
          });
          console.log("Notification created for previous agent:", previousAgent);
        }
      } catch (prevNotifError) {
        console.error("Failed to create notification for previous agent:", prevNotifError);
      }
    }

    // Create notification for ticket owner
    try {
      await Notification.create({
        userEmail: ticket.userEmail,
        userId: ticket.userId,
        type: 'agent_assigned',
        title: 'Agent Assigned to Your Ticket',
        message: `An agent has been assigned to your ticket "${ticket.title.substring(0, 30)}..."`,
        data: {
          ticketId: ticket.id,
          title: ticket.title,
          assignedTo: assignedTo,
          assignedAt: new Date().toISOString()
        },
        read: false
      });
    } catch (ownerNotifError) {
      console.error("Failed to create notification for ticket owner:", ownerNotifError);
    }

    // Emit socket event for real-time updates
    io.emit('ticket_reassigned', {
      ticketId: ticket.id,
      previousAgent: previousAgent,
      newAgent: assignedTo,
      reassignedBy: reassignedBy,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Ticket reassigned successfully",
      ticket: {
        id: ticket.id,
        title: ticket.title,
        assignedTo: ticket.assignedTo,
        previousAgent: previousAgent,
        reassignedBy: reassignedBy,
        reassignedAt: ticket.assignedAt,
        reassignmentCount: history.length
      }
    });

  } catch (err) {
    console.error('Reassignment error:', err);
    console.error('Error stack:', err.stack);
    
    // Check for specific Sequelize errors
    if (err.name === 'SequelizeValidationError') {
      console.error('Validation errors:', err.errors);
      return res.status(400).json({
        error: "Validation error",
        message: err.errors.map(e => e.message).join(', '),
        details: err.errors
      });
    }
    
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      console.error('Foreign key constraint error:', err);
      return res.status(400).json({
        error: "Database constraint error",
        message: "One of the referenced users does not exist"
      });
    }
    
    res.status(500).json({ 
      error: "Failed to reassign ticket",
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: err.name,
        stack: err.stack
      } : undefined
    });
  }
});
// --- DEBUG ARCHIVE STATUS ---
// Add this to your server.js file in the API endpoints section
app.get('/api/debug/archive-status', async (req, res) => {
  try {
    // Check if ArchivedTicket table exists
    const tableExists = await sequelize.queryInterface.showAllTables();
    const hasArchiveTable = tableExists.some(table => table === 'archived_tickets');
    
    if (!hasArchiveTable) {
      return res.json({
        status: 'error',
        message: 'ArchivedTicket table not found',
        tables: tableExists
      });
    }
    
    // Try to count records
    const count = await ArchivedTicket.count();
    
    // Check table structure
    const tableInfo = await sequelize.queryInterface.describeTable('archived_tickets');
    
    res.json({
      status: 'healthy',
      tableExists: true,
      recordCount: count,
      tableColumns: Object.keys(tableInfo),
      sampleColumns: {
        originalTicketId: tableInfo.originalTicketId,
        archivedBy: tableInfo.archivedBy,
        archivedAt: tableInfo.archivedAt
      }
    });
    
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
// --- HEALTH CHECK API ---
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Try to connect to AI service
    let aiHealth;
    try {
      const response = await axios.get('https://rakshh12-ai-ticketing-engine.hf.space/health', { 
        timeout: 5000 
      });
      aiHealth = {
        status: 'healthy',
        message: response.data?.status || 'AI service responding',
        details: response.data
      };
    } catch (aiError) {
      aiHealth = {
        status: 'unhealthy',
        error: aiError.message,
        details: aiError.response?.data || 'No response from AI service'
      };
    }
    
    res.json({
      status: 'healthy',
      database: 'connected',
      ai_service: aiHealth,
      backend: 'running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// --- TEST AI CONNECTION API ---
app.get('/api/test-ai', async (req, res) => {
  try {
    const testData = {
      title: "Test Network Issue",
      description: "Cannot connect to office WiFi network. Need urgent help."
    };
    
    console.log("Testing AI connection with data:", testData);
    
    const response = await axios.post('https://rakshh12-ai-ticketing-engine.hf.space/classify', testData, { 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.json({
      success: true,
      message: "AI service is responding correctly",
      testData: testData,
      aiResponse: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("AI test failed:", error.message);
    console.error("Error details:", error.response?.data || error);
    
    res.status(500).json({
      success: false,
      message: "AI service connection failed",
      error: error.message,
      details: error.response?.data || 'No response from AI service',
      suggestion: "Make sure the AI service is running on https://rakshh12-ai-ticketing-engine.hf.space",
      timestamp: new Date().toISOString()
    });
  }
});

// Get user by ID
app.get('/api/auth/user/:id', async (req, res) => {
  try {
    console.log('Dashboard: Fetching user for ID:', req.params.id);
    
    // Only return essential fields for dashboard
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role']
    }); 
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    console.log('Dashboard: User found:', { id: user.id, name: user.name, email: user.email });
    
    res.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('Error fetching user for dashboard:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- SOCKET.IO FOR REAL-TIME UPDATES ---
const activeUsers = new Map(); 

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_user_room', (data) => {
    // Correctly handle both string and object data from frontend
    const email = typeof data === 'string' ? data : data.email;
    const role = data.role || 'user'; 

    socket.join(`user-${email}`);
    activeUsers.set(socket.id, { email, role });

    console.log(`User ${email} (${role}) joined. Total connections: ${activeUsers.size}`);

    // Calculate count of users with 'agent' role
    const onlineAgents = Array.from(activeUsers.values()).filter(u => u.role === 'agent').length;
    
    // Broadcast to ALL connected clients
    io.emit('update_online_counts', { agentsOnline: onlineAgents });
  });

  socket.on('disconnect', () => {
    if (activeUsers.has(socket.id)) {
      const user = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);
      console.log(`User ${user.email} disconnected.`);
    }

    // Broadcast updated counts after disconnect
    const onlineAgents = Array.from(activeUsers.values()).filter(u => u.role === 'agent').length;
    io.emit('update_online_counts', { agentsOnline: onlineAgents });
    console.log('Client disconnected:', socket.id);
  });
});
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Test AI connection: http://localhost:${PORT}/api/test-ai`);
  console.log(`PostgreSQL Host: ${process.env.PGHOST || 'dpg-d5nss0uid0rc73f7bp20-a'}`);
});