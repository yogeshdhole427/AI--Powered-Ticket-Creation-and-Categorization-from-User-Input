import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  ArrowRight, Lock, User, Mail, Cpu, Sparkles,
  Eye, EyeOff, Shield, Server, Zap, Brain,
  CheckCircle, Star, Globe, Terminal, Fingerprint,
  X, Loader2, LogIn, UserPlus, Key
} from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [activeField, setActiveField] = useState('');
  const containerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('=== DEBUG INFO ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    // Validate all fields are filled
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (!isLogin && !formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const res = await axios.post(`${API_BASE_URL}${endpoint}`, formData);
      
      if (!isLogin) {
        alert("Account Registered Successfully! Please sign in.");
        setIsLogin(true);
        // Clear form after registration
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'user'
        });
      } else {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate(res.data.user.role === 'agent' ? '/dev-dashboard' : '/user-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError('');
    // Clear form when switching
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user'
    });
  };

  const features = [
    { 
      icon: <Brain size={24} />, 
      title: 'AI-Powered Intelligence', 
      desc: 'Advanced machine learning for ticket classification',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      icon: <Zap size={24} />, 
      title: 'Real-time Processing', 
      desc: 'Instant analysis and routing of support requests',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      icon: <Shield size={24} />, 
      title: 'Enterprise Security', 
      desc: 'Bank-level encryption and data protection',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      icon: <Server size={24} />, 
      title: 'Cloud Native', 
      desc: 'Scalable infrastructure with 99.9% uptime',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div 
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
        zIndex: 1
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 40px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            marginBottom: '30px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              padding: '14px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={28} color="#ffffff" />
            </div>
            <span style={{
              fontSize: '32px',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #1e293b, #475569)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
            }}>
              Nexus<span style={{ color: '#3b82f6' }}>AI</span>
            </span>
            <Sparkles size={24} color="#8b5cf6" />
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '16px',
            letterSpacing: '-1px'
          }}>
            {isLogin ? 'Welcome Back' : 'Join Our Platform'}
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {isLogin 
              ? 'Sign in to access your AI-powered support dashboard'
              : 'Create your account to experience intelligent support automation'
            }
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          display: 'flex',
          gap: '40px',
          maxWidth: '1000px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          {/* Features Panel */}
          <div style={{
            flex: 1,
            minWidth: '300px',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '28px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={24} color="#10b981" />
              Why Choose NexusAI?
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    padding: '20px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    borderRadius: '18px',
                    border: '1px solid rgba(226, 232, 240, 0.5)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    ':hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#c7d2fe',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: `linear-gradient(135deg, ${feature.color.split(' ')[0].replace('from-', '#')}, ${feature.color.split(' ')[1].replace('to-', '#')})`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'white'
                  }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '6px'
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      lineHeight: 1.5
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authentication Panel */}
          <div style={{
            flex: 1,
            minWidth: '300px',
            position: 'relative'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '28px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '16px',
                padding: '6px',
                marginBottom: '32px'
              }}>
                <button
                  onClick={() => toggleForm()}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: isLogin ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: isLogin ? 'white' : '#64748b',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <LogIn size={18} />
                  Sign In
                </button>
                
                <button
                  onClick={() => toggleForm()}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: !isLogin ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: !isLogin ? 'white' : '#64748b',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <UserPlus size={18} />
                  Register
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <X size={20} />
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Name Field - Only for Registration */}
                  {!isLogin && (
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#475569',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <User size={16} />
                        Full Name
                        <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                      </label>
                      <div style={{
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}>
                        <input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => setActiveField('name')}
                          onBlur={() => setActiveField('')}
                          style={{
                            width: '100%',
                            padding: '16px 20px 16px 48px',
                            background: activeField === 'name' ? '#ffffff' : '#f8fafc',
                            border: activeField === 'name' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            borderRadius: '14px',
                            color: '#1e293b',
                            fontSize: '15px',
                            transition: 'all 0.3s ease',
                            outline: 'none'
                          }}
                          placeholder="Enter your full name"
                          required={!isLogin}
                        />
                        <div style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: activeField === 'name' ? '#3b82f6' : '#94a3b8'
                        }}>
                          <User size={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Mail size={16} />
                      Email Address
                      <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                    </label>
                    <div style={{
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField('')}
                        style={{
                          width: '100%',
                          padding: '16px 20px 16px 48px',
                          background: activeField === 'email' ? '#ffffff' : '#f8fafc',
                          border: activeField === 'email' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          color: '#1e293b',
                          fontSize: '15px',
                          transition: 'all 0.3s ease',
                          outline: 'none'
                        }}
                        placeholder="you@example.com"
                        required
                      />
                      <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: activeField === 'email' ? '#3b82f6' : '#94a3b8'
                      }}>
                        <Mail size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Lock size={16} />
                      Password
                      <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                    </label>
                    <div style={{
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setActiveField('password')}
                        onBlur={() => setActiveField('')}
                        style={{
                          width: '100%',
                          padding: '16px 48px 16px 48px',
                          background: activeField === 'password' ? '#ffffff' : '#f8fafc',
                          border: activeField === 'password' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          color: '#1e293b',
                          fontSize: '15px',
                          transition: 'all 0.3s ease',
                          outline: 'none'
                        }}
                        placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                        required
                      />
                      <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: activeField === 'password' ? '#3b82f6' : '#94a3b8'
                      }}>
                        <Key size={20} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: showPassword ? '#3b82f6' : '#94a3b8',
                          cursor: 'pointer',
                          padding: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {!isLogin && (
                      <p style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '8px',
                        marginLeft: '4px'
                      }}>
                        Use at least 8 characters with a mix of letters, numbers & symbols
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  style={{
                    width: '100%',
                    padding: '20px',
                    marginTop: '32px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none',
                    borderRadius: '16px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    transform: isHovering ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovering 
                      ? '0 12px 32px rgba(59, 130, 246, 0.3)' 
                      : '0 8px 24px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={22} className="spin" />
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign In to Dashboard' : 'Create Account'}
                      <ArrowRight size={22} style={{
                        transform: isHovering ? 'translateX(5px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease'
                      }} />
                    </>
                  )}
                </button>
              </form>

              {/* Security Note */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0',
                color: '#64748b',
                fontSize: '14px'
              }}>
                <Shield size={18} color="#10b981" />
                <span>Your data is secured with AES-256 encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '60px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          <p style={{ margin: 0 }}>
            Need help? <span style={{ color: '#3b82f6', cursor: 'pointer' }}>Contact Support</span>
          </p>
        </div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        * {
          box-sizing: border-box;
        }
        
        input {
          outline: none;
          transition: all 0.3s ease;
        }
        
        input::placeholder {
          color: #94a3b8;
        }
        
        input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        button {
          outline: none;
        }
        
        button:disabled {
          opacity: 0.7;
        }
        
        @media (max-width: 768px) {
          .flex-wrap {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;