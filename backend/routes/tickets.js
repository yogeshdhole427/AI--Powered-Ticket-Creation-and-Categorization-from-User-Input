const express = require('express');
const router = express.Router();
const axios = require('axios');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST: Create a ticket with AI prediction
router.post('/generate', async (req, res) => {
    try {
        const { title, description, userId } = req.body;

        if (!title || !description || !userId) {
            return res.status(400).json({ error: "Title, description, and user ID are required" });
        }

        // Get user details
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 1. Call your existing FastAPI BERT service
        const aiResponse = await axios.post('https://rakshh12-ai-ticketing-engine.hf.space/classify', {
            title, description
        }, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
        });

        // 2. Map AI results to PostgreSQL
        const newTicket = await Ticket.create({
            userId,
            title: aiResponse.data.title || title,
            description: description,
            userEmail: user.email,
            category: aiResponse.data.category || "General",
            priority: aiResponse.data.priority?.toLowerCase() || "medium",
            entities: aiResponse.data.entities || {
                devices: [],
                usernames: [],
                error_codes: [],
                ip_addresses: [],
                urls: []
            },
            status: 'open',
            category_confidence: aiResponse.data.category_confidence || 0,
            priority_confidence: aiResponse.data.priority_confidence || 0
        });

        // Create notification
        await Notification.create({
            userEmail: user.email,
            userId: userId,
            type: 'ticket_created',
            title: 'Ticket Created',
            message: `Your ticket "${title.substring(0, 50)}..." has been created`,
            data: {
                ticketId: newTicket.id,
                title: title,
                category: newTicket.category,
                priority: newTicket.priority
            },
            read: false
        });

        res.status(201).json(newTicket);
    } catch (err) {
        console.error('Ticket generation error:', err);
        
        // Handle specific errors
        if (err.code === 'ECONNREFUSED') {
            return res.status(500).json({ error: "AI service connection refused" });
        }
        if (err.response?.status === 404) {
            return res.status(500).json({ error: "AI service endpoint not found" });
        }
        
        res.status(500).json({ 
            error: "AI Engine or Database Error",
            details: err.message 
        });
    }
});

// GET all tickets
router.get('/', async (req, res) => {
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

// GET ticket by ID
router.get('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        res.json(ticket);
    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ error: "Failed to fetch ticket" });
    }
});

// UPDATE ticket status
router.patch('/:id/status', async (req, res) => {
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
        
        res.json(ticket);
    } catch (err) {
        console.error('Error updating ticket:', err);
        res.status(500).json({ error: "Update failed" });
    }
});

// UPDATE ticket assignment
router.patch('/:id/assign', async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        
        ticket.assignedTo = assignedTo;
        ticket.assignedAt = new Date();
        ticket.updatedAt = new Date();
        await ticket.save();
        
        // Create notification for assignment
        await Notification.create({
            userEmail: ticket.userEmail,
            userId: ticket.userId,
            type: 'assigned',
            title: 'Ticket Assigned',
            message: `Your ticket has been assigned to ${assignedTo}`,
            data: {
                ticketId: ticket.id,
                assignedTo: assignedTo,
                assignedAt: ticket.assignedAt
            },
            read: false
        });
        
        res.json(ticket);
    } catch (err) {
        console.error('Error assigning ticket:', err);
        res.status(500).json({ error: "Assignment failed" });
    }
});

// DELETE ticket
router.delete('/:id', async (req, res) => {
    try {
        const ticket = await Ticket.findByPk(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }
        
        await ticket.destroy();
        res.json({ message: "Ticket deleted successfully" });
    } catch (err) {
        console.error('Error deleting ticket:', err);
        res.status(500).json({ error: "Failed to delete ticket" });
    }
});

module.exports = router;