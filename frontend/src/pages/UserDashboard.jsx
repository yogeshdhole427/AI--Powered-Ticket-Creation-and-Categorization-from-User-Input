import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { 

  Settings, LogOut, Send, Activity, Clock, Cpu, 
  Search, Shield, Database, Zap, Monitor,
  MessageSquare, LifeBuoy, CheckCircle2, AlertCircle, 
  User, Smartphone, ShieldAlert, ChevronRight, HelpCircle,
  Sparkles, ListChecks, History, Bell, Search as SearchIcon,
  LayoutDashboard, Fingerprint, Star, ArrowUpRight, Bot, BookOpen, ExternalLink, Terminal,
  ThumbsUp, ThumbsDown, Star as StarIcon, MessageCircle, X, RefreshCw, Eye, TrendingUp,
  Download, CheckCircle, AlertTriangle, Info, Users, BarChart3, Target, Cloud, Server,
  Wifi, HardDrive, ShieldCheck, MessageSquarePlus, FileText, Video, Phone, Mail,PlusCircle,
  Calendar, Tag, Filter, SortAsc, AlertOctagon, Battery, BatteryCharging, Globe,
  Database as DatabaseIcon, Network, DownloadCloud, UploadCloud, ShieldOff, Lock,
  Key, EyeOff, BellRing, TrendingDown, PieChart, Cpu as CpuIcon, MemoryStick,
  Thermometer, Fan, HardDrive as HardDriveIcon, Router, RadioTower, Satellite,
  CloudRain, CloudSnow, CloudLightning, Sun, Moon, Coffee,
  BarChart, LineChart, PieChart as PieChartIcon, TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon, Rocket, Zap as ZapIcon, Target as TargetIcon,
  Mic, Headphones, Camera, Printer, Keyboard, Mouse, Server as ServerIcon,
  Cloud as CloudIcon, Wifi as WifiIcon, HardDrive as HardDriveIcon2,
  Smartphone as SmartphoneIcon, Tablet, Laptop, Monitor as MonitorIcon
} from 'lucide-react';

// Add this helper function to decode JWT token
const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const getStatusStyles = (ticket) => {
  if (!ticket) return { background: '#f1f5f9', color: '#64748b', label: 'UNKNOWN' };
  
  if (ticket.status === 'resolved' || ticket.status === 'closed') {
    return { background: '#f0fdf4', color: '#15803d', label: 'RESOLVED' };
  }

  const createdDate = new Date(ticket.created_at || ticket.createdAt || Date.now());
  const now = new Date();
  const diffInHours = (now - createdDate) / (1000 * 60 * 60);

  if (diffInHours < 3) {
    return { background: '#dcfce7', color: '#166534', label: 'NEW' };
  } else if (diffInHours >= 3 && diffInHours < 6) {
    return { background: '#fef3c7', color: '#92400e', label: 'PENDING' };
  } else {
    return { background: '#fee2e2', color: '#991b1b', label: 'OVERDUE' };
  }
};

// Get time-based greeting
const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: "Good Morning", icon: <Sun size={24} />, color: "#f59e0b" };
  if (hour < 17) return { greeting: "Good Afternoon", icon: <Sun size={24} />, color: "#f97316" };
  if (hour < 21) return { greeting: "Good Evening", icon: <Moon size={24} />, color: "#6366f1" };
  return { greeting: "Good Night", icon: <Moon size={24} />, color: "#1e293b" };
};

// Enhanced Feedback Modal Component with better error handling
const FeedbackModal = ({ ticketId, ticketTitle, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
  if (rating === 0) {
    setError('Please select a rating');
    return;
  }
  
  setSubmitting(true);
  setError('');
  
  try {
    // Call parent's onSubmit with just rating and comment
    await onSubmit({
      rating: rating,
      comment: comment.trim() // This can be empty string
    });
  } catch (err) {
    console.error('Error in feedback modal:', err);
    setError(err.message || 'Failed to submit feedback');
  } finally {
    setSubmitting(false);
  }
};

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Rate Your Experience</h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              Ticket: <strong>{ticketTitle}</strong>
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              ':hover': {
                background: '#f1f5f9'
              }
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          How was your support experience for this ticket?
        </p>
        
        {/* Star Rating */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => {
                  setRating(star);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '32px',
                  color: star <= rating ? '#f59e0b' : '#e2e8f0',
                  transition: 'all 0.2s',
                  transform: star <= rating ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                ★
              </button>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            {rating === 0 ? 'Select your rating' : 
             rating === 5 ? 'Excellent! ✨' :
             rating === 4 ? 'Good 👍' :
             rating === 3 ? 'Average 👌' :
             rating === 2 ? 'Below Average 👎' : 'Poor ❌'}
          </p>
        </div>
        
        {/* Comment */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError('');
            }}
            placeholder="Tell us about your experience... What went well? What could be improved?"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${error ? '#ef4444' : '#e2e8f0'}`,
              borderRadius: '12px',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border 0.3s',
              ':focus': {
                outline: 'none',
                borderColor: error ? '#ef4444' : '#6366f1',
                boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }
            }}
          />
        </div>
        
        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            background: rating === 0 ? '#94a3b8' : '#6366f1',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '16px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            ':hover': {
              background: rating === 0 ? '#94a3b8' : '#4f46e5',
              transform: submitting ? 'none' : 'translateY(-2px)'
            }
          }}
        >
          {submitting ? (
            <>
              <RefreshCw size={16} className="spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </div>
    </div>
  );
};

// Enhanced Notification System
const NotificationBell = ({ theme, notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.2s',
          ':hover': {
            background: '#f1f5f9'
          }
        }}
      >
        <Bell size={24} color={theme.text} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: '#ef4444',
            color: 'white',
            fontSize: '10px',
            fontWeight: '900',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowNotifications(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            width: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '8px',
            animation: 'slideDown 0.3s ease'
          }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Notifications</h4>
                  <p style={{ fontSize: '12px', color: theme.muted, margin: '4px 0 0 0' }}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        onMarkAllAsRead();
                        setShowNotifications(false);
                      }}
                      style={{
                        background: theme.primary,
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        ':hover': {
                          background: '#4f46e5'
                        }
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      ':hover': {
                        background: '#f1f5f9'
                      }
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Bell size={48} color={theme.muted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p style={{ color: theme.muted, marginTop: '12px', fontSize: '14px' }}>No notifications yet</p>
                <p style={{ color: theme.muted, fontSize: '12px', marginTop: '4px' }}>
                  You'll get notified when something happens
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id || notification.id}
                    style={{
                      padding: '16px',
                      borderBottom: `1px solid ${theme.border}`,
                      background: notification.read ? 'white' : '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      animation: 'fadeIn 0.3s ease'
                    }}
                    onClick={() => {
                      if (!notification.read) onMarkAsRead(notification._id || notification.id);
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = notification.read ? '#f8fafc' : '#e0f2fe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = notification.read ? 'white' : '#f0f9ff'}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{
                        background: notification.type === 'ticket_created' ? '#3b82f6' :
                                   notification.type === 'status_updated' ? notification.data?.status === 'resolved' ? '#10b981' : '#f59e0b' :
                                   notification.type === 'feedback_submitted' ? '#8b5cf6' : '#6366f6',
                        padding: '8px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {notification.type === 'status_updated' ? 
                          (notification.data?.status === 'resolved' ? <CheckCircle size={16} color="white" /> : <RefreshCw size={16} color="white" />) :
                         notification.type === 'ticket_created' ? <FileText size={16} color="white" /> :
                         notification.type === 'feedback_submitted' ? <StarIcon size={16} color="white" /> :
                         <Bell size={16} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: notification.read ? '500' : '700',
                          margin: '0 0 4px 0',
                          color: theme.text
                        }}>
                          {notification.message}
                        </p>
                        {notification.data?.ticketId && (
                          <p style={{ fontSize: '12px', color: theme.muted, margin: '0 0 4px 0' }}>
                            Ticket: #{notification.data.ticketId.toString().slice(-8).toUpperCase()}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', color: theme.muted, margin: 0 }}>
                          {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      {!notification.read && (
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: theme.primary,
                          flexShrink: 0,
                          marginTop: '8px',
                          animation: 'pulse 2s infinite'
                        }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Live Stats Component with Charts
// Update your LiveStats component to use the dynamic stats
const LiveStats = ({ theme, stats, loading }) => {
  // Update statItems to use dynamic values
  const statItems = [
    { 
      label: 'Online', 
      value: stats.supportTeamMembers || 0,
      color: '#6366f1', 
      icon: <Users size={16} />,
      description: 'Total members online'
    },
    { 
      label: 'Avg Response', 
      value: stats.avgResponseTime || 'Calculating...', 
      color: '#10b981', 
      icon: <Clock size={16} />,
      description: 'Average response time'
    },
    { 
      label: 'Satisfaction', 
      value: stats.satisfactionRate || 'N/A', 
      color: '#f59e0b', 
      icon: <StarIcon size={16} />,
      description: 'Based on recent feedback'
    },
    { 
      label: 'Today\'s Tickets', 
      value: stats.ticketsToday || 0, 
      color: '#3b82f6', 
      icon: <FileText size={16} />,
      description: 'Tickets created today',
      trend: stats.ticketsTrend
    },
    { 
      label: 'Resolved Today', 
      value: stats.resolvedToday || 0, 
      color: '#8b5cf6', 
      icon: <CheckCircle size={16} />,
      description: 'Tickets resolved today',
      trend: stats.resolvedTrend
    },
    { 
      label: 'Active Tickets', 
      value: stats.activeTickets || 0, 
      color: '#ef4444', 
      icon: <Activity size={16} />,
      description: 'Currently open tickets'
    }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `1px solid ${theme.border}`,
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h4 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Live Support Dashboard</h4>
          <p style={{ fontSize: '12px', color: theme.muted, margin: 0 }}>
            Real-time system performance metrics • Updated: {stats.lastUpdated ? 
              new Date(stats.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
              'Just now'
            }
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: loading ? '#64748b' : '#10b981',
          fontWeight: '600',
          background: loading ? '#f1f5f9' : '#f0fdf4',
          padding: '6px 12px',
          borderRadius: '20px',
          border: `1px solid ${loading ? '#e2e8f0' : '#a7f3d0'}`
        }}>
          {loading ? (
            <>
              <RefreshCw size={12} className="spin" />
              <span>LOADING...</span>
            </>
          ) : (
            <>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 2s infinite'
              }} />
              <span>LIVE • UPDATED NOW</span>
            </>
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px',
        marginBottom: '24px'
      }}>
        {statItems.map((stat, index) => (
          <div key={index} style={{ 
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '20px',
            border: `1px solid ${theme.border}`,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
            }
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{
                background: `${stat.color}15`,
                padding: '8px',
                borderRadius: '10px',
                color: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {stat.icon}
              </div>
              {stat.trend && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: stat.trend === 'up' ? '#10b981' : stat.trend === 'down' ? '#ef4444' : '#64748b',
                  background: stat.trend === 'up' ? '#d1fae5' : stat.trend === 'down' ? '#fee2e2' : '#f1f5f9',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {stat.trend === 'up' ? <TrendingUpIcon size={8} /> : 
                   stat.trend === 'down' ? <TrendingDown size={8} /> : '='}
                  {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                </div>
              )}
            </div>
            
            <div style={{ 
              fontSize: '28px', 
              fontWeight: '800', 
              color: stat.color,
              marginBottom: '4px'
            }}>
              {loading ? '...' : stat.value}
            </div>
            
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              color: theme.muted,
              letterSpacing: '0.5px',
              display: 'block',
              marginBottom: '4px'
            }}>
              {stat.label}
            </span>
            
            <p style={{ 
              fontSize: '10px', 
              color: theme.muted,
              margin: 0,
              opacity: 0.7
            }}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>
      
      {/* Enhanced Stats Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px',
        marginTop: '24px'
      }}>
        {/* Overall Resolution Rate Progress Bar */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: theme.muted }}>Overall Resolution Rate (30 days)</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>
              {stats.overallResolutionRate || 0}%
            </span>
          </div>
          <div style={{
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.overallResolutionRate || 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: '10px', color: theme.muted, marginTop: '4px' }}>
            {stats.resolvedTickets || 0} of {stats.totalTickets || 0} tickets resolved
          </div>
        </div>
        
        {/* Feedback Summary */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${theme.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: theme.muted }}>Customer Feedback (30 days)</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f59e0b' }}>
              {stats.feedbackCount || 0} ratings
            </span>
          </div>
          <div style={{ fontSize: '10px', color: theme.muted }}>
            {stats.satisfactionRate === 'N/A' ? 
              'No feedback yet' : 
              `Based on ${stats.feedbackCount || 0} recent ratings`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = ({ theme, onNewTicket, onViewHistory, onAIAssistant }) => {
  const actions = [
    {
      label: 'New Ticket',
      icon: <PlusCircle size={20} />,
      color: '#6366f1',
      onClick: onNewTicket,
      description: 'Create a new support request'
    },
    {
      label: 'View History',
      icon: <History size={20} />,
      color: '#8b5cf6',
      onClick: onViewHistory,
      description: 'Check your previous tickets'
    },
    {
  label: 'AI Assistant',
  icon: <Bot size={20} />,
  color: '#10b981',
  onClick: onAIAssistant,
  description: 'Get instant AI help'
},
    {
      label: 'Knowledge Base',
      icon: <BookOpen size={20} />,
      color: '#f59e0b',
      onClick: () => window.open('/knowledge-base', '_blank'),
      description: 'Browse helpful articles'
    }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `1px solid ${theme.border}`,
      padding: '24px',
      marginBottom: '32px'
    }}>
      <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Quick Actions</h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px'
      }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            style={{
              background: 'white',
              border: `1px solid ${theme.border}`,
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${action.color}20`,
                borderColor: action.color
              }
            }}
          >
            <div style={{
              background: `${action.color}15`,
              padding: '12px',
              borderRadius: '12px',
              color: action.color
            }}>
              {action.icon}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
                {action.label}
              </div>
              <div style={{ fontSize: '11px', color: theme.muted }}>
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ theme, tickets }) => {
  const recentTickets = tickets.slice(0, 3);
  // ========== AI RESPONSE MODAL COMPONENT ==========

// ==============================================

// Helper function for activity icons
  const getActivityIcon = (ticket) => {
    if (ticket.status === 'resolved') return <CheckCircle size={16} color="#10b981" />;
    if (ticket.status === 'in_progress') return <RefreshCw size={16} color="#f59e0b" />;
    return <Clock size={16} color="#64748b" />;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `1px solid ${theme.border}`,
      padding: '24px',
      marginBottom: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Recent Activity</h4>
        <span style={{ fontSize: '12px', color: theme.muted }}>Last 3 tickets</span>
      </div>
      
      {recentTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Activity size={32} color={theme.muted} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ color: theme.muted, fontSize: '14px' }}>No recent activity</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentTickets.map((ticket, index) => (
            <div
              key={ticket._id || ticket.id || `ticket-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                transition: 'all 0.2s',
                ':hover': {
                  background: '#f1f5f9',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <div style={{
                background: `${getStatusStyles(ticket).background}`,
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getActivityIcon(ticket)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '4px' }}>
                  {ticket.title}
                </div>
                <div style={{ fontSize: '12px', color: theme.muted }}>
                  {ticket.category} • {getStatusStyles(ticket).label}
                </div>
              </div>
              <div style={{ fontSize: '11px', color: theme.muted, textAlign: 'right' }}>
                <div>{new Date(ticket.created_at || ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div style={{ opacity: 0.7 }}>{new Date(ticket.created_at || ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const AIResponseModal = ({ response, onClose }) => {
  if (!response) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '32px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80%',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={24} />
              {response.type === "AI_RESPONSE" ? "AI Assistant Response" : 
               response.type === "NEEDS_CLARIFICATION" ? "More Information Needed" : 
               "Helpful Suggestions"}
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              Powered by Groq AI
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              ':hover': {
                background: '#f1f5f9'
              }
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        {response.type === "AI_RESPONSE" && (
          <>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#166534', margin: 0 }}>
                {response.response}
              </p>
            </div>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Your query has been handled by our AI assistant. If you need further assistance, 
              you can still create a regular support ticket.
            </p>
          </>
        )}
        
        {response.type === "NEEDS_CLARIFICATION" && (
          <>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#92400e', margin: 0 }}>
                {response.suggestion}
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
                Please provide:
              </h4>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {response.requiredDetails && response.requiredDetails.map((detail, index) => (
                  <li key={index} style={{ marginBottom: '8px', color: '#475569' }}>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                ':hover': {
                  background: '#4f46e5',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Update My Request
            </button>
          </>
        )}
        
        {response.type === "INSUFFICIENT_DETAILS" && (
          <>
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#991b1b', margin: 0 }}>
                {response.message}
              </p>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
                For better assistance, please include:
              </h4>
              <p style={{ color: '#475569', lineHeight: 1.6 }}>
                {response.suggestion}
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: '#6366f1',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                ':hover': {
                  background: '#4f46e5',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              I Understand
            </button>
          </>
        )}
      </div>
    </div>
  );
};
// Category Distribution Component
const CategoryDistribution = ({ theme, tickets }) => {
  const categories = {};
  
  tickets.forEach(ticket => {
    const category = ticket.category || 'General';
    categories[category] = (categories[category] || 0) + 1;
  });

  const categoryData = Object.entries(categories).map(([name, count]) => ({
    name,
    count,
    percentage: tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `1px solid ${theme.border}`,
      padding: '24px',
      marginBottom: '32px'
    }}>
      <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Category Distribution</h4>
      
      {categoryData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <PieChartIcon size={32} color={theme.muted} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ color: theme.muted, fontSize: '14px' }}>No data available</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {categoryData.map((category, index) => (
              <div key={category.name} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: theme.text }}>
                    {category.name}
                  </span>
                  <span style={{ fontSize: '12px', color: theme.muted }}>
                    {category.count} ({category.percentage}%)
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${category.percentage}%`,
                    height: '100%',
                    background: colors[index] || '#6366f1',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '8px',
            paddingTop: '16px',
            borderTop: `1px solid ${theme.border}`
          }}>
            {categoryData.map((category, index) => (
              <div key={category.name} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: colors[index] || '#6366f1',
                  borderRadius: '2px',
                  margin: '0 auto 4px'
                }} />
                <div style={{ fontSize: '10px', color: theme.muted, fontWeight: '600' }}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Enhanced Ticket Card
const EnhancedTicketCard = ({ ticket, theme, onViewDetails, onGiveFeedback }) => {
  const ticketId = ticket._id || ticket.id || 'N/A';
  const displayTicketId = ticketId.length > 8 ? `#${ticketId.slice(-8).toUpperCase()}` : `#${ticketId}`;
  const statusStyles = getStatusStyles(ticket.status);
  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: `1px solid ${theme.border}`,
      padding: '24px',
      marginBottom: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      position: 'relative',
      overflow: 'hidden',
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
      }
    }} onClick={() => onViewDetails(ticket)}>
      {/* Status indicator bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: statusStyles.color
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingLeft: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '800',
              background: statusStyles.background,
              color: statusStyles.color,
              display: 'inline-block',
              border: `1px solid ${statusStyles.color}33`
            }}>
              {statusStyles.label}
            </span>
            <span style={{ fontSize: '12px', color: theme.muted, fontWeight: '600' }}>
               #{ticket.ticketId || ticket.id?.slice(0, 6)}
            </span>
          </div>
          
          <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 12px 0', color: theme.text, paddingLeft: '12px' }}>
            {ticket.title || 'Untitled Ticket'}
          </h4>
          
          <p style={{ 
            fontSize: '14px', 
            color: theme.muted, 
            margin: 0,
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            paddingLeft: '12px'
          }}>
            {ticket.description || 'No description provided'}
          </p>
        </div>
        
        {ticket.status === 'resolved' && !ticket.feedbackSubmitted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGiveFeedback(ticket);
            }}
            style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              color: '#15803d',
              border: '1px solid #86efac',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              ':hover': {
                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
              }
            }}
          >
            <StarIcon size={14} />
            Give Feedback
          </button>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '16px',
        borderTop: `1px solid ${theme.border}`,
        paddingLeft: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} color={theme.muted} />
            <span style={{ fontSize: '12px', color: theme.muted, fontWeight: '500' }}>
              {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color={theme.muted} />
            <span style={{ fontSize: '12px', color: theme.muted, fontWeight: '500' }}>
              {ticket.category || 'General'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} color={theme.muted} />
            <span style={{ fontSize: '12px', color: theme.muted, fontWeight: '500' }}>
              {ticket.priority || 'Medium'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(ticket);
            }}
            style={{
              padding: '8px 16px',
              background: '#f8fafc',
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              ':hover': {
                background: theme.primary,
                color: 'white',
                borderColor: theme.primary
              }
            }}
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

// FAQ Component
const FAQSection = ({ theme }) => {
  const faqs = [
    {
      question: "How long does it take to get a response?",
      answer: "Average response time is under 30 minutes during business hours. Priority tickets are addressed immediately."
    },
    {
      question: "How are tickets prioritized?",
      answer: "Tickets are prioritized based on AI analysis of urgency, impact, and category. Critical issues get immediate attention."
    },
    {
      question: "Can I update my ticket after submission?",
      answer: "Yes, you can add comments to existing tickets. The support team will be notified of updates."
    },
    {
      question: "What information should I include in my ticket?",
      answer: "Include detailed description, error messages, steps to reproduce, and any relevant screenshots or logs."
    },
    {
      question: "How do I check my ticket status?",
      answer: "All your tickets are available in the 'Ticket History' tab with real-time status updates."
    }
  ];

  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div style={{
      background: 'white',
      borderRadius: '24px',
      border: `1px solid ${theme.border}`,
      padding: '32px',
      marginBottom: '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Frequently Asked Questions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'all 0.3s',
            ':hover': {
              borderColor: theme.primary,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)'
            }
          }}>
            <button
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                ':hover': {
                  background: '#f8fafc'
                }
              }}
            >
              <span style={{ fontWeight: '600', fontSize: '15px' }}>{faq.question}</span>
              <ChevronRight size={20} style={{ 
                transform: expandedIndex === index ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s',
                color: expandedIndex === index ? theme.primary : theme.muted
              }} />
            </button>
            {expandedIndex === index && (
              <div style={{ 
                padding: '16px', 
                paddingTop: 0,
                borderTop: `1px solid ${theme.border}`,
                color: theme.muted,
                fontSize: '14px',
                lineHeight: 1.6,
                animation: 'slideDown 0.3s ease'
              }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
// Profile Component
// Profile Component - FIXED VERSION
const ProfileSection = ({ theme, userData, tickets }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: '',
    department: '',
    position: '',
    notifications: true,
    newsletter: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState('personal');
  
  // Add userStats as a state variable
  const [userStats, setUserStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 'Calculating...',
    satisfactionRating: 0
  });

  // 🔥 ADD THE FETCH PROFILE DATA USEEFFECT HERE 🔥
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!userData?.id) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`${API_BASE_URL}/auth/profile/${userData.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data?.user) {
          const user = response.data.user;
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            department: user.department || '',
            position: user.position || '',
            notifications: user.notificationsEnabled !== false,
            newsletter: user.newsletterSubscribed || false
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // Use existing userData if API fails
        if (userData) {
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: '',
            department: '',
            position: '',
            notifications: true,
            newsletter: false
          });
        }
      }
    };
    
    if (userData?.id) {
      fetchProfileData();
    }
  }, [userData?.id]);

  // Calculate user stats and update with useEffect
  useEffect(() => {
    // Calculate basic stats
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const satisfactionRating = tickets.length > 0 ? 
      Math.round((tickets.filter(t => t.feedbackRating >= 4).length / tickets.length) * 100) : 0;
    
    // Set initial stats
    const initialStats = {
      totalTickets,
      resolvedTickets,
      avgResponseTime: 'Calculating...',
      satisfactionRating
    };
    
    setUserStats(initialStats);
    
    // Calculate actual average response time for user's resolved tickets
    const resolvedUserTickets = tickets.filter(t => 
      t.status === 'resolved' && t.created_at && t.updatedAt
    );
    
    if (resolvedUserTickets.length > 0) {
      let totalMinutes = 0;
      resolvedUserTickets.forEach(ticket => {
        const created = new Date(ticket.created_at);
        const resolved = new Date(ticket.updatedAt);
        const diffMinutes = Math.floor((resolved - created) / (1000 * 60));
        if (diffMinutes > 0) {
          totalMinutes += diffMinutes;
        }
      });
      
      const avgMinutes = Math.round(totalMinutes / resolvedUserTickets.length);
      setUserStats(prev => ({
        ...prev,
        avgResponseTime: avgMinutes < 60 ? 
          `${avgMinutes}m` : 
          `${Math.floor(avgMinutes/60)}h ${avgMinutes%60}m`
      }));
    }
  }, [tickets]);

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        window.location.href = '/auth';
        return;
      }
      
      const decoded = decodeToken(token);
      if (!decoded || !decoded.id) {
        alert('Invalid session. Please login again.');
        window.location.href = '/auth';
        return;
      }
      
      const response = await axios.put(`${API_BASE_URL}/auth/profile/${decoded.id}`, {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
        notifications: formData.notifications,
        newsletter: formData.newsletter
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsEditing(false);
      alert('Profile updated successfully!');
      
      // Update user data in parent
      if (response.data.user) {
        // You might want to update the userData in parent component
        // This depends on how you handle global state
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (!passwordData.currentPassword) {
      alert('Please enter your current password');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        window.location.href = '/auth';
        return;
      }
      
      const decoded = decodeToken(token);
      if (!decoded || !decoded.id) {
        alert('Invalid session. Please login again.');
        window.location.href = '/auth';
        return;
      }
      
      await axios.put(`${API_BASE_URL}/auth/change-password`, {
        userId: decoded.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login again');
        window.location.href = '/auth';
        return;
      }
      
      const decoded = decodeToken(token);
      if (!decoded || !decoded.id) {
        alert('Invalid session. Please login again.');
        window.location.href = '/auth';
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/user/export-data`, {
        params: { userId: decoded.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create and download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${userData?.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(error.response?.data?.error || 'Failed to export data');
    }
  };

  // Rest of your ProfileSection component remains the same...
  // ... (all the JSX code stays exactly as you have it)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=6366f1&color=fff&bold=true&size=256`}
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '24px',
                border: `4px solid ${theme.primary}33`
              }}
              alt="Profile"
            />
            {isEditing && (
              <button
                onClick={() => {/* Implement photo upload */}}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: theme.primary,
                  color: 'white',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#4f46e5',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <Camera size={18} />
              </button>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  border: `2px solid ${theme.border}`,
                  borderRadius: '12px',
                  padding: '12px',
                  width: '100%',
                  marginBottom: '8px'
                }}
              />
            ) : (
              <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px 0' }}>{formData.name}</h2>
            )}
            <p style={{ fontSize: '16px', color: theme.muted, margin: '0 0 16px 0' }}>
              {userData?.role?.toUpperCase() || 'USER'}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {isEditing ? (
                <button
                  onClick={handleSaveProfile}
                  style={{
                    background: theme.primary,
                    color: 'white',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: '#4f46e5',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'white',
                    color: theme.primary,
                    border: `2px solid ${theme.primary}`,
                    padding: '10px 24px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: theme.primary,
                      color: 'white',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleExportData}
                style={{
                  background: 'white',
                  color: theme.text,
                  border: `2px solid ${theme.border}`,
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#f8fafc',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px',
          marginTop: '24px'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.primary }}>
              {userStats.totalTickets}
            </div>
            <div style={{ fontSize: '12px', color: theme.muted, fontWeight: '600' }}>
              Total Tickets
            </div>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.success }}>
              {userStats.resolvedTickets}
            </div>
            <div style={{ fontSize: '12px', color: theme.muted, fontWeight: '600' }}>
              Resolved
            </div>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.warning }}>
              {userStats.avgResponseTime}
            </div>
            <div style={{ fontSize: '12px', color: theme.muted, fontWeight: '600' }}>
              Avg Response
            </div>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: '20px',
            borderRadius: '16px',
            border: `1px solid ${theme.border}`,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: theme.info }}>
              {userStats.satisfactionRating}%
            </div>
            <div style={{ fontSize: '12px', color: theme.muted, fontWeight: '600' }}>
              Satisfaction
            </div>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: `1px solid ${theme.border}`,
          background: '#f8fafc'
        }}>
          <button
            onClick={() => setActiveSettingsTab('personal')}
            style={{
              flex: 1,
              padding: '20px',
              background: activeSettingsTab === 'personal' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeSettingsTab === 'personal' ? `3px solid ${theme.primary}` : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              color: activeSettingsTab === 'personal' ? theme.primary : theme.muted,
              transition: 'all 0.2s',
              ':hover': {
                background: activeSettingsTab === 'personal' ? 'white' : '#f1f5f9'
              }
            }}
          >
            Personal Info
          </button>
          <button
            onClick={() => setActiveSettingsTab('security')}
            style={{
              flex: 1,
              padding: '20px',
              background: activeSettingsTab === 'security' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeSettingsTab === 'security' ? `3px solid ${theme.primary}` : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              color: activeSettingsTab === 'security' ? theme.primary : theme.muted,
              transition: 'all 0.2s',
              ':hover': {
                background: activeSettingsTab === 'security' ? 'white' : '#f1f5f9'
              }
            }}
          >
            Security
          </button>
          <button
            onClick={() => setActiveSettingsTab('notifications')}
            style={{
              flex: 1,
              padding: '20px',
              background: activeSettingsTab === 'notifications' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeSettingsTab === 'notifications' ? `3px solid ${theme.primary}` : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              color: activeSettingsTab === 'notifications' ? theme.primary : theme.muted,
              transition: 'all 0.2s',
              ':hover': {
                background: activeSettingsTab === 'notifications' ? 'white' : '#f1f5f9'
              }
            }}
          >
            Notifications
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          {activeSettingsTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Full Name
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      background: isEditing ? 'white' : '#f8fafc',
                      color: theme.text
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Email
                  </label>
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      background: isEditing ? 'white' : '#f8fafc',
                      color: theme.text
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Phone Number
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      background: isEditing ? 'white' : '#f8fafc',
                      color: theme.text
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Department
                  </label>
                  <input
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    disabled={!isEditing}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px',
                      background: isEditing ? 'white' : '#f8fafc',
                      color: theme.text
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Bio
                </label>
                <textarea
                  placeholder="Tell us a bit about yourself..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    minHeight: '120px',
                    resize: 'vertical',
                    background: isEditing ? 'white' : '#f8fafc',
                    color: theme.text
                  }}
                  disabled={!isEditing}
                />
              </div>
            </div>
          )}

          {activeSettingsTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px'
                  }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${theme.border}`,
                      borderRadius: '12px'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleChangePassword}
                  style={{
                    background: theme.primary,
                    color: 'white',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: '#4f46e5',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Change Password
                </button>
              </div>
              
              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: `1px solid ${theme.border}`
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                  Security Status
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Two-Factor Authentication</span>
                    <button
                      style={{
                        background: '#f1f5f9',
                        color: theme.text,
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Enable
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Login Sessions</span>
                    <button
                      onClick={() => {/* Implement session management */}}
                      style={{
                        background: '#f1f5f9',
                        color: theme.text,
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Manage Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                  Notification Preferences
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.notifications}
                      onChange={(e) => setFormData({...formData, notifications: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>Ticket Updates</div>
                      <div style={{ fontSize: '14px', color: theme.muted }}>
                        Receive notifications when your tickets are updated
                      </div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.newsletter}
                      onChange={(e) => setFormData({...formData, newsletter: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600' }}>Newsletter</div>
                      <div style={{ fontSize: '14px', color: theme.muted }}>
                        Receive monthly updates and tips
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                  Notification Channels
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Email Notifications</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: theme.success }}>Active</span>
                      <div style={{ 
                        width: '40px', 
                        height: '20px', 
                        background: theme.success, 
                        borderRadius: '10px',
                        position: 'relative'
                      }}>
                        <div style={{ 
                          position: 'absolute',
                          right: '2px',
                          top: '2px',
                          width: '16px',
                          height: '16px',
                          background: 'white',
                          borderRadius: '50%'
                        }} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Browser Notifications</span>
                    <button
                      style={{
                        background: '#f1f5f9',
                        color: theme.text,
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        border: `1px solid ${theme.border}`,
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
          Recent Activity
        </h4>
        {tickets.slice(0, 5).map((ticket, index) => (
          <div
            key={ticket._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderBottom: index < 4 ? `1px solid ${theme.border}` : 'none',
              transition: 'all 0.2s',
              ':hover': {
                background: '#f8fafc',
                borderRadius: '12px'
              }
            }}
          >
            <div style={{
              background: getStatusStyles(ticket).background,
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getActivityIcon(ticket)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>
                {ticket.title}
              </div>
              <div style={{ fontSize: '12px', color: theme.muted }}>
                {ticket.category} • {getStatusStyles(ticket).label}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: theme.muted }}>
              {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function for activity icons
const getActivityIcon = (ticket) => {
  if (ticket.status === 'resolved') return <CheckCircle size={16} color="#10b981" />;
  if (ticket.status === 'in_progress') return <RefreshCw size={16} color="#f59e0b" />;
  return <Clock size={16} color="#64748b" />;
};
// UserDashboard Main Component
const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('desk');
  const [issue, setIssue] = useState({ title: '', description: '' });
  const [tickets, setTickets] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([`[${new Date().toLocaleTimeString()}] System Initialized...`]);
  const [notifications, setNotifications] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showAIResponse, setShowAIResponse] = useState(false);
const [aiResponse, setAiResponse] = useState(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  // ========== GROQ AI INTEGRATION ==========
  // =========================================
  const [greeting, setGreeting] = useState(getTimeGreeting());
  const [aiStatus, setAiStatus] = useState('checking');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [userTicketsCount, setUserTicketsCount] = useState({ total: 0, resolved: 0, pending: 0 });
  const [stats, setStats] = useState({ activeAgents: 0, ticketsToday: 0, resolvedToday: 0 });

  // Initialize Socket.io connection
  // Initialize Socket.io connection
// In your UserDashboard.jsx component, update the Socket.io connection:
useEffect(() => {
  // Determine the WebSocket URL based on environment
  const WS_BASE_URL = API_BASE_URL.replace('/api', ''); // Remove /api for WebSocket
  
  const newSocket = io(WS_BASE_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });
  
  // ... rest of your socket setup
  
  setSocket(newSocket);
  
  return () => {
    newSocket.disconnect();
  };
}, []);// Keep empty dependency array

  // Listen for real-time updates
  // UserDashboard.jsx
useEffect(() => {
  if (!socket || !userData) return;

  // Ensure the role is sent with a valid email
  socket.emit('join_user_room', { 
    email: userData.email || 'user@example.com', 
    role: userData.role || 'user'
  });

  socket.on('update_online_counts', (data) => {
    setStats(prev => ({ ...prev, activeAgents: data.agentsOnline }));
  });

  return () => socket.off('update_online_counts');
}, [socket, userData]);
  // Fetch user data from backend
  // Update the fetchUserData function in your UserDashboard component
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth';
      return null;
    }
    
    const decoded = decodeToken(token);
    
    if (!decoded || !decoded.id) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
      return null;
    }
    
    console.log('Fetching user data for ID:', decoded.id);
    
    // Use the correct endpoint for dashboard
    const response = await axios.get(`${API_BASE_URL}/auth/user/${decoded.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('User API Response:', response.data);
    
    if (response.data) {
        const user = response.data;

      const userDataObj = {
        id: user._id || decoded.id,
        name: user.name || 'User',
        email: user.email || 'user@example.com',
        role: user.role || 'user'
      };
      
      console.log('Setting userData to:', userDataObj);
      setUserData(userDataObj);
      return user;
    }
  } catch (error) {
    console.error('Error in fetchUserData:', error);
    return null;
  }
};
// Add this inside your UserDashboard component:
useEffect(() => {
  console.log('Current userData:', userData);
}, [userData]);

  // Update greeting based on time
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getTimeGreeting());
    };

    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check AI service status
  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
        if (response.data.ai_service?.status === 'healthy') {
          setAiStatus('connected');
          addLog("AI Service: Connected and Ready");
        } else {
          setAiStatus('disconnected');
          addLog("AI Service: Disconnected - Using fallback");
        }
      } catch (error) {
        setAiStatus('error');
        addLog("AI Service: Connection Error");
      }
    };

    checkAIStatus();
    const aiInterval = setInterval(checkAIStatus, 30000);
    return () => clearInterval(aiInterval);
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const decoded = decodeToken(token);
      if (!decoded || !decoded.id) {
        console.error('Invalid token');
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: { userId: decoded.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };
  const getStatusStyles = (ticket) => {
    if (!ticket) return { background: '#f1f5f9', color: '#64748b', label: 'UNKNOWN' };
    
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return { background: '#f0fdf4', color: '#15803d', label: 'RESOLVED' };
    }

    const createdDate = new Date(ticket.created_at || ticket.createdAt || Date.now());
    const now = new Date();
    const diffInHours = (now - createdDate) / (1000 * 60 * 60);

    if (diffInHours < 3) {
      return { background: '#dcfce7', color: '#166534', label: 'NEW' };
    } else if (diffInHours >= 3 && diffInHours < 6) {
      return { background: '#fef3c7', color: '#92400e', label: 'PENDING' };
    } else {
      return { background: '#fee2e2', color: '#991b1b', label: 'OVERDUE' };
    }
  };
  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      
      if (!token || !decoded || !decoded.id) {
        console.error('No valid session');
        return;
      }
      
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        userId: decoded.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Optimistically update UI even if API fails
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      
      if (!token || !decoded || !decoded.id) {
        console.error('No valid session');
        return;
      }
      
      // Get all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Update each notification
      for (const notification of unreadNotifications) {
        await axios.put(`${API_BASE_URL}/notifications/${notification._id}/read`, {
          userId: decoded.id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Still update UI optimistically
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
      
      const decoded = decodeToken(token);
      if (!decoded) {
        window.location.href = '/auth';
        return;
      }

      const ticketsRes = await axios.get(`${API_BASE_URL}/tickets`, {
        params: { userId: decoded.id },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fetchedTickets = ticketsRes.data || [];
      setTickets(fetchedTickets);
      
      // Calculate user ticket stats
      const total = fetchedTickets.length;
      const resolved = fetchedTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      const pending = fetchedTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;
      
      setUserTicketsCount({ total, resolved, pending });
      addLog("Ticket history synchronized.");
      
    } catch (err) {
      addLog("Database Link Failure: Retrying...");
      console.error("Connection failed:", err);
    }
  };

  // Fetch live stats
  const fetchLiveStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/stats/live`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/auth';
        return;
      }
      
      try {
        // Fetch user data first
        const user = await fetchUserData();
        if (!user) {
          addLog("Unable to load user profile.");
          return;
        }
        
        // Then fetch all data in parallel
        await Promise.all([
          fetchTickets(),
          fetchNotifications(),
          fetchLiveStats()
        ]);
        
      } catch (error) {
        console.error('Error initializing data:', error);
        addLog("Initialization failed: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    
    // Set up polling intervals
    const notificationInterval = setInterval(fetchNotifications, 30000);
    const ticketInterval = setInterval(fetchTickets, 60000);
    const statsInterval = setInterval(fetchLiveStats, 60000);
    
    return () => {
      clearInterval(notificationInterval);
      clearInterval(ticketInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  const submitRequest = async (e) => {
  e.preventDefault();
  
  // ========== GROQ AI ENHANCEMENT ==========
  // Check minimum length
  if (issue.description.length < 20) {
    setAiResponse({
      message: "Description too short",
      suggestion: "Please provide more details (at least 20 characters) for better assistance. Include specific error messages, steps to reproduce, and what you were trying to accomplish.",
      type: "INSUFFICIENT_DETAILS"
    });
    setShowAIResponse(true);
    return;
  }
  // ==========================================
  
  setIsProcessing(true);
  setLastResult(null);
  setAiResponse(null);
  addLog("Initializing Secure Handshake...");

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/auth';
      return;
    }
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.id) {
      alert('Invalid session. Please login again.');
      window.location.href = '/auth';
      return;
    }

    addLog("Analyzing request with AI...");

    const res = await axios.post(`${API_BASE_URL}/tickets/generate`, {
      title: issue.title || 'Support Request',
      description: issue.description,
      userId: decoded.id
    }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30000
    });

    // ========== GROQ AI HANDLING ==========
    // Check if AI handled it directly
    if (res.data.type === "AI_RESPONSE") {
      setAiResponse({
        ticket: res.data.ticket,
        response: res.data.aiResponse,
        type: "AI_RESPONSE"
      });
      setShowAIResponse(true);
      addLog("AI Assistant handled the query directly");
      setIsProcessing(false);
      return;
    }
    
    // Check if needs clarification
    if (res.data.type === "NEEDS_CLARIFICATION") {
      setAiResponse({
        suggestion: res.data.aiSuggestion,
        requiredDetails: res.data.requiredDetails,
        type: "NEEDS_CLARIFICATION"
      });
      setShowAIResponse(true);
      setIsProcessing(false);
      return;
    }
    // =======================================

    // Normal ticket creation
    addLog("SUCCESS: Prediction Synchronized.");
    setLastResult(res.data);
    setTickets(prev => [res.data, ...prev]);
    setIssue({ title: '', description: '' });
    setIsProcessing(false);
    
    alert('Ticket created successfully with AI classification!');
  } catch (err) {
    console.error("Ticket creation error:", err.response?.data || err.message);
    
    // ========== GROQ AI ERROR HANDLING ==========
    // Check for insufficient details error
    if (err.response?.data?.type === "INSUFFICIENT_DETAILS") {
      setAiResponse({
        message: err.response.data.message,
        suggestion: err.response.data.suggestion,
        type: "INSUFFICIENT_DETAILS"
      });
      setShowAIResponse(true);
      setIsProcessing(false);
      return;
    }
    // ============================================
    
    addLog("CRITICAL_PIPELINE_ERROR: " + (err.response?.data?.error || err.message));
    setIsProcessing(false);
    
    alert(`Failed to create ticket: ${err.response?.data?.error || err.message}`);
  }
};

  const handleGiveFeedback = (ticket) => {
    if (!ticket) return;
    
    // Check if ticket is resolved before allowing feedback
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      alert('You can only provide feedback for resolved tickets.');
      return;
    }
    
    if (ticket.feedbackSubmitted) {
      alert('You have already submitted feedback for this ticket.');
      return;
    }
    
    setSelectedTicket(ticket);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
  // Get the ticket ID from either _id or id property
  const ticketId = selectedTicket?._id || selectedTicket?.id;
  
  if (!ticketId || !feedbackData?.rating) {
    console.warn("Feedback blocked: Required data not ready");
    console.log("Selected Ticket ID:", selectedTicket?._id || selectedTicket?.id);
    console.log("Selected Ticket:", selectedTicket);
    console.log("Feedback Data:", feedbackData);
    console.log("User Data:", userData);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again');
      window.location.href = '/auth';
      return;
    }

    // Get user ID from token
    const decoded = decodeToken(token);
    if (!decoded || !decoded.id) {
      alert('Invalid session. Please login again.');
      window.location.href = '/auth';
      return;
    }

    // Prepare payload
    const payload = {
      ticketId: ticketId, // Use the correct ticket ID
      rating: feedbackData.rating,
      comment: feedbackData.comment || "", // Comment is optional
      userId: decoded.id
    };

    console.log("Submitting feedback payload:", payload);

    const response = await axios.post(
      `${API_BASE_URL}/feedback`,
      payload,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("Feedback response:", response.data);

    // Update ticket in local state - use the correct ticket ID
    setTickets(prev =>
      prev.map(t => {
        const currentTicketId = t._id || t.id;
        return currentTicketId === ticketId
          ? {
              ...t,
              feedbackSubmitted: true,
              feedbackRating: feedbackData.rating,
              feedbackComment: feedbackData.comment || "",
              feedbackDate: new Date().toISOString()
            }
          : t;
      })
    );

    setShowFeedbackModal(false);
    setSelectedTicket(null);
    addLog("Feedback submitted successfully!");

    // Show success message
    setTimeout(() => {
      alert('Thank you for your feedback! Your input helps us improve our service.');
    }, 100);

  } catch (error) {
    console.error('Error submitting feedback:', error.response?.data || error);

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Failed to submit feedback. Please try again.';

    console.error('Full error:', error);
    
    if (error.response?.status === 403) {
      alert('You are not authorized to provide feedback for this ticket.');
    } else if (error.response?.status === 400) {
      alert(errorMessage);
    } else {
      alert('Server error. Please try again later.');
    }

    // Check if feedback already submitted
    if (errorMessage.includes('already submitted')) {
      setTickets(prev =>
        prev.map(t => {
          const currentTicketId = t._id || t.id;
          return currentTicketId === ticketId
            ? { ...t, feedbackSubmitted: true }
            : t;
        })
      );
    }
  }
};


  const handleViewTicketDetails = (ticket) => {
    if (!ticket) return;
    setSelectedTicketDetails(ticket);
    setShowTicketDetails(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const theme = {
    primary: '#6366f1', 
    secondary: '#8b5cf6', 
    accent: '#10b981',
    bg: '#fcfcfd', 
    sidebar: '#ffffff', 
    text: '#0f172a', 
    muted: '#64748b',
    glass: 'rgba(255, 255, 255, 0.7)', 
    border: '#f1f5f9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const styles = {
    container: { 
      minHeight: '100vh',
      display: 'flex', 
      background: theme.bg, 
      color: theme.text, 
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    },
    sidebar: { 
      width: '280px', 
      background: theme.sidebar, 
      borderRight: `1px solid ${theme.border}`, 
      padding: '32px 24px', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 100
    },
    main: { 
      flex: 1, 
      padding: '40px 60px', 
      overflowY: 'auto',
      background: '#f8fafc',
      minHeight: '100vh'
    },
    navItem: (active) => ({
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      padding: '14px 18px', 
      borderRadius: '14px', 
      cursor: 'pointer', 
      marginBottom: '8px',
      background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : 'transparent', 
      color: active ? '#fff' : theme.muted, 
      border: 'none', 
      width: '100%', 
      textAlign: 'left', 
      fontWeight: '600', 
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontSize: '14px',
      ':hover': {
        background: active ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : '#f8fafc',
        transform: active ? 'none' : 'translateX(4px)'
      }
    }),
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '40px' 
    },
    card: { 
      background: '#fff', 
      borderRadius: '24px', 
      border: `1px solid ${theme.border}`, 
      padding: '32px', 
      boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' 
    },
    input: { 
      width: '100%', 
      background: '#f8fafc', 
      border: `2px solid #f1f5f9`, 
      borderRadius: '16px', 
      padding: '18px', 
      color: theme.text, 
      fontSize: '15px', 
      marginBottom: '20px', 
      outline: 'none',
      transition: 'all 0.3s',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      ':focus': {
        borderColor: theme.primary,
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
      },
      '::placeholder': {
        color: '#94a3b8'
      }
    },
    console: { 
      background: '#0f172a', 
      borderRadius: '20px', 
      padding: '20px', 
      marginTop: '20px', 
      fontFamily: 'monospace', 
      fontSize: '12px', 
      color: '#4ade80', 
      border: '1px solid #1e293b',
      maxHeight: '300px',
      overflowY: 'auto',
      boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.5)'
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.bg,
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: `4px solid ${theme.border}`,
          borderTop: `4px solid ${theme.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: theme.muted, fontWeight: '600' }}>Loading your dashboard...</p>
        <p style={{ color: theme.muted, fontSize: '12px' }}>Setting up your personalized experience</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
            padding: '10px', 
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Fingerprint size={28} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Nexus AI
            </span>
            <div style={{ fontSize: '10px', color: theme.muted, fontWeight: '600', letterSpacing: '0.5px' }}>
              ENTERPRISE SUITE
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
  <button style={styles.navItem(activeTab === 'desk')} onClick={() => setActiveTab('desk')}>
    <LayoutDashboard size={20}/> Dashboard
  </button>
  <button style={styles.navItem(activeTab === 'history')} onClick={() => setActiveTab('history')}>
    <History size={20}/> Ticket History
  </button>
  <button style={styles.navItem(activeTab === 'profile')} onClick={() => setActiveTab('profile')}>
    <User size={20}/> Profile
  </button>
  <button style={styles.navItem(activeTab === 'faq')} onClick={() => setActiveTab('faq')}>
    <HelpCircle size={20}/> FAQ
  </button>
</div>

        <div style={{ 
  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
  padding: '16px', 
  borderRadius: '16px', 
  marginTop: '24px',
  border: `1px solid ${theme.border}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
}}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
    <img 
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366f1&color=fff&bold=true&size=128`} 
      style={{ width: '48px', height: '48px', borderRadius: '12px', border: `2px solid ${theme.primary}33` }} 
      alt="avatar" 
    />
    <div style={{ flex: 1 }}>
  <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>{userData?.name || 'User'}</p>
  <p style={{ fontSize: '11px', color: theme.muted, margin: 0 }}>
    USER
  </p>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
    <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
      Active
    </div>
    <div style={{ fontSize: '10px', color: theme.muted, fontWeight: '500' }}>
      {userTicketsCount.total} tickets
    </div>
  </div>
</div>
  </div>
  <button 
    onClick={handleLogout} 
    style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      color: '#ef4444', 
      background: 'none', 
      border: 'none', 
      cursor: 'pointer', 
      padding: '10px 12px', 
      fontWeight: '700', 
      fontSize: '13px',
      width: '100%',
      borderRadius: '10px',
      transition: 'all 0.2s',
      ':hover': {
        background: '#fee2e2',
        transform: 'translateY(-1px)'
      }
    }}
  >
    <LogOut size={18}/> Logout
  </button>
</div>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              color: greeting.color
            }}>
              {greeting.icon}
              <div>
                <h2 style={{ fontSize: '40px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
        {greeting.greeting}, {userData?.name || 'User'}!
      </h2>
                <p style={{ fontSize: '14px', color: theme.muted, margin: '4px 0 0 0' }}>
                  Welcome back to your support dashboard
                </p>
              </div>
            </div>
            <div style={{ 
              background: aiStatus === 'connected' ? '#10b98115' : aiStatus === 'error' ? '#fee2e2' : '#fef3c7',
              color: aiStatus === 'connected' ? '#10b981' : aiStatus === 'error' ? '#dc2626' : '#d97706',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${aiStatus === 'connected' ? '#a7f3d0' : aiStatus === 'error' ? '#fecaca' : '#fde68a'}`
            }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: aiStatus === 'connected' ? '#10b981' : aiStatus === 'error' ? '#dc2626' : '#d97706',
                animation: aiStatus === 'connected' ? 'pulse 2s infinite' : 'none'
              }} />
              AI: {aiStatus === 'connected' ? 'Connected 🟢' : aiStatus === 'error' ? 'Error 🔴' : 'Checking... 🟡'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NotificationBell 
              theme={theme} 
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          </div>
          
        </div>
        
              {activeTab === 'desk' && (
         <LiveStats theme={theme} stats={stats} loading={loading} />
       )}
        

        {activeTab === 'desk' ? (
          <div className="fade-in">
            <div style={{ 
              background: `linear-gradient(135deg, ${greeting.color} 0%, ${greeting.color}80 100%)`, 
              borderRadius: '32px', 
              padding: '48px', 
              color: '#fff', 
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <div style={{ position: 'absolute', right: '-50px', top: '-50px', opacity: 0.1 }}>
                <Bot size={300} />
              </div>
              <div style={{ position: 'absolute', left: '-30px', bottom: '-30px', opacity: 0.05 }}>
                <ShieldIcon size={200} />
              </div>
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                <h2 style={{ fontSize: '40px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
    {greeting.greeting}, {userData?.name || 'User'}!
  </h2>
                <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '24px' }}>
                  Our AI-Hybrid triage engine is ready to analyze your requests. How can we assist you today?
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={20} color="#fff" />
                    <span>{userTicketsCount.resolved} Resolved</span>
                  </div>
                  <div style={{ width: '4px', height: '4px', background: '#fff', opacity: 0.5, borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} color="#fff" />
                    <span>{userTicketsCount.pending} Pending</span>
                  </div>
                  <div style={{ width: '4px', height: '4px', background: '#fff', opacity: 0.5, borderRadius: '50%' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} color="#fff" />
                    <span>{userTicketsCount.total} Total</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', marginBottom: '32px' }}>
              <div>
                <div style={{
                  background: 'white',
                  borderRadius: '24px',
                  border: `1px solid ${theme.border}`,
                  padding: '32px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '32px' }}>Create New Ticket</h3>
                  <form onSubmit={submitRequest}>
                    <input 
                      style={styles.input} 
                      placeholder="Brief summary of the issue" 
                      value={issue.title} 
                      onChange={(e) => setIssue({...issue, title: e.target.value})} 
                      required 
                    />
                    <textarea 
                      style={{ ...styles.input, height: '180px', resize: 'none' }} 
                      placeholder="Describe the issue in detail... Include specific error messages, steps to reproduce, and any relevant details." 
                      value={issue.description} 
                      onChange={(e) => setIssue({...issue, description: e.target.value})} 
                      required 
                    />
                    <button 
                      type="submit" 
                      disabled={isProcessing} 
                      style={{ 
                        background: isProcessing ? theme.muted : 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '18px', 
                        borderRadius: '16px', 
                        fontWeight: '800', 
                        width: '100%', 
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.3s',
                        opacity: isProcessing ? 0.7 : 1,
                        position: 'relative',
                        overflow: 'hidden',
                        ':hover': {
                          background: isProcessing ? theme.muted : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                          transform: isProcessing ? 'none' : 'translateY(-2px)',
                          boxShadow: isProcessing ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.3)'
                        }
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw size={16} className="spin" style={{ marginRight: '8px' }} />
                          AI Analysis in Progress...
                        </>
                      ) : (
                        <>
                          <Send size={16} style={{ marginRight: '8px' }} />
                          Dispatch Request
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* TELEMETRY LOG CONSOLE */}
                <div style={styles.console}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px', 
                    color: theme.primary, 
                    fontSize: '11px', 
                    fontWeight: '800' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={14} /> SYSTEM_TELEMETRY_FEED
                    </div>
                    <button 
                      onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] System Initialized...`])}
                      style={{
                        background: 'transparent',
                        border: '1px solid #334155',
                        color: '#94a3b8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ':hover': {
                          background: '#1e293b',
                          color: '#cbd5e1'
                        }
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {logs.map((log, i) => (
                    <div key={i} style={{ 
                      marginBottom: '4px', 
                      opacity: i === 0 ? 1 : 0.6, 
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>{log.substring(0, 13)}</span>
                      <span>{log.substring(13)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <RecentActivity theme={theme} tickets={tickets} />
                <CategoryDistribution theme={theme} tickets={tickets} />
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="fade-in">
            <QuickActions 
    theme={theme} 
    onNewTicket={() => setActiveTab('desk')}
    onViewHistory={() => setActiveTab('history')}
    onAIAssistant={() => {
      setAiResponse({
        message: "AI Assistant Ready",
        suggestion: "Describe your issue or question in detail. Our AI assistant can help with:\n• Quick technical questions\n• Troubleshooting guidance\n• General IT support\n• Best practices advice",
        type: "INSUFFICIENT_DETAILS"
      });
      setShowAIResponse(true);
    }}
  />
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Your Support Tickets</h3>
                <p style={{ fontSize: '14px', color: theme.muted, margin: '8px 0 0 0' }}>
                  {userTicketsCount.total} total tickets • {userTicketsCount.resolved} resolved • {userTicketsCount.pending} pending
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setActiveTab('desk')}
                  style={{
                    background: theme.primary,
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
                      background: '#4f46e5',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                >
                  <Send size={16} />
                  New Ticket
                </button>
                <button 
                  onClick={fetchTickets}
                  style={{
                    background: 'white',
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: '#f8fafc',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
            
            {tickets.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '24px',
                border: `1px solid ${theme.border}`,
                padding: '60px 32px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <ListChecks size={40} color={theme.muted} />
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No tickets yet</h4>
                <p style={{ color: theme.muted, marginBottom: '32px', fontSize: '14px' }}>
                  You haven't created any support tickets yet. Get started by creating your first ticket.
                </p>
                <button 
                  onClick={() => setActiveTab('desk')}
                  style={{
                    background: theme.primary,
                    color: '#fff',
                    border: 'none',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    ':hover': {
                      background: '#4f46e5',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tickets.map(ticket => (
                  <EnhancedTicketCard
                    key={ticket._id}
                    ticket={ticket}
                    theme={theme}
                    onViewDetails={handleViewTicketDetails}
                    onGiveFeedback={handleGiveFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'profile' ? (
  <div className="fade-in">
    <ProfileSection theme={theme} userData={userData} tickets={tickets} />
  </div>
) : (
          <div className="fade-in">
            <FAQSection theme={theme} />
            
            <div style={{
              background: 'white',
              borderRadius: '24px',
              border: `1px solid ${theme.border}`,
              padding: '32px',
              marginBottom: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Quick Tips</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    borderColor: theme.primary
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: `${theme.primary}15`, padding: '12px', borderRadius: '12px' }}>
                      <FileText size={24} color={theme.primary} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Be Descriptive</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: theme.muted, lineHeight: 1.6 }}>
                    Include specific details, error messages, and steps to reproduce for faster resolution.
                  </p>
                </div>
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    borderColor: theme.success
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: `${theme.success}15`, padding: '12px', borderRadius: '12px' }}>
                      <Clock size={24} color={theme.success} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Track Progress</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: theme.muted, lineHeight: 1.6 }}>
                    Check your ticket history for real-time updates and resolution status.
                  </p>
                </div>
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    borderColor: theme.warning
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: `${theme.warning}15`, padding: '12px', borderRadius: '12px' }}>
                      <Bell size={24} color={theme.warning} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Notifications</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: theme.muted, lineHeight: 1.6 }}>
                    Enable browser notifications for instant updates on your tickets.
                  </p>
                </div>
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${theme.border}`,
                  transition: 'all 0.3s',
                  ':hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    borderColor: theme.info
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: `${theme.info}15`, padding: '12px', borderRadius: '12px' }}>
                      <StarIcon size={24} color={theme.info} />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Provide Feedback</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: theme.muted, lineHeight: 1.6 }}>
                    Rate your support experience to help us improve our service quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
  ticketId={selectedTicket?._id}
  ticketTitle={selectedTicket?.title}
  isOpen={showFeedbackModal}
  onClose={() => {
    setShowFeedbackModal(false);
    setSelectedTicket(null); // Clear selected ticket
  }}
  onSubmit={handleFeedbackSubmit} // This should match your function name
/>
      {/* AI Response Modal */}
<AIResponseModal 
  response={aiResponse}
  onClose={() => {
    setShowAIResponse(false);
    setAiResponse(null);
  }}
/>

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicketDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80%',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Ticket Details</h3>
              <p style={{ fontSize: '12px', color: theme.muted, margin: '4px 0 0 0' }}>
            {/* FIXED: Show ticket ID here */}
            Ticket ID: #{selectedTicketDetails._id?.slice(-8).toUpperCase() || selectedTicketDetails.id?.slice(-8).toUpperCase() || 'N/A'}
          </p>
              <button 
                onClick={() => setShowTicketDetails(false)} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#f1f5f9'
                  }
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{selectedTicketDetails.title}</h4>
              <p style={{ 
                color: theme.muted, 
                lineHeight: 1.6,
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '14px',
                border: `1px solid ${theme.border}`
              }}>
                {selectedTicketDetails.description}
              </p>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Status</p>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '800',
                  background: getStatusStyles(selectedTicketDetails).background,
                  color: getStatusStyles(selectedTicketDetails).color,
                  display: 'inline-block',
                  border: `1px solid ${getStatusStyles(selectedTicketDetails).color}33`
                }}>
                  {selectedTicketDetails.status?.toUpperCase()}
                </span>
              </div>
              
              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Category</p>
                <p style={{ fontWeight: '600' }}>{selectedTicketDetails.category || 'General'}</p>
              </div>
              
              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Priority</p>
                <p style={{ fontWeight: '600' }}>{selectedTicketDetails.priority || 'Medium'}</p>
              </div>
              
              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Created</p>
                <p style={{ fontWeight: '600' }}>
                  {new Date(selectedTicketDetails.created_at || selectedTicketDetails.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Ticket ID</p>
                <p style={{ fontWeight: '600', fontSize: '12px' }}>
            {/* FIXED: Show ticket ID in the grid */}
            #{selectedTicketDetails._id?.slice(-8).toUpperCase() || selectedTicketDetails.id?.slice(-8).toUpperCase() || 'N/A'}
          </p>
              </div>

              <div>
                <p style={{ fontSize: '12px', color: theme.muted, marginBottom: '4px' }}>Assigned To</p>
                <p style={{ fontWeight: '600' }}>
                  {selectedTicketDetails.assignedTo || 'Not assigned yet'}
                </p>
              </div>
            </div>
            
            {/* AI Analysis Details */}
            {selectedTicketDetails.entities && (
              <div style={{
                background: '#f8fafc',
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>AI Analysis</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: theme.muted, marginBottom: '4px' }}>Category Confidence</p>
                    <div style={{
                      height: '6px',
                      background: '#e2e8f0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(selectedTicketDetails.category_confidence || 0) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', margin: '4px 0 0 0' }}>
                      {((selectedTicketDetails.category_confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: '11px', color: theme.muted, marginBottom: '4px' }}>Priority Confidence</p>
                    <div style={{
                      height: '6px',
                      background: '#e2e8f0',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(selectedTicketDetails.priority_confidence || 0) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', margin: '4px 0 0 0' }}>
                      {((selectedTicketDetails.priority_confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedTicketDetails.feedbackSubmitted && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                animation: 'fadeIn 0.5s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={16} color="#15803d" />
                  <span style={{ fontWeight: '600', color: '#15803d' }}>Feedback Submitted</span>
                </div>
                <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
                  <strong>Rating:</strong> {selectedTicketDetails.feedbackRating} stars
                  {selectedTicketDetails.feedbackComment && (
                    <>
                      <br />
                      <strong>Comment:</strong> {selectedTicketDetails.feedbackComment}
                    </>
                  )}
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {selectedTicketDetails.status === 'resolved' && !selectedTicketDetails.feedbackSubmitted && (
                <button
                  onClick={() => {
                    setShowTicketDetails(false);
                    handleGiveFeedback(selectedTicketDetails);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    color: '#15803d',
                    border: '1px solid #86efac',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)'
                    }
                  }}
                >
                  <StarIcon size={16} />
                  Give Feedback
                </button>
              )}
              <button
                onClick={() => setShowTicketDetails(false)}
                style={{
                  background: theme.primary,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#4f46e5',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'

                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        .fade-in { animation: fadeIn 0.6s ease-out; }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .spin { animation: spin 1s linear infinite; }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        * { box-sizing: border-box; }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;