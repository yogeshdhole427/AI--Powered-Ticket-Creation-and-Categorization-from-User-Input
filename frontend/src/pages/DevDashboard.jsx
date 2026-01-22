import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  ShieldCheck, Layout, Clock, CheckCircle, AlertCircle, Search, Filter, 
  Smartphone, ShieldAlert, BarChart3, RefreshCcw, LogOut, Terminal, Bot,
  Activity, Bell, Users, Zap, History, UserPlus, Monitor, Cpu, Globe, 
  Database, Maximize2, MoreVertical, CheckCircle2, AlertTriangle, Play, 
  Pause, Timer, Command, Wifi, Server, HardDrive, Share2, Menu, X, 
  Archive, ArchiveRestore, Trash2, DownloadCloud, Eye, EyeOff,
  Layers, Box, Flame, TrendingUp, TrendingDown, UserCheck, Target,
  BarChart, PieChart, Users as UsersIcon, Filter as FilterIcon,
  Volume2, VolumeX, AlertOctagon, Lightbulb, Brain, Clock3,
  ChevronDown, ChevronUp, Download, Upload, Hash, Activity as ActivityIcon,
  AlertTriangle as AlertTriangleIcon, Loader
} from 'lucide-react';

/**
 * DEV_DASHBOARD: SENTINEL_PRIME_ELITE_PRO_V5
 * All data now fetched from backend APIs
 * No static/mock data used
 */
const getSLATimeLeft = (createdAt, priority) => {
  const SLA = { critical: 1, high: 2, medium: 4, low: 8 }; // hours
  const max = SLA[priority] || 4;
  const elapsed = (Date.now() - new Date(createdAt)) / 3600000;
  const timeLeft = Math.max(0, (max - elapsed).toFixed(2));
  return { timeLeft, isBreaching: timeLeft < 0.5 && priority === 'critical' };
};

// AI Root Cause Analysis Function
const analyzeRootCause = (tickets) => {
  if (!tickets || tickets.length === 0) return null;
  
  const categories = {};
  const keywords = {};
  
  tickets.forEach(ticket => {
    if (ticket.category) {
      if (!categories[ticket.category]) {
        categories[ticket.category] = { count: 0, tickets: [] };
      }
      categories[ticket.category].count++;
      categories[ticket.category].tickets.push(ticket);
      
      // Extract keywords from title
      if (ticket.title) {
        const words = ticket.title.toLowerCase().split(' ');
        words.forEach(word => {
          if (word.length > 3 && !['server', 'service', 'error', 'issue', 'system', 'network'].includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      }
    }
  });
  
  // Find top category and keywords
  const topCategory = Object.entries(categories)
    .sort(([,a], [,b]) => b.count - a.count)[0];
  
  const topKeywords = Object.entries(keywords)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);
  
  if (topCategory && topCategory[1].count > 3) {
    return {
      rootCause: `Likely root cause: ${topCategory[0]} service disruption`,
      confidence: Math.min(95, (topCategory[1].count / tickets.length * 100)),
      affectedTickets: topCategory[1].count,
      keywords: topKeywords
    };
  }
  
  return null;
};

const DevDashboard = () => {
  // --- UI INTERACTIVE STATES ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [criticalPopup, setCriticalPopup] = useState(null); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshRate, setRefreshRate] = useState(5000); // Default 5s
  const [isLive, setIsLive] = useState(true); // Toggle for auto-refresh
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString()); // Timestamp
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [notificationSound, setNotificationSound] = useState(true);
  const prevTicketsRef = useRef([]);
  
  // --- DATA STATES ---
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState({ status: 'all', priority: 'all', category: 'all', agent: 'all' });
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState([]); 
  const [sysStats, setSysStats] = useState({ cpu: 0, mem: 0 });
  const [agents, setAgents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [ticketTrend, setTicketTrend] = useState({ current: 0, previous: 0, direction: 'stable' });
  const [prioritySpike, setPrioritySpike] = useState(null);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  // --- NEW STATE FOR AGENTS & REASSIGNMENT ---
  const [allAgents, setAllAgents] = useState([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedAgentToAssign, setSelectedAgentToAssign] = useState('');
  const [agentPerformance, setAgentPerformance] = useState({});
  const [archivedTickets, setArchivedTickets] = useState([]);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [selectedArchivedTickets, setSelectedArchivedTickets] = useState([]);
  const [bulkArchiveMode, setBulkArchiveMode] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState({ 
    daysOld: 30, 
    category: 'all', 
    status: 'resolved' 
  });

  const agent = JSON.parse(localStorage.getItem('user') || '{"name": "Rakshitha N", "email": "rakshitha@nexus.io", "role": "agent"}');

  // --- 2. LIVE MESSAGE SYSTEM ---
  const addActivity = useCallback((msg, type = 'info') => {
    const log = { 
      id: Date.now(), 
      msg, 
      type, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      icon: type === 'error' ? AlertOctagon : type === 'success' ? CheckCircle : ActivityIcon
    };
    setActivities(prev => [log, ...prev].slice(0, 20));
  }, []);

  // --- FETCH ALL AGENTS FUNCTION ---
  const fetchAllAgents = useCallback(async () => {
    try {
      console.log('Fetching agents from API...');
      
      const token = localStorage.getItem('token');
      const config = {
        headers: {}
      };
      
      // Add authorization header if token exists
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get(`${API_BASE_URL}/agents`, config);
      const agentsData = response.data || [];
      
      console.log(`Received ${agentsData.length} agents`);
      setAllAgents(agentsData);
      
      // Extract unique agents from response
      const uniqueAgents = [...new Set(agentsData.map(a => a.email).filter(Boolean))];
      setAgents(uniqueAgents);
      
    } catch (err) {
      console.error('Error fetching agents:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      // Don't set any fallback - just log the error
      addActivity('⚠️ Failed to fetch agent data', 'warning');
    }
  }, [addActivity]); // Add addActivity to dependencies

  // --- FETCH ALL DATA FROM BACKEND ---
  const fetchAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    try {
      // Use AbortController to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      // Fetch tickets with timeout
      const ticketsRes = await axios.get(`${API_BASE_URL}/tickets`, {
        signal: controller.signal,
        timeout: 5000
      }).catch(err => {
        if (err.code === 'ECONNABORTED') {
          throw new Error('Request timeout - server might be restarting');
        }
        throw err;
      });
      
      const ticketsData = ticketsRes.data || [];
      
      // Use ref for previous open tickets instead of state
      const prevOpen = prevTicketsRef.current.filter(t => t.status === 'open').length;
      const currentOpen = ticketsData.filter(t => t.status === 'open').length;
      
      // Update the ref with current data
      prevTicketsRef.current = ticketsData;
      
      setTickets(ticketsData);
      
      // Extract unique categories and priorities from the data we have
      const uniqueCategories = [...new Set(ticketsData.map(t => t.category).filter(Boolean))];
      const uniquePriorities = [...new Set(ticketsData.map(t => t.priority).filter(Boolean))];
      setCategories(uniqueCategories);
      setPriorities(uniquePriorities);
      
      // Extract assigned agents from tickets (for filtering dropdown)
      const assignedAgents = [...new Set(ticketsData.map(t => t.assignedTo).filter(Boolean))];
      
      // Calculate rolling trend using ref data
      if (prevTicketsRef.current.length > 0) {
        setTicketTrend({
          current: currentOpen,
          previous: prevOpen,
          direction: currentOpen > prevOpen ? 'up' : currentOpen < prevOpen ? 'down' : 'stable'
        });
      }
      
      // Add activity log
      if (!isSilent) {
        addActivity(`🔄 Sync completed: ${ticketsData.length} tickets loaded`, "info");
      }
      
      clearTimeout(timeoutId);
    } catch (err) { 
      console.error("Fetch failed:", err.message);
      
      if (err.message.includes('timeout') || err.code === 'ERR_NETWORK') {
        addActivity("⚠️ Server is restarting. Using cached data.", "warning");
      } else {
        addActivity("🔌 Connection error to backend server", "error");
      }
    }
    finally { 
      setLoading(false); 
    }
  }, [addActivity]); // Add addActivity to dependencies

  // Run only once on component mount
  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Fetch both in parallel
        await Promise.all([
          fetchAllData(true),
          fetchAllAgents()
        ]);
      } catch (error) {
        console.error('Initial data loading failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); // Run only once on component mount

  // --- AUTO-REFRESH SETUP ---
  useEffect(() => {
    let intervalId = null;

    if (isLive) {
      intervalId = setInterval(() => {
        fetchAllData(true);
        setLastSynced(new Date().toLocaleTimeString());
      }, refreshRate);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, refreshRate, fetchAllData]); // Include fetchAllData

  // --- PRIORITY SPIKE DETECTOR (Real Data) ---
  const detectPrioritySpikes = useCallback((ticketsData) => {
    if (!ticketsData || ticketsData.length === 0) return;
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);
    
    const recentCritical = ticketsData.filter(t => 
      t.priority === 'critical' && 
      t.created_at &&
      new Date(t.created_at) > fiveMinutesAgo
    );
    
    if (recentCritical.length > 2 && !prioritySpike) {
      const categories = {};
      recentCritical.forEach(t => {
        if (t.category) {
          categories[t.category] = (categories[t.category] || 0) + 1;
        }
      });
      const topCategory = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topCategory) {
        setPrioritySpike({
          category: topCategory[0],
          count: recentCritical.length,
          timestamp: now.toISOString()
        });
        addActivity(`🚨 Priority spike detected: ${recentCritical.length} critical tickets in ${topCategory[0]}`, "error");
      }
    }
  }, [prioritySpike, addActivity]);

  // --- 1. DYNAMIC HUD ANALYTICS (From Real Data) ---
  const analytics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    
    const todayStr = new Date().toDateString();
    const todayAlerts = tickets.filter(t => 
      t.created_at && 
      new Date(t.created_at).toDateString() === todayStr
    ).length;
    
    // Calculate average resolution time from actual resolved tickets
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
    let avgResTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((acc, t) => {
        const created = new Date(t.created_at);
        const resolved = new Date(t.resolved_at);
        return acc + (resolved - created);
      }, 0);
      avgResTime = (totalTime / resolvedTickets.length / 3600000).toFixed(1);
    }

    // Calculate resolution velocity (tickets per hour)
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const recentResolved = tickets.filter(t => 
      t.status === 'resolved' && 
      t.resolved_at &&
      new Date(t.resolved_at) > hourAgo
    ).length;

    // Calculate AI accuracy from confidence scores
    const ticketsWithConfidence = tickets.filter(t => t.category_confidence);
    const avgConfidence = ticketsWithConfidence.length > 0 
      ? (ticketsWithConfidence.reduce((acc, t) => acc + (t.category_confidence || 0), 0) / ticketsWithConfidence.length * 100).toFixed(1)
      : "0.0";

    return { 
      total, 
      open, 
      resolved, 
      todayAlerts, 
      trainAccuracy: avgConfidence,
      avgResTime: `${avgResTime}h`,
      resolutionVelocity: recentResolved,
      rollingTrend: ticketTrend
    };
  }, [tickets, ticketTrend]);

  // --- LIVE HEATMAP DATA (From Real Data) ---
  const categoryHeatmap = useMemo(() => {
    const categories = {};
    tickets.forEach(ticket => {
      if (ticket.status === 'open' && ticket.category) {
        categories[ticket.category] = (categories[ticket.category] || 0) + 1;
      }
    });
    
    // Sort by volume and add intensity
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        intensity: Math.min(100, (count / tickets.length * 300))
      }));
  }, [tickets]);

  // --- AGENT LOAD BALANCER (From Real Data) ---
  const agentStats = useMemo(() => {
    const agentMap = {};
    
    tickets.forEach(ticket => {
      if (ticket.assignedTo) {
        if (!agentMap[ticket.assignedTo]) {
          agentMap[ticket.assignedTo] = {
            name: ticket.assignedTo,
            activeTickets: 0,
            resolvedTickets: 0,
            tickets: []
          };
        }
        if (ticket.status === 'open') {
          agentMap[ticket.assignedTo].activeTickets++;
        } else if (ticket.status === 'resolved') {
          agentMap[ticket.assignedTo].resolvedTickets++;
        }
        agentMap[ticket.assignedTo].tickets.push(ticket);
      }
    });
    
    // Calculate efficiency scores (0-100) based on actual performance
    return Object.values(agentMap).map(agent => {
      // Calculate resolution time average
      const resolvedTickets = agent.tickets.filter(t => t.status === 'resolved' && t.resolved_at);
      let avgResolutionHours = 0;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((acc, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.resolved_at);
          return acc + (resolved - created);
        }, 0);
        avgResolutionHours = totalTime / resolvedTickets.length / 3600000;
      }
      
      // Efficiency calculation based on:
      // 1. Number of resolved tickets (40%)
      // 2. Low active tickets (30%)
      // 3. Fast resolution time (30%)
      const efficiency = Math.min(100,
        (agent.resolvedTickets * 2) + // Max 40 points
        (Math.max(0, 10 - agent.activeTickets) * 3) + // Max 30 points
        (Math.max(0, 8 - avgResolutionHours) * 3.75) // Max 30 points
      );
      
      return {
        ...agent,
        efficiency: Math.round(efficiency),
        isOverloaded: agent.activeTickets > 8,
        avgResolutionHours: avgResolutionHours.toFixed(1)
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [tickets]);

  // --- AI ROOT CAUSE ANALYSIS (Real Data) ---
  const rootCauseAnalysis = useMemo(() => {
    const openTickets = tickets.filter(t => t.status === 'open');
    return analyzeRootCause(openTickets);
  }, [tickets]);

  const criticalNotifications = useMemo(() => {
    return tickets.filter(t => 
      (t.priority === 'critical' || t.priority === 'high') && 
      t.status === 'open'
    );
  }, [tickets]);

  // Notification sound function
  const playNotificationSound = (priority) => {
    if (!notificationSound || !window.AudioContext) return;
    
    try {
      // Check if context is in suspended state (autoplay policy)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume the context if it's suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          playTone(audioContext, priority);
        }).catch(err => {
          console.log("Audio context resume failed:", err);
        });
      } else {
        playTone(audioContext, priority);
      }
    } catch (err) {
      console.log("Audio not supported:", err);
    }
  };

  // Helper function to play the tone
  const playTone = (audioContext, priority) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different priorities
    if (priority === 'critical') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    } else if (priority === 'high') {
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    } else {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // --- ACTION FUNCTIONS ---
  const updateStatus = async (id, newStatus) => {
    // 1. Validation: Ensure ID exists and is not the string "undefined"
    if (!id || id === 'undefined' || id === 'N/A') {
      console.error('Invalid ticket ID:', id);
      addActivity('❌ Cannot resolve: Ticket ID is missing', 'error');
      
      // Try to get ID from selectedTicket as fallback
      if (selectedTicket && (selectedTicket._id || selectedTicket.id)) {
        id = selectedTicket._id || selectedTicket.id;
        console.log('Using fallback ID from selectedTicket:', id);
      } else {
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        addActivity('❌ Authentication required', 'error');
        return;
      }
      
      // 2. Network Call
      console.log('Updating ticket:', id, 'to status:', newStatus);
      const response = await axios.patch(`${API_BASE_URL}/tickets/${id}/status`, { 
        status: newStatus, 
        agentEmail: agent.email,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 3. Update local tickets list
      setTickets(prev => prev.map(t => {
        const ticketId = t._id || t.id;
        return ticketId === id ? { ...t, status: newStatus } : t;
      }));
      
      // 4. Update the currently viewed ticket
      setSelectedTicket(prev => prev && (prev._id === id || prev.id === id) 
        ? { ...prev, status: newStatus } 
        : prev
      );
      
      addActivity(`✅ Ticket Status: ${newStatus}`, "success");
    } catch (err) { 
      console.error("Update failed:", err);
      addActivity(`❌ Update failed: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  // Add this function for toggling ticket selection
  const toggleTicketSelection = (ticketId) => {
    setSelectedArchivedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const testArchiveEndpoint = async () => {
    try {
      // First get a test ticket
      if (tickets.length === 0) {
        addActivity('❌ No tickets available to test', 'error');
        return;
      }
      
      const testTicket = tickets[0];
      const ticketId = testTicket._id || testTicket.id;
      
      console.log('Testing archive with ticket:', ticketId);
      
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Test endpoint availability
      const testResponse = await axios.get(`${API_BASE_URL}/debug/archive-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Archive status:', testResponse.data);
      
      alert(`Archive System Status:
        Table exists: ${testResponse.data.tableExists}
        Records: ${testResponse.data.recordCount}
        Columns: ${testResponse.data.tableColumns?.length || 0}
      `);
      
    } catch (err) {
      console.error('Archive test failed:', err);
      addActivity('❌ Archive system test failed', 'error');
      alert(`Test failed: ${err.message}\n\nCheck server logs.`);
    }
  };

  const assignToAgent = async (ticketId, agentEmail) => {
    if (!ticketId || ticketId === 'undefined' || !agentEmail) {
      console.error('Invalid parameters for reassignment:', { ticketId, agentEmail });
      addActivity('❌ Invalid parameters for reassignment', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      console.log('Attempting reassignment:', {
        ticketId,
        agentEmail,
        reassignedBy: currentUser.email
      });
      
      const response = await axios.patch(
        `${API_BASE_URL}/tickets/${ticketId}/reassign`, 
        { 
          assignedTo: agentEmail,
          reassignedBy: currentUser.email
        }, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Reassignment successful:', response.data);
      
      // Update local state
      setTickets(prev => prev.map(t => {
        const tId = t._id || t.id;
        return tId === ticketId ? { ...t, assignedTo: agentEmail } : t;
      }));
      
      setSelectedTicket(prev => {
        if (!prev) return prev;
        const tId = prev._id || prev.id;
        return tId === ticketId ? { ...prev, assignedTo: agentEmail } : prev;
      });
      
      addActivity(`✅ Ticket reassigned to ${agentEmail}`, "success");
      
      // Refresh agent data
      await fetchAllAgents();
      
    } catch (err) {
      console.error('Assignment failed:', err);
      
      let errorMessage = 'Unknown error';
      
      if (err.response) {
        // Server responded with error
        console.error('Server response:', err.response.data);
        errorMessage = err.response.data?.error || err.response.data?.message || err.response.statusText;
        
        if (err.response.status === 404) {
          errorMessage = 'Ticket not found';
        } else if (err.response.status === 403) {
          errorMessage = 'You are not authorized to reassign tickets';
        } else if (err.response.status === 400) {
          errorMessage = `Invalid request: ${err.response.data?.message}`;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check if server is running.';
        console.error('No response received:', err.request);
      } else {
        // Something else happened
        errorMessage = err.message;
      }
      
      addActivity(`❌ Reassignment failed: ${errorMessage}`, "error");
      
      // Show user-friendly alert for important errors
      if (errorMessage.includes('not authorized') || errorMessage.includes('Ticket not found')) {
        alert(`Reassignment failed: ${errorMessage}`);
      }
    }
  };

  const archiveTicket = async (ticketId, reason = 'Archived by user') => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id;
      
      if (!userId) {
        addActivity('❌ User ID not found. Please log in again.', 'error');
        return;
      }

      console.log("Attempting to archive ticket:", {
        ticketId,
        userId,
        userEmail: user.email,
        userRole: user.role,
        reason
      });

      // First check if user has permission
      if (!['admin', 'agent'].includes(user.role)) {
        addActivity('❌ Unauthorized: Only agents/admins can archive', 'error');
        alert('You need agent or admin privileges to archive tickets.');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/tickets/${ticketId}/archive`, 
        {
          userId,
          reason
        }, 
        {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          timeout: 10000
        }
      );

      console.log("Archive API response:", response.data);

      // Update local state
      setTickets(prev => prev.filter(t => {
        const tId = t.id || t._id;
        return tId !== ticketId;
      }));
      
      if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket._id === ticketId)) {
        setSelectedTicket(null);
      }

      addActivity(`📦 Ticket archived: ${reason}`, "success");
      
      // Refresh data
      fetchAllData(true);
      
    } catch (err) {
      console.error('Archive failed:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Unknown error';
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || err.response.data?.message || err.response.statusText;
        
        if (err.response.status === 403) {
          errorMessage = 'Unauthorized: You need agent/admin privileges';
          alert('You need agent or admin privileges to archive tickets.');
        } else if (err.response.status === 404) {
          errorMessage = 'Ticket not found';
        } else if (err.response.status === 400) {
          errorMessage = `Bad request: ${err.response.data?.error}`;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check if server is running.';
      } else {
        // Something else happened
        errorMessage = err.message;
      }
      
      addActivity(`❌ Archive failed: ${errorMessage}`, "error");
      
      // For debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error:', err);
        alert(`Archive failed: ${errorMessage}\n\nCheck console for details.`);
      }
    }
  };

  // Restore archived ticket (NEW FUNCTION - ADD THIS)
  const restoreTicket = async (archiveId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = agent.id || localStorage.getItem('userId');
      
      if (!userId) {
        addActivity('❌ User ID not found', 'error');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/tickets/${archiveId}/restore`, {
        userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch fresh data to get restored ticket
      fetchAllData(true);
      addActivity(`📦 Ticket restored successfully`, "success");
      
    } catch (err) {
      console.error('Restore failed:', err);
      addActivity(`❌ Restore failed: ${err.response?.data?.error || err.message}`, "error");
    }
  };

  // Permanent delete archived ticket (UPDATE THIS FUNCTION)
  const permanentDeleteArchived = async (ticketId = null) => {
    try {
      const token = localStorage.getItem('token');
      const userId = agent.id || localStorage.getItem('userId');
      
      if (agent.role !== 'admin') {
        addActivity('❌ Only admins can permanently delete tickets', 'error');
        return;
      }
      
      // If single ticket ID provided
      const ticketsToDelete = ticketId ? [ticketId] : selectedArchivedTickets;
      
      if (ticketsToDelete.length === 0) {
        addActivity('❌ No tickets selected for deletion', 'warning');
        return;
      }
      
      const confirmMessage = ticketId 
        ? '⚠️ WARNING: This will PERMANENTLY delete this archived ticket. This action cannot be undone. Type "DELETE" to confirm.'
        : `⚠️ WARNING: This will PERMANENTLY delete ${ticketsToDelete.length} archived tickets. This action cannot be undone. Type "DELETE" to confirm.`;
      
      const userConfirm = window.confirm(confirmMessage);
      if (!userConfirm) return;
      
      // Delete each ticket
      const deletePromises = ticketsToDelete.map(async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/tickets/archived/${id}`, {
          data: {
            userId,
            confirm: 'DELETE'
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
      });
      
      await Promise.all(deletePromises);
      
      // Refresh archive list
      fetchArchivedTickets();
      
      // Clear selection
      setSelectedArchivedTickets([]);
      
      addActivity(`🗑️ Permanently deleted ${ticketsToDelete.length} archived tickets`, "warning");
      
    } catch (err) {
      console.error('Permanent deletion failed:', err);
      addActivity(`❌ Deletion failed: ${err.response?.data?.error || err.message}`, "error");
    }
  };

  const bulkArchiveTickets = async () => {
    if (selectedArchivedTickets.length === 0) return;
    
    const reason = prompt('Enter reason for bulk archive:', `Bulk archive by ${agent.name}`);
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = currentUser.id || localStorage.getItem('userId');
      
      if (!userId) {
        addActivity('❌ User not authenticated', 'error');
        return;
      }
      
      // Check if user has permission for bulk archive
      if (currentUser.role !== 'admin' && currentUser.role !== 'agent') {
        addActivity('❌ Only agents and admins can bulk archive tickets', 'error');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/tickets/bulk-archive`, {
        userId,
        ticketIds: selectedArchivedTickets,
        reason,
        userRole: currentUser.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setTickets(prev => prev.filter(t => {
        const tId = t.id || t._id;
        return !selectedArchivedTickets.includes(tId);
      }));
      
      // Clear selected tickets
      setSelectedArchivedTickets([]);
      setBulkArchiveMode(false);
      
      // Clear selected ticket if it was archived
      if (selectedTicket && selectedArchivedTickets.includes(selectedTicket.id || selectedTicket._id)) {
        setSelectedTicket(null);
      }
      
      addActivity(`📦 Bulk archived ${selectedArchivedTickets.length} tickets`, "success");
      
      // Refresh data
      fetchAllData(true);
      
    } catch (err) {
      console.error('Bulk archive failed:', err);
      if (err.response?.status === 403) {
        addActivity('❌ Permission denied for bulk archive', "error");
      } else {
        addActivity(`❌ Bulk archive failed: ${err.response?.data?.error || err.message}`, "error");
      }
    }
  };

  // Fetch archived tickets (UPDATE THIS FUNCTION)
  const fetchArchivedTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = agent.id || localStorage.getItem('userId');
      const userRole = agent.role;
      
      if (!userId) {
        addActivity('❌ User not authenticated', 'error');
        return [];
      }
      
      const response = await axios.get(`${API_BASE_URL}/tickets/archived`, {
        params: {
          userId,
          adminView: userRole === 'admin' || userRole === 'agent',
          page: 1,
          limit: 100
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tickets = response.data.tickets || [];
      setArchivedTickets(tickets);
      addActivity(`📦 Loaded ${tickets.length} archived tickets`, 'success');
      
      return tickets;
      
    } catch (err) {
      console.error('Error fetching archived tickets:', err);
      addActivity('❌ Failed to fetch archived tickets', 'error');
      return [];
    }
  };

  const unarchiveTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const userId = agent.id || localStorage.getItem('userId');
      
      if (!userId) {
        addActivity('❌ User ID not found', 'error');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/tickets/${ticketId}/unarchive`, {
        userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch fresh data to get unarchived ticket
      fetchAllData(true);
      addActivity(`📦 Ticket unarchived successfully`, "success");
      
    } catch (err) {
      console.error('Unarchive failed:', err);
      addActivity(`❌ Unarchive failed: ${err.response?.data?.error || err.message}`, "error");
    }
  };

  // --- FIXED EXPORT FUNCTION ---
  const exportArchiveData = useCallback(() => {
    if (archivedTickets.length === 0) {
      addActivity('❌ No archived tickets to export', 'warning');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalTickets: archivedTickets.length,
      tickets: archivedTickets,
      exportInfo: {
        exportedBy: agent.name,
        userEmail: agent.email,
        archiveFilter: archiveFilter
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archive-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addActivity(`📥 Exported ${archivedTickets.length} archived tickets`, 'success');
  }, [archivedTickets, agent.name, agent.email, archiveFilter, addActivity]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tickets.filter(t => {
      const matchStatus = filter.status === 'all' || t.status === filter.status;
      const matchPriority = filter.priority === 'all' || t.priority === filter.priority;
      const matchCategory = filter.category === 'all' || t.category === filter.category;
      const matchAgent = filter.agent === 'all' || t.assignedTo === filter.agent;
      const matchSearch = t.title?.toLowerCase().includes(q) || 
                         t.category?.toLowerCase().includes(q) || 
                         t._id?.includes(q) ||
                         t.description?.toLowerCase().includes(q);
      return matchStatus && matchPriority && matchCategory && matchAgent && matchSearch;
    });
  }, [tickets, filter, searchQuery]);

  const theme = { primary: '#6366f1', danger: '#ef4444', success: '#10b981', text: '#0f172a', muted: '#64748b' };

  // Make sure there's a proper closing brace here for the component function
  return ( // Line 1112 - This should be inside the DevDashboard function
    <div style={styles.appContainer}>
      
      {/* EMERGENCY MODAL */}
      {criticalPopup && (
  <div style={styles.modalBackdrop}>
    <div style={styles.modalBody}>
      <div style={styles.modalHeader}><Flame size={32} /> CRITICAL_PRIORITY_DETECTED</div>
      <h2 style={{ fontSize: '32px', margin: '20px 0', letterSpacing: '-2px' }}>{criticalPopup.title}</h2>
      <p style={{ opacity: 0.8, marginBottom: '30px' }}>
        Ticket ID: #{criticalPopup._id?.slice(-6).toUpperCase() || criticalPopup.id?.slice(-6).toUpperCase() || 'N/A'}
        <br/>
        Urgent attention required. Priority: {criticalPopup.priority?.toUpperCase()}
        <br/>
        Category: {criticalPopup.category || 'Unknown'}
      </p>
      <div style={{ display: 'flex', gap: '15px' }}>
        <button onClick={() => { setSelectedTicket(criticalPopup); setCriticalPopup(null); }} style={styles.ackBtn}>TRIAGE_NOW</button>
        <button onClick={() => setCriticalPopup(null)} style={styles.dismissBtn}>DISMISS</button>
      </div>
    </div>
  </div>
)}

      {/* PRIORITY SPIKE ALERT */}
      {prioritySpike && (
        <div style={styles.spikeAlert}>
          <AlertTriangle size={20} />
          <span style={{flex: 1}}>
            <strong>Priority Spike Detected:</strong> {prioritySpike.count} critical tickets in {prioritySpike.category}
          </span>
          <button onClick={() => setPrioritySpike(null)} style={styles.closeAlertBtn}>×</button>
        </div>
      )}

      {/* COLUMN 1: THE FIXED FAB GUTTER */}
      <div style={styles.fixedGutter}>
        <button onClick={() => setIsSidebarOpen(true)} style={styles.fabMain}><Menu color="#fff" size={24}/></button>
        <button onClick={() => setFilter({...filter, status: 'open'})} style={styles.fabSub} title="Filter Open"><Clock size={20}/></button>
        <button onClick={() => setFilter({...filter, status: 'all'})} style={{...styles.fabSub, background: theme.danger}}><AlertCircle color="#fff" size={20}/></button>
        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} style={styles.fabSub} title="Advanced Filters"><FilterIcon size={20}/></button>
      </div>

      {/* ADVANCED FILTERS PANEL */}
      {showAdvancedFilters && (
        <div style={styles.advancedFiltersPanel}>
          <div style={styles.filterHeader}>
            <h3 style={{margin: 0}}>Advanced Filters</h3>
            <button onClick={() => setShowAdvancedFilters(false)} style={styles.closeBtn}><X size={20}/></button>
          </div>
          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Status</label>
              <select 
                style={styles.filterSelect}
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Priority</label>
              <select 
                style={styles.filterSelect}
                value={filter.priority}
                onChange={(e) => setFilter({...filter, priority: e.target.value})}
              >
                <option value="all">All Priorities</option>
                {priorities.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Category</label>
              <select 
                style={styles.filterSelect}
                value={filter.category}
                onChange={(e) => setFilter({...filter, category: e.target.value})}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Assigned Agent</label>
              <select 
                style={styles.filterSelect}
                value={filter.agent}
                onChange={(e) => setFilter({...filter, agent: e.target.value})}
              >
                <option value="all">All Agents</option>
                {agents.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. OVERLAY: THE SCROLLABLE DRAWER SIDEBAR */}
      {isSidebarOpen && <div style={styles.backdrop} onClick={() => setIsSidebarOpen(false)} />}
      <div style={{...styles.sidebarOverlay, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <div style={styles.drawerHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: theme.primary }}>
            <Layers size={32} />
            <span style={{ fontSize: '20px', fontWeight: '900' }}>HQ_SENTINEL</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} style={styles.closeBtn}><X size={20}/></button>
        </div>
        
        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <p style={styles.label}>COMMAND_FILTERS</p>
          <button onClick={() => { setFilter({...filter, status: 'all'}); setIsSidebarOpen(false); }} style={styles.navLink(filter.status === 'all')}>
            Full Spectrum ({tickets.length})
          </button>
          <button onClick={() => { setFilter({...filter, status: 'open'}); setIsSidebarOpen(false); }} style={styles.navLink(filter.status === 'open')}>
            Active Feed ({analytics.open})
          </button>
          <button onClick={() => { setFilter({...filter, status: 'resolved'}); setIsSidebarOpen(false); }} style={styles.navLink(filter.status === 'resolved')}>
            Archive vault ({analytics.resolved})
          </button>
          <button onClick={() => { 
    setFilter({...filter, status: 'ai_resolved'}); 
    setIsSidebarOpen(false); 
  }} style={styles.navLink(filter.status === 'ai_resolved')}>
    AI Resolved Tickets ({tickets.filter(t => t.status === 'ai_resolved').length})
  </button>

{/* Add this after the "AI Resolved Tickets" button */}
<button onClick={() => { 
  setFilter({...filter, status: 'all', isArchived: true}); 
  setIsSidebarOpen(false); 
}} style={styles.navLink(filter.isArchived === true)}>
  <Archive size={16} /> Archived Vault ({tickets.filter(t => t.isArchived).length})
</button>

{/* Add this section after the AGENT LOAD BALANCER section */}
{(agent.role === 'admin' || agent.role === 'agent') && (
  <>
    <p style={{...styles.label, marginTop: '40px'}}>ADMIN ARCHIVE TOOLS ⚙️</p>
    <button onClick={() => { 
      setShowArchivePanel(true); 
      setIsSidebarOpen(false); 
    }} style={styles.navLink(false)}>
      <ArchiveRestore size={16} /> Manage Archive
    </button>
    <button onClick={() => { 
      setBulkArchiveMode(!bulkArchiveMode); 
      setIsSidebarOpen(false); 
    }} style={styles.navLink(bulkArchiveMode)}>
      <DownloadCloud size={16} /> Bulk Archive Mode
    </button>
    {agent.role === 'admin' && (
      <button onClick={() => { 
        setShowDeleteConfirmation(true); 
        setIsSidebarOpen(false); 
      }} style={{...styles.navLink(false), color: '#ef4444'}}>
        <Trash2 size={16} /> Cleanup Old Archive
      </button>
    )}
  </>
)}

          {/* LIVE HEATMAP */}
          <p style={{...styles.label, marginTop: '40px'}}>LIVE HEATMAP 🔥</p>
          <div style={styles.heatmapContainer}>
            {categoryHeatmap.map(item => (
              <div key={item.category} style={styles.heatmapItem}>
                <span style={{fontSize: '12px', fontWeight: '600'}}>{item.category}</span>
                <div style={styles.heatmapBar}>
                  <div style={{
                    ...styles.heatmapFill,
                    width: `${item.intensity}%`,
                    background: item.intensity > 70 ? '#ef4444' : item.intensity > 40 ? '#f59e0b' : '#10b981'
                  }} />
                </div>
                <span style={{fontSize: '11px', color: theme.muted}}>{item.count} active</span>
              </div>
            ))}
          </div>
          
          {/* AGENT LEADERBOARD */}
          <p style={{...styles.label, marginTop: '40px'}}>AGENT LEADERBOARD 🏆</p>
          {leaderboard.length > 0 ? (
            leaderboard.slice(0, 5).map((agent, index) => (
              <div key={agent._id} style={styles.leaderboardItem}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#92400e' : '#e2e8f0',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: index < 3 ? '#fff' : '#000',
                    fontSize: '10px',
                    fontWeight: '900'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{fontSize: '12px', fontWeight: '600'}}>{agent._id || 'Unassigned'}</span>
                </div>
                <span style={{fontSize: '11px', color: theme.primary, fontWeight: '700'}}>{agent.count} resolved</span>
              </div>
            ))
          ) : (
            <p style={{fontSize: '12px', color: theme.muted, padding: '10px'}}>No agent data available</p>
          )}
          
          {/* AGENT LOAD BALANCER */}
          {agentStats.length > 0 && (
            <>
              <p style={{...styles.label, marginTop: '40px'}}>AGENT LOAD BALANCER ⚖️</p>
              {agentStats.slice(0, 3).map(agent => (
                <div key={agent.name} style={styles.agentLoadItem}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontSize: '12px', fontWeight: '600'}}>{agent.name}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: agent.isOverloaded ? theme.danger : theme.success
                    }}>
                      {agent.efficiency}%
                    </span>
                  </div>
                  <div style={styles.loadBar}>
                    <div style={{
                      ...styles.loadFill,
                      width: `${Math.min(100, agent.activeTickets * 12.5)}%`,
                      background: agent.isOverloaded ? theme.danger : theme.primary
                    }} />
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.muted}}>
                    <span>Active: {agent.activeTickets}</span>
                    <span>Resolved: {agent.resolvedTickets}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Visibility ensured via Sidebar Scroll */}
        <div style={styles.agentInfo}>
           <p style={{ margin: 0, fontWeight: '900' }}>{agent.name}</p>
           <p style={{ margin: '5px 0 0', fontSize: '12px', color: theme.muted }}>{agent.role}</p>
           <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.logoutBtn}><LogOut size={14}/> ABORT_SESSION</button>
        </div>
      </div>

      <div style={styles.mainContentWrapper}>
        
        {/* HEADER: ALIGNED SEARCH & BELL */}
        <div style={styles.hudHeader}>
          <div style={styles.hudGrid}>
            <div style={styles.metricBlock}>
              <p>QUEUE_DEPTH</p>
              <h3>{analytics.open} 
                {ticketTrend.direction === 'up' ? 
                  <TrendingUp size={16} style={{marginLeft: '10px', color: theme.danger}} /> : 
                  ticketTrend.direction === 'down' ? 
                  <TrendingDown size={16} style={{marginLeft: '10px', color: theme.success}} /> : 
                  <span className="pulse-dot" />
                }
              </h3>
            </div>
            <div style={styles.metricBlock}>
              <p>TODAY_ALERTS</p>
              <h3 style={{color: theme.danger}}>{analytics.todayAlerts}</h3>
            </div>
            <div style={styles.metricBlock}>
              <p>RESOLVED</p>
              <h3>{analytics.resolved}</h3>
            </div>
            <div style={styles.metricBlock}>
              <p>AI_ACCURACY</p>
              <h3 style={{color: theme.success}}>{analytics.trainAccuracy}%</h3>
            </div>
            {/* 🕒 INSERT THE REFRESH_CONTROL BLOCK HERE */}
            <div style={styles.metricBlock}>
              <p>RES_VELOCITY</p>
              <h3 style={{color: '#8b5cf6'}}>{analytics.resolutionVelocity}/hr</h3>
            </div>
          </div>

          <div style={styles.hudRightSection}>
            <div style={styles.searchBar}>
              <Search size={18} color={theme.muted}/>
              <input 
                placeholder="Search by title, category, or ID..." 
                style={styles.inputReset} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>×</button>
              )}
            </div>
            <button onClick={() => setNotificationSound(!notificationSound)} style={styles.soundToggleBtn}>
              {notificationSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <div style={styles.notificationWrapper} onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={22} color={criticalNotifications.length > 0 ? theme.danger : "#1e293b"} className={criticalNotifications.length > 0 ? 'shake' : ''} />
              {criticalNotifications.length > 0 && <span style={styles.notificationBadge}>{criticalNotifications.length}</span>}
              
              {showNotifications && (
                <div style={styles.notificationPanel}>
                  <div style={styles.notificationHeader}>
                    <AlertTriangleIcon size={14} /> Critical Alerts ({criticalNotifications.length})
                  </div>
                  <div style={styles.notificationBody}>
                    {criticalNotifications.length === 0 ? 
                      <p style={{padding: 15, fontSize: 12}}>No active alerts</p> : 
                      criticalNotifications.map(n => (
                        <div key={n._id} style={styles.notificationItem} onClick={() => {setSelectedTicket(n); setShowNotifications(false);}}>
  <div style={styles.notificationTitle}>{n.title}</div>
  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.muted}}>
    <span>
      #{n._id ? n._id.toString().slice(-6).toUpperCase() : n.id ? n.id.toString().slice(-6).toUpperCase() : 'N/A'} • {n.category}
    </span>
    <span>{n.priority?.toUpperCase()}</span>
  </div>
</div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROOT CAUSE ANALYSIS BANNER */}
        {rootCauseAnalysis && (
          <div style={styles.rootCauseBanner}>
            <Brain size={18} />
            <div style={{flex: 1}}>
              <strong style={{color: '#fff'}}>AI Root Cause Analysis:</strong> {rootCauseAnalysis.rootCause}
              <div style={{fontSize: '11px', opacity: 0.8, marginTop: '5px'}}>
                Confidence: {rootCauseAnalysis.confidence.toFixed(1)}% • Affected: {rootCauseAnalysis.affectedTickets} tickets • Keywords: {rootCauseAnalysis.keywords.join(', ')}
              </div>
            </div>
          </div>
        )}
        {/* BULK ARCHIVE BANNER */}
{bulkArchiveMode && selectedArchivedTickets.length > 0 && (
  <div style={styles.bulkArchiveBanner}>
    <Archive size={20} />
    <span style={{flex: 1}}>
      <strong>Bulk Archive Mode:</strong> {selectedArchivedTickets.length} tickets selected
    </span>
    <button 
      onClick={bulkArchiveTickets}
      style={styles.bulkArchiveBtn}
    >
      Archive {selectedArchivedTickets.length} Tickets
    </button>
    <button 
      onClick={() => {
        setSelectedArchivedTickets([]);
        setBulkArchiveMode(false);
      }}
      style={styles.cancelBulkBtn}
    >
      Cancel
    </button>
  </div>
)}
        <div style={styles.dualPaneContainer}>
          {/* COLUMN 2: STREAM (450px) */}
          <div style={styles.ingressStreamColumn}>
  <div style={styles.streamScrollArea}>
    {filteredTickets.length === 0 ? (
      <div style={styles.emptyState}>
        <Search size={32} color="#cbd5e1" />
        <p style={{color: '#94a3b8', fontSize: '14px'}}>No tickets found</p>
      </div>
    ) : (
      filteredTickets.map(t => {
        const ticketId = t._id || t.id || 'N/A';
        const displayTicketId = ticketId && ticketId !== 'N/A' 
          ? `#${ticketId.toString().slice(-6).toUpperCase()}` 
          : 'N/A';
        
        const slaInfo = getSLATimeLeft(t.created_at, t.priority);
        return (
          <div key={ticketId} style={styles.ticketCard(selectedTicket?._id === ticketId)}>
            <div style={styles.cardHeader}>
              <span style={styles.ticketId}>{displayTicketId}</span>
              <span style={pBadge(t.priority)}>{t.priority?.toUpperCase()}</span>
              {/* AI HANDLED BADGE */}
              {t.handledByAI && (
                <span style={styles.aiHandledBadge}>
                  <Bot size={10} />
                  AI_HANDLED
                </span>
              )}
            </div>
            <h4 style={styles.cardTitle} onClick={() => setSelectedTicket(t)}>{t.title}</h4>
            <div style={styles.cardMeta}>
              <div style={{
                ...styles.dot, 
                background: t.status === 'open' ? '#f59e0b' : 
                           t.status === 'ai_resolved' ? '#8b5cf6' : 
                           theme.success
              }} />
              <span style={{
                color: t.status === 'resolved' ? theme.success : 
                       t.status === 'ai_resolved' ? '#8b5cf6' : 
                       '#64748b'
              }}>
                {t.status === 'ai_resolved' ? 'AI_RESOLVED' : t.status?.toUpperCase()}
              </span>
              {t.category && (
                <>
                  <div style={styles.vDivider} />
                  <span style={{fontSize: '10px', color: theme.muted}}>{t.category}</span>
                </>
              )}
              {t.assignedTo && (
                <>
                  <div style={styles.vDivider} />
                  <UserCheck size={12} />
                  <span style={{fontSize: '10px', color: theme.primary}}>{t.assignedTo}</span>
                </>
              )}
            </div>
            
            {/* ARCHIVE BUTTON */}
            <div style={styles.ticketActions}>
              {bulkArchiveMode ? (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleTicketSelection(ticketId);
    }}
    style={{
      ...styles.archiveBtn,
      background: selectedArchivedTickets.includes(ticketId) ? '#6366f1' : '#f1f5f9',
      color: selectedArchivedTickets.includes(ticketId) ? '#fff' : '#64748b'
    }}
  >
    {selectedArchivedTickets.includes(ticketId) ? '✓ Selected' : 'Select'}
  </button>
) : (
  <button 
    onClick={(e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Check permissions
      if (!agent.role || (agent.role !== 'admin' && agent.role !== 'agent')) {
        alert('Only agents and admins can archive tickets.');
        return;
      }
      
      const reason = prompt(
        'Enter reason for archiving:', 
        `Archived by ${agent.name} on ${new Date().toLocaleDateString()}`
      );
      
      if (reason && reason.trim()) {
        if (window.confirm(`Archive ticket: "${t.title}"?`)) {
          archiveTicket(ticketId, reason.trim());
        }
      }
    }}
    style={styles.archiveBtn}
    disabled={!agent.role || (agent.role !== 'admin' && agent.role !== 'agent')}
  >
    <Archive size={12} /> 
    {(!agent.role || (agent.role !== 'admin' && agent.role !== 'agent')) ? 'Unauthorized' : 'Archive'}
  </button>
)}
              
              {slaInfo.isBreaching && t.status === 'open' && (
                <div style={styles.slaWarning}>
                  <Clock3 size={12} />
                  <span style={{fontSize: '10px', marginLeft: '5px'}}>
                    SLA Breaching: {slaInfo.timeLeft} hrs left
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

          {/* COLUMN 3: INCIDENT HUB (Massive Text) */}
          <div style={styles.displayHubColumn}>
            {selectedTicket ? (
              <div style={{padding: '48px'}} className="fade-in">
                <div style={styles.incidentHeader}>
                  <div style={{ flex: 1 }}>
                    <h1 style={styles.giantTitle}>{selectedTicket.title}</h1>
                    <div style={styles.incidentSubHeader}>
                      {selectedTicket.created_at && (
                        <>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '900',
                            color: getSLATimeLeft(selectedTicket.created_at, selectedTicket.priority).isBreaching
                              ? theme.danger
                              : '#f59e0b'
                          }}>
                            ⏱ SLA: {getSLATimeLeft(selectedTicket.created_at, selectedTicket.priority).timeLeft} hrs
                          </span>
                          <div style={styles.vDivider} />
                        </>
                      )}
                      <span style={pBadge(selectedTicket.priority)}>{selectedTicket.priority?.toUpperCase()} PRIORITY</span>
                      <div style={styles.vDivider} />
                      <span style={{color: theme.muted, fontSize: '13px'}}>
                        <Timer size={16}/> Created: {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString() : 'N/A'}
                      </span>
                      {selectedTicket.resolved_at && (
                        <>
                          <div style={styles.vDivider} />
                          <span style={{color: theme.success, fontSize: '13px'}}>
                            <CheckCircle size={16}/> Resolved: {new Date(selectedTicket.resolved_at).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedTicket.status === 'open' ? (
  <div style={{display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap'}}>
    {selectedTicket.assignedTo ? (
      <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
        <div style={styles.assignedBadge}>
          <UserCheck size={16} />
          <span>Assigned to: {selectedTicket.assignedTo}</span>
        </div>
        <button 
          onClick={() => setShowReassignModal(true)}
          style={styles.reassignBtn}
        >
          <Share2 size={14} /> Reassign
        </button>
      </div>
    ) : (
      <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
        <select 
          style={styles.assignSelect}
          value=""
          onChange={(e) => {
            const agentEmail = e.target.value;
            if (agentEmail) {
              const ticketId = selectedTicket._id || selectedTicket.id;
              if (ticketId) {
                assignToAgent(ticketId, agentEmail);
              } else {
                alert('Cannot assign: No valid ticket ID found');
              }
            }
          }}
        >
          <option value="">Quick assign to top agent...</option>
          {allAgents
            .sort((a, b) => (b.resolvedTickets || 0) - (a.resolvedTickets || 0))
            .slice(0, 3)
            .map(agent => (
              <option key={agent.email} value={agent.email}>
                {agent.name} ({agent.resolvedTickets || 0} resolved)
              </option>
            ))}
        </select>
        <button 
          onClick={() => setShowReassignModal(true)}
          style={styles.viewAllBtn}
        >
          <Users size={14} /> View All Agents
        </button>
      </div>
    )}
    <button 
      onClick={() => {
        const ticketId = selectedTicket._id || selectedTicket.id;
        if (ticketId) {
          updateStatus(ticketId, 'resolved');
        } else {
          console.error('No ticket ID found:', selectedTicket);
          addActivity('❌ Cannot resolve: No ticket ID found', 'error');
        }
      }} 
      className="resolve-btn"
      style={{ opacity: !selectedTicket?._id && !selectedTicket?.id ? 0.5 : 1 }}
    >
      <CheckCircle2 size={18}/> MARK_AS_SOLVED
    </button>
  </div>
) : selectedTicket.status === 'ai_resolved' ? (
  <div style={styles.aiResolvedLabel}>
    <Bot size={20}/> AI_RESOLVED
    <div style={{display: 'flex', gap: '15px', marginTop: '10px'}}>
      <button 
        onClick={() => {
          const ticketId = selectedTicket._id || selectedTicket.id;
          if (ticketId) {
            updateStatus(ticketId, 'resolved');
          }
        }}
        style={styles.aiConfirmBtn}
      >
        <CheckCircle2 size={16}/> CONFIRM_AI_SOLUTION
      </button>
      <button 
        onClick={() => {
          const ticketId = selectedTicket._id || selectedTicket.id;
          if (ticketId) {
            updateStatus(ticketId, 'open');
          }
        }}
        style={styles.aiReopenBtn}
      >
        <AlertTriangle size={16}/> REOPEN_TICKET
      </button>
    </div>
  </div>
) : (
  <div style={styles.solvedLabel}>
    <CheckCircle size={20}/> INCIDENT_RESOLVED
    {selectedTicket.assignedTo && (
      <span style={{fontSize: '12px', marginLeft: '10px'}}>by {selectedTicket.assignedTo}</span>
    )}
  </div>
)}
                </div>

                <div style={styles.detailsGrid}>
                  <div style={styles.manifestCard}>
                    <p style={styles.cardLabel}><Terminal size={16}/> RAW_MANIFEST_DATA</p>
                    <div style={styles.manifestBody}>{selectedTicket.description || 'No description available'}</div>
                    
                    {/* ENTITY EXTRACTION */}
                    {selectedTicket.entities && (
                      <div style={styles.entitySection}>
                        <p style={{...styles.cardLabel, marginTop: '30px'}}><Database size={16}/> EXTRACTED ENTITIES</p>
                        <div style={styles.entityGrid}>
                          {selectedTicket.entities.devices && selectedTicket.entities.devices.length > 0 && (
                            <div style={styles.entityGroup}>
                              <span style={styles.entityLabel}>Devices</span>
                              <div style={styles.entityTags}>
                                {selectedTicket.entities.devices.map((device, idx) => (
                                  <span key={idx} style={styles.entityTag}>{device}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedTicket.entities.usernames && selectedTicket.entities.usernames.length > 0 && (
                            <div style={styles.entityGroup}>
                              <span style={styles.entityLabel}>Users</span>
                              <div style={styles.entityTags}>
                                {selectedTicket.entities.usernames.map((user, idx) => (
                                  <span key={idx} style={styles.entityTag}>{user}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedTicket.entities.error_codes && selectedTicket.entities.error_codes.length > 0 && (
                            <div style={styles.entityGroup}>
                              <span style={styles.entityLabel}>Error Codes</span>
                              <div style={styles.entityTags}>
                                {selectedTicket.entities.error_codes.map((code, idx) => (
                                  <span key={idx} style={styles.entityTag}>{code}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Add this after the ENTITY EXTRACTION section */}
{selectedTicket.aiResponse && (
  <div style={styles.aiResponseSection}>
    <p style={{...styles.cardLabel, marginTop: '30px'}}>
      <Bot size={16}/> AI ASSISTANT RESPONSE
    </p>
    <div style={styles.aiResponseBox}>
      <p style={{
        fontSize: '14px',
        lineHeight: 1.6,
        color: '#166534',
        margin: 0,
        whiteSpace: 'pre-wrap'
      }}>
        {selectedTicket.aiResponse}
      </p>
      {selectedTicket.aiAnalysis && (
        <div style={styles.aiAnalysisBox}>
          <div style={{fontSize: '11px', color: '#64748b', fontWeight: '700'}}>
            AI Analysis Details:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginTop: '8px',
            fontSize: '10px'
          }}>
            <div>
              <span style={{color: '#94a3b8'}}>Issue Type:</span>
              <span style={{marginLeft: '5px', fontWeight: '600'}}>
                {selectedTicket.aiAnalysis.issueType || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{color: '#94a3b8'}}>Confidence:</span>
              <span style={{marginLeft: '5px', fontWeight: '600'}}>
                {selectedTicket.aiAnalysis.confidence ? Math.round(selectedTicket.aiAnalysis.confidence * 100) : 'N/A'}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
                    
                    {/* LIVE ACTIVITY FEED */}
                    <div style={styles.activityBox}>
                      <p style={{fontSize: '11px', fontWeight: '900', color: theme.primary, marginBottom: '15px'}}>
                        <History size={14}/> SYSTEM_ACTIVITY_LOG
                      </p>
                      <div style={styles.activityList}>
                        {activities.map(act => (
                          <div key={act.id} style={styles.activityLine(act.type)}>
                            <span style={{color: theme.primary, fontSize: '11px'}}>[{act.time}]</span> 
                            <span style={{marginLeft: '10px'}}>{act.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={styles.sideDiagnostics}>
                    <div style={styles.aiCard}>
                      <p style={{...styles.cardLabel, color: '#fff'}}><Zap size={16}/> AI_DIAGNOSTICS</p>
                      <div style={styles.confidenceGrid}>
                        <div style={styles.confidenceItem}>
                          <span style={{fontSize: '12px', opacity: 0.8}}>Category Confidence</span>
                          <h2 style={{color: theme.success, margin: '10px 0', fontSize: '32px'}}>
  {selectedTicket.category_confidence ? Math.round(selectedTicket.category_confidence * 100) : '0'}%
</h2>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill, 
                              width: `${selectedTicket.category_confidence ? selectedTicket.category_confidence * 100 : 0}%`
                            }} />
                          </div>
                        </div>
                        <div style={styles.confidenceItem}>
                          <span style={{fontSize: '12px', opacity: 0.8}}>Priority Confidence</span>
                          <h2 style={{color: '#f59e0b', margin: '10px 0', fontSize: '32px'}}>
  {selectedTicket.priority_confidence ? Math.round(selectedTicket.priority_confidence * 100) : '0'}%
</h2>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill, 
                             width: `${selectedTicket.priority_confidence ? selectedTicket.priority_confidence * 100 : 0}%`,
                              background: '#f59e0b'
                            }} />
                          </div>
                        </div>
                      </div>
                      
                      {/* AI SUGGESTIONS */}
                      {selectedTicket.status === 'open' && (
                        <div style={styles.aiSuggestion}>
                          <Lightbulb size={16} style={{flexShrink: 0}} />
                          <div style={{flex: 1}}>
                            <strong>AI Suggestion:</strong> Similar issues were resolved by restarting the affected service.
                            {selectedTicket.category && ` Check ${selectedTicket.category} service logs.`}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* AGENT LOAD WIDGET */}
                    <div style={styles.agentLoadWidget}>
                      <p style={{...styles.cardLabel, marginBottom: '20px'}}><UsersIcon size={16}/> AGENT AVAILABILITY</p>
                      {agentStats.length > 0 ? (
                        agentStats.slice(0, 3).map(agent => (
                          <div key={agent.name} style={styles.agentWidgetItem}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{fontSize: '12px', fontWeight: '600'}}>{agent.name}</span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: agent.efficiency > 70 ? theme.success : agent.efficiency > 40 ? '#f59e0b' : theme.danger
                              }}>
                                {agent.efficiency}%
                              </span>
                            </div>
                            <div style={styles.widgetLoadBar}>
                              <div style={{
                                ...styles.loadFill,
                                width: `${Math.min(100, agent.activeTickets * 12.5)}%`,
                                background: agent.isOverloaded ? theme.danger : theme.primary
                              }} />
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: theme.muted, marginTop: '5px'}}>
                              <span>Load: {agent.activeTickets}/8</span>
                              <span>Avg: {agent.avgResolutionHours}h</span>
                            </div>
                            {!selectedTicket.assignedTo && agent.activeTickets < 5 && (
  <button 
    onClick={() => {
      const ticketId = selectedTicket._id || selectedTicket.id;
      if (ticketId && ticketId !== 'N/A' && ticketId !== 'undefined') {
        assignToAgent(ticketId, agent.name);
      } else {
        alert('Cannot assign: No valid ticket ID found');
      }
    }}
    style={styles.assignQuickBtn}
  >
    Assign to {agent.name.split(' ')[0]}
  </button>
)}
                          </div>
                        ))
                      ) : (
                        <p style={{fontSize: '12px', color: theme.muted, textAlign: 'center', padding: '20px'}}>
                          No agent data available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={styles.emptyView}>
                <Monitor size={100} color="#f1f5f9" />
                <h2 style={{color: '#cbd5e1', fontWeight: '900'}}>SENTINEL_STANDBY</h2>
                <p style={{color: '#94a3b8'}}>Select an ingress node from the master log.</p>
                {tickets.length === 0 && (
                  <button onClick={() => fetchAllData()} style={styles.retryBtn}>
                    <RefreshCcw size={16} /> Fetch Data
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* REASSIGNMENT MODAL */}
{showReassignModal && selectedTicket && (
  <div style={styles.modalBackdrop}>
    <div style={styles.reassignModal}>
      <div style={styles.modalHeader}>
        <h3 style={{margin: 0}}>🔄 Reassign Ticket</h3>
        <button onClick={() => setShowReassignModal(false)} style={styles.closeBtn}>
          <X size={20}/>
        </button>
      </div>
      
      <div style={styles.modalContent}>
        <div style={styles.ticketInfo}>
          <h4>{selectedTicket.title}</h4>
          <div style={styles.ticketMeta}>
            <span style={pBadge(selectedTicket.priority)}>
              {selectedTicket.priority?.toUpperCase()}
            </span>
            <span>ID: #{selectedTicket._id?.slice(-6).toUpperCase() || selectedTicket.id?.slice(-6).toUpperCase() || 'N/A'}</span>
            <span>Current: {selectedTicket.assignedTo || 'Unassigned'}</span>
          </div>
        </div>
        
        <div style={styles.agentSelection}>
          <label style={styles.label}>Select Agent to Assign</label>
          
          {/* Top 3 Performers */}
          <div style={styles.topPerformers}>
            <p style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
              🏆 Top Performers (Recommended)
            </p>
            <div style={styles.performerGrid}>
              {allAgents
                .sort((a, b) => (b.resolvedTickets || 0) - (a.resolvedTickets || 0))
                .slice(0, 3)
                .map(agent => (
                  <div 
                    key={agent.email}
                    style={{
                      ...styles.performerCard,
                      border: selectedAgentToAssign === agent.email ? '2px solid #6366f1' : '1px solid #e2e8f0'
                    }}
                    onClick={() => setSelectedAgentToAssign(agent.email)}
                  >
                    <div style={styles.performerHeader}>
                      <span style={{fontWeight: '700', fontSize: '14px'}}>
                        {agent.name}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#10b981',
                        fontWeight: '700'
                      }}>
                        {agent.resolvedTickets || 0} resolved
                      </span>
                    </div>
                    <div style={styles.performerStats}>
                      <span style={styles.statItem}>
                        Active: {agent.activeTickets || 0}
                      </span>
                      <span style={styles.statItem}>
                        Dept: {agent.department || 'N/A'}
                      </span>
                    </div>
                    {selectedAgentToAssign === agent.email && (
                      <div style={styles.selectedBadge}>
                        ✓ Selected
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
          
          {/* All Agents Dropdown */}
          <div style={styles.allAgentsSection}>
            <p style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
              👥 All Available Agents
            </p>
            <select
              style={styles.agentSelect}
              value={selectedAgentToAssign}
              onChange={(e) => setSelectedAgentToAssign(e.target.value)}
            >
              <option value="">Select an agent...</option>
              {allAgents.map(agent => (
                <option key={agent.email} value={agent.email}>
                  {agent.name} • {agent.department || 'No Dept'} • Active: {agent.activeTickets || 0} • Resolved: {agent.resolvedTickets || 0}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reassignment History */}
          {selectedTicket.reassignmentHistory && selectedTicket.reassignmentHistory.length > 0 && (
            <div style={styles.reassignHistory}>
              <p style={{fontSize: '12px', color: '#64748b', marginBottom: '10px'}}>
                📜 Reassignment History
              </p>
              <div style={styles.historyList}>
                {selectedTicket.reassignmentHistory.map((history, index) => (
                  <div key={index} style={styles.historyItem}>
                    <span style={{fontSize: '11px', fontWeight: '600'}}>
                      {history.from} → {history.to}
                    </span>
                    <span style={{fontSize: '10px', color: '#94a3b8'}}>
                      by {history.by} • {new Date(history.at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={styles.modalActions}>
          <button 
            onClick={() => setShowReassignModal(false)}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              if (!selectedAgentToAssign) {
                addActivity('❌ Please select an agent to assign', 'error');
                return;
              }
              
              try {
                const token = localStorage.getItem('token');
                const ticketId = selectedTicket._id || selectedTicket.id;
                
                await axios.patch(`${API_BASE_URL}/tickets/${ticketId}/reassign`, {
                  assignedTo: selectedAgentToAssign,
                  reassignedBy: agent.email
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                // Update local state
                setTickets(prev => prev.map(t => 
                  (t._id === ticketId || t.id === ticketId) 
                    ? { ...t, assignedTo: selectedAgentToAssign } 
                    : t
                ));
                
                setSelectedTicket(prev => ({
                  ...prev,
                  assignedTo: selectedAgentToAssign
                }));
                
                addActivity(`✅ Ticket reassigned to ${selectedAgentToAssign}`, 'success');
                setShowReassignModal(false);
                setSelectedAgentToAssign('');
                
              } catch (err) {
                console.error('Reassignment failed:', err);
                addActivity('❌ Reassignment failed', 'error');
              }
            }}
            style={styles.confirmBtn}
            disabled={!selectedAgentToAssign}
          >
            Confirm Reassignment
          </button>
        </div>
      </div>
    </div>
  </div>
)}
  {/* DELETE CONFIRMATION MODAL */}
{showDeleteConfirmation && (
  <div style={styles.modalBackdrop}>
    <div style={styles.reassignModal}>
      <div style={styles.modalHeader}>
        <h3 style={{margin: 0, color: '#ef4444'}}>⚠️ Permanent Delete</h3>
        <button onClick={() => setShowDeleteConfirmation(false)} style={styles.closeBtn}>
          <X size={20}/>
        </button>
      </div>
      
      <div style={styles.modalContent}>
        <div style={{padding: '20px', background: '#fef2f2', borderRadius: '12px', marginBottom: '20px'}}>
          <AlertTriangle color="#ef4444" size={24} />
          <h4 style={{color: '#b91c1c', margin: '10px 0'}}>Warning: This action is irreversible!</h4>
          <p style={{color: '#7f1d1d', fontSize: '14px'}}>
            This will permanently delete archived tickets. This action cannot be undone.
            Make sure you have backups if needed.
          </p>
        </div>
        
        <div style={styles.modalActions}>
          <button 
            onClick={() => setShowDeleteConfirmation(false)}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
          <button 
            onClick={permanentDeleteArchived}
            style={{
              ...styles.confirmBtn,
              background: '#ef4444',
              ':hover': { background: '#dc2626' }
            }}
          >
            <Trash2 size={16} /> Permanently Delete
          </button>
        </div>
      </div>
    </div>
  </div>
)}  {/* ARCHIVE MANAGEMENT PANEL */}
{showArchivePanel && (
  <div style={styles.modalBackdrop}>
    <div style={styles.reassignModal}>
      <div style={styles.modalHeader}>
        <h3 style={{margin: 0}}><Archive size={20} /> Archive Management</h3>
        <button onClick={() => setShowArchivePanel(false)} style={styles.closeBtn}>
          <X size={20}/>
        </button>
      </div>
      
      <div style={styles.modalContent}>
        <div style={{marginBottom: '20px'}}>
          <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
            <button 
              onClick={fetchArchivedTickets}
              style={styles.retryBtn}
            >
              <RefreshCcw size={16} /> Refresh Archive
            </button>
            <button 
              onClick={() => {
                // Export archived tickets
                exportArchiveData();
              }}
              style={styles.aiConfirmBtn}
            >
              <Download size={16} /> Export Archive
            </button>
          </div>
          
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
            <select 
              style={styles.filterSelect}
              value={archiveFilter.daysOld}
              onChange={(e) => setArchiveFilter({...archiveFilter, daysOld: e.target.value})}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
              <option value="all">All time</option>
            </select>
            
            <select 
              style={styles.filterSelect}
              value={archiveFilter.category}
              onChange={(e) => setArchiveFilter({...archiveFilter, category: e.target.value})}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              style={styles.filterSelect}
              value={archiveFilter.status}
              onChange={(e) => setArchiveFilter({...archiveFilter, status: e.target.value})}
            >
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="ai_resolved">AI Resolved</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>
        
        <div style={styles.archiveList}>
          {archivedTickets.length === 0 ? (
            <div style={styles.emptyState}>
              <Archive size={40} color="#cbd5e1" />
              <p style={{color: '#94a3b8', fontSize: '14px', marginTop: '10px'}}>
                No archived tickets found
              </p>
            </div>
          ) : (
            archivedTickets.map(ticket => (
              <div key={ticket.id} style={styles.archiveItem}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <input 
                    type="checkbox"
                    checked={selectedArchivedTickets.includes(ticket.id)}
                    onChange={() => toggleTicketSelection(ticket.id)}
                  />
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: '700', fontSize: '14px'}}>
                      {ticket.title}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      fontSize: '11px',
                      color: '#64748b',
                      marginTop: '5px'
                    }}>
                      <span>ID: {ticket.originalTicketId?.slice(-6).toUpperCase() || 'N/A'}</span>
                      <span>•</span>
                      <span>{ticket.category}</span>
                      <span>•</span>
                      <span>Archived: {new Date(ticket.archivedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>By: {ticket.archivedBy}</span>
                    </div>
                    <div style={{fontSize: '12px', marginTop: '5px', color: '#475569'}}>
                      <strong>Reason:</strong> {ticket.archiveReason}
                    </div>
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: '8px'}}>
                  <button 
                    onClick={() => restoreTicket(ticket.id)}
                    style={styles.archiveActionBtn}
                    title="Restore ticket"
                  >
                    <ArchiveRestore size={14} />
                  </button>
                  {agent.role === 'admin' && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Permanently delete this archived ticket?')) {
                          permanentDeleteArchived(ticket.id);
                        }
                      }}
                      style={{...styles.archiveActionBtn, background: '#fef2f2', color: '#ef4444'}}
                      title="Permanently delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {selectedArchivedTickets.length > 0 && (
          <div style={{
            background: '#f0fdf4',
            padding: '15px',
            borderRadius: '12px',
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{fontWeight: '600', color: '#166534'}}>
              {selectedArchivedTickets.length} tickets selected
            </span>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={() => {
                  // Bulk restore
                  selectedArchivedTickets.forEach(id => restoreTicket(id));
                  setSelectedArchivedTickets([]);
                }}
                style={styles.aiConfirmBtn}
              >
                <ArchiveRestore size={14} /> Restore Selected
              </button>
              {agent.role === 'admin' && (
                <button 
                  onClick={() => {
                    if (window.confirm(`Permanently delete ${selectedArchivedTickets.length} archived tickets?`)) {
                      selectedArchivedTickets.forEach(id => permanentDeleteArchived(id));
                      setSelectedArchivedTickets([]);
                    }
                  }}
                  style={{
                    ...styles.aiReopenBtn,
                    background: '#ef4444',
                    ':hover': { background: '#dc2626' }
                  }}
                >
                  <Trash2 size={14} /> Delete Selected
                </button>
              )}
            </div>
          </div>
        )}
        
        <div style={styles.modalActions}>
          <button 
            onClick={() => setShowArchivePanel(false)}
            style={styles.cancelBtn}
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  </div>
)}  
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(8deg); } 75% { transform: rotate(-8deg); } }
        .shake { animation: shake 0.4s infinite; }
        .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-left: 10px; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); } }
        .resolve-btn { background: #10b981; color: #fff; border: none; padding: 18px 36px; border-radius: 16px; font-weight: 900; cursor: pointer; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3); transition: 0.3s; }
        .resolve-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.5); }
      `}</style>
    </div>
  );
};

// --- STYLES SYSTEM ---
const styles = {
  appContainer: { height: '100vh', width: '100vw', display: 'flex', background: '#fcfcfd', overflow: 'hidden', position: 'relative' },
  fixedGutter: { width: '80px', flexShrink: 0, height: '100%', background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '32px', gap: '20px', zIndex: 50 },
  fabMain: { width: '50px', height: '50px', borderRadius: '15px', background: '#6366f1', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fabSub: { width: '46px', height: '46px', borderRadius: '14px', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  sidebarOverlay: { position: 'fixed', top: 0, left: 0, height: '100%', width: '330px', background: '#fff', zIndex: 1000, transition: '0.4s ease', padding: '40px', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '25px 0 60px rgba(0,0,0,0.1)' },
  
  mainContentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  hudHeader: { height: '120px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 48px' },
  hudGrid: { display: 'flex', gap: '48px' },
  metricBlock: { p: { margin: 0, fontSize: '10px', fontWeight: '900', color: '#94a3b8' }, h3: { margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1.5px', display: 'flex', alignItems: 'center' } },
  
  hudRightSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  searchBar: { background: '#f1f5f9', padding: '12px 18px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', width: '320px', position: 'relative' },
  inputReset: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '100%' },
  clearSearchBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px', padding: '0 5px' },
  soundToggleBtn: { width: '40px', height: '40px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  notificationWrapper: { position: 'relative', width: '40px', height: '40px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' },
  notificationBadge: { position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: '#fff', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', border: '2px solid #fff' },
  notificationPanel: { position: 'absolute', top: '50px', right: '0', width: '320px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', zIndex: 1100, overflow: 'hidden' },
  notificationHeader: { padding: '12px', background: '#f8fafc', fontWeight: 800, fontSize: 12, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' },
  notificationItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' },
  notificationItemHover: { background: '#f8fafc' },
  notificationTitle: { fontSize: 12, fontWeight: 700, marginBottom: '5px' },
  // Add these to your styles object:

aiResolvedLabel: {
  background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  color: '#fff',
  padding: '16px 28px',
  borderRadius: '16px',
  fontWeight: '900',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '8px'
},

aiConfirmBtn: {
  background: '#10b981',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  ':hover': {
    background: '#059669',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  }
},

aiReopenBtn: {
  background: '#f59e0b',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s',
  ':hover': {
    background: '#d97706',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  }
},// Add these to your styles object:

aiResponseSection: {
  marginTop: '30px'
},

aiResponseBox: {
  background: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '12px',
  padding: '20px',
  marginTop: '10px'
},

aiAnalysisBox: {
  background: 'rgba(255,255,255,0.7)',
  borderRadius: '8px',
  padding: '12px',
  marginTop: '12px',
  border: '1px solid #dcfce7'
},
  
  spikeAlert: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', borderLeft: '4px solid #ef4444' },
  closeAlertBtn: { background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '24px', padding: '0 10px' },
  
  rootCauseBanner: { background: '#0f172a', color: '#fff', padding: '15px 48px', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' },
  
  advancedFiltersPanel: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', background: '#fff', borderRadius: '24px', padding: '30px', zIndex: 2000, boxShadow: '0 25px 50px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9' },
  filterHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  filterGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b' },
  // Add these to your styles object:

aiHandledBadge: {
  fontSize: '10px',
  fontWeight: '900',
  padding: '4px 8px',
  borderRadius: '100px',
  background: '#f0fdf4',
  color: '#10b981',
  border: '1px solid #10b981',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
},

ticketActions: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '15px'
},

actionButtons: {
  display: 'flex',
  gap: '8px'
},

archiveBtn: {
  background: '#f1f5f9',
  color: '#64748b',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '10px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.2s',
  ':hover': {
    background: '#e2e8f0'
  }
},

bulkArchiveBanner: {
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  padding: '15px 30px',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  margin: '0 48px 20px 48px',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
},

bulkArchiveBtn: {
  background: '#10b981',
  color: '#fff',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    background: '#059669',
    transform: 'translateY(-2px)'
  }
},

cancelBulkBtn: {
  background: 'rgba(255,255,255,0.2)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.3)',
  padding: '10px 20px',
  borderRadius: '8px',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    background: 'rgba(255,255,255,0.3)'
  }
},
  filterSelect: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', fontWeight: '600' },
  
  dualPaneContainer: { flex: 1, display: 'flex', overflow: 'hidden' },
  ingressStreamColumn: { width: '450px', flexShrink: 0, background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  streamHeader: { padding: '28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '12px', alignItems: 'center' },
  streamScrollArea: { flex: 1, overflowY: 'auto', padding: '20px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#cbd5e1' },
  ticketCard: (active) => ({ padding: '28px', marginBottom: '15px', borderRadius: '24px', background: active ? '#f8fafc' : 'none', cursor: 'pointer', border: active ? '2px solid #6366f1' : '2.5px solid transparent', position: 'relative' }),
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  ticketId: { fontSize: '12px', color: '#94a3b8', fontWeight: '800' },
  cardTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b', lineHeight: 1.3 },
  cardMeta: { marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b', flexWrap: 'wrap' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  vDivider: { width: '1px', height: '15px', background: '#e2e8f0' },
  refreshSelect: {
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '4px 8px',
  fontSize: '12px',
  fontWeight: '800',
  cursor: 'pointer'
},
playPauseBtn: {
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
},
  slaWarning: { position: 'absolute', bottom: '10px', right: '15px', background: '#fef2f2', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center' },
  
  displayHubColumn: { flex: 1, overflowY: 'auto', background: '#fafafa', minWidth: '600px' },
  incidentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', marginBottom: '40px' },
  giantTitle: { fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '-2px', lineHeight: 1.1 },
  incidentSubHeader: { display: 'flex', gap: '20px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' },
  assignedBadge: { background: '#eff6ff', color: '#6366f1', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600' },
    assignSelect: { 
    padding: '12px 20px', 
    borderRadius: '12px', 
    border: '2px solid #e2e8f0', 
    background: '#fff', 
    fontSize: '14px', 
    fontWeight: '600', 
    minWidth: '200px',
    cursor: 'pointer'
  },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' },
  manifestCard: { background: '#fff', padding: '40px', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardLabel: { fontSize: '11px', fontWeight: '900', color: '#6366f1', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' },
  manifestBody: { fontSize: '17px', lineHeight: 1.9, color: '#334155', whiteSpace: 'pre-wrap' },
  
  entitySection: { marginTop: '30px' },
  entityGrid: { display: 'grid', gap: '20px' },
  entityGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  entityLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b' },
  entityTags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  entityTag: { background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  
  sideDiagnostics: { display: 'flex', flexDirection: 'column', gap: '32px' },
  aiCard: { background: '#0f172a', padding: '35px', borderRadius: '32px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  confidenceGrid: { display: 'grid', gap: '30px' },
  confidenceItem: { marginBottom: '20px' },
  progressBar: { height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' },
  progressFill: { height: '100%', background: '#10b981', transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' },
  aiSuggestion: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', marginTop: '30px', display: 'flex', gap: '15px', alignItems: 'flex-start', fontSize: '14px', lineHeight: 1.5 },
  
  agentLoadWidget: { background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  agentWidgetItem: { background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '15px' },
  widgetLoadBar: { height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' },
  assignQuickBtn: { background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', marginTop: '10px', width: '100%' },
  
  solvedLabel: { background: '#dcfce7', color: '#166534', padding: '16px 28px', borderRadius: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalBody: { width: '500px', background: '#ef4444', padding: '48px', borderRadius: '32px', color: '#fff', boxShadow: '0 30px 60px rgba(239,68,68,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px' },
  ackBtn: { background: '#fff', color: '#ef4444', border: 'none', padding: '16px 32px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' },
  dismissBtn: { background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid #fff', padding: '16px 32px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' },
  navLink: (active) => ({ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: active ? '#f1f5f9' : 'none', textAlign: 'left', fontWeight: '800', color: active ? '#6366f1' : '#64748b', cursor: 'pointer', marginBottom: '8px' }),
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.1)', zIndex: 900 },
  agentInfo: { marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  logoutBtn: { color: '#ef4444', border: 'none', background: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: '10px' },
  label: { fontSize: '11px', fontWeight: '900', color: '#94a3b8', letterSpacing: '2px', marginBottom: '24px' },
  
  heatmapContainer: { marginBottom: '20px' },
  heatmapItem: { marginBottom: '15px' },
  heatmapBar: { height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', margin: '5px 0' },
  heatmapFill: { height: '100%', transition: 'width 0.5s ease' },
  
  leaderboardItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px', marginBottom: '8px' },
  
  agentLoadItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '10px' },
  loadBar: { height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', margin: '8px 0' },
  loadFill: { height: '100%', transition: 'width 0.5s ease' },
  
  activityBox: { marginTop: '40px', background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' },
  activityList: { maxHeight: '200px', overflowY: 'auto' },
  activityLine: (type) => ({ 
    fontSize: '13px', 
    marginBottom: '8px', 
    color: type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#475569',
    padding: '5px 0',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center'
  }),
  
  emptyView: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' },
  retryBtn: { background: '#6366f1', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', marginTop: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' },
  drawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },  // ===== NEW STYLES FOR REASSIGNMENT MODAL =====
  reassignModal: {
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    background: '#fff',
    borderRadius: '24px',
    padding: '30px',
    overflowY: 'auto'
  },
  
  modalContent: {
    marginTop: '20px'
  },
  
  ticketInfo: {
    background: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  
  ticketMeta: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginTop: '10px',
    fontSize: '12px',
    color: '#64748b',
    flexWrap: 'wrap'
  },
  
  agentSelection: {
    marginBottom: '30px'
  },
  
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#64748b',
    marginBottom: '10px',
    display: 'block'
  },
  
  topPerformers: {
    marginBottom: '20px'
  },
  
  performerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  
  performerCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  performerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  
  performerStats: {
    display: 'flex',
    gap: '10px',
    fontSize: '11px',
    color: '#94a3b8'
  },
  
  statItem: {
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  
  selectedBadge: {
    background: '#10b981',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '20px',
    marginTop: '10px',
    textAlign: 'center'
  },
  
  allAgentsSection: {
    marginTop: '20px'
  },
  
  agentSelect: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '14px',
    fontWeight: '600'
  },
  
  reassignHistory: {
    marginTop: '20px',
    padding: '15px',
    background: '#f8fafc',
    borderRadius: '12px'
  },
  
  historyList: {
    maxHeight: '150px',
    overflowY: 'auto'
  },
  
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e2e8f0'
  },
  
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '30px'
  },
  
  cancelBtn: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  archiveList: {
  maxHeight: '400px',
  overflowY: 'auto',
  marginBottom: '20px'
},

archiveItem: {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '15px',
  marginBottom: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  transition: 'all 0.2s',
  ':hover': {
    borderColor: '#6366f1',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)'
  }
},

archiveActionBtn: {
  background: '#f1f5f9',
  color: '#64748b',
  border: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    background: '#e2e8f0',
    transform: 'translateY(-2px)'
  }
},
  
  confirmBtn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    opacity: 1
  },
  
  reassignBtn: {
    background: '#f59e0b',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  },
    viewAllBtn: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  }
};

// Fix: Add missing closing curly brace for styles object and properly define pBadge
const pBadge = (p) => ({ 
  fontSize: '10px', 
  fontWeight: '900', 
  padding: '6px 12px', 
  borderRadius: '100px', 
  background: p === 'high' || p === 'critical' ? '#fef2f2' : '#eff6ff', 
  color: p === 'high' || p === 'critical' ? '#ef4444' : '#6366f1', 
  border: '1px solid currentColor' 
});

export default DevDashboard;