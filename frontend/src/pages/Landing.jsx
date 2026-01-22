import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, Zap, Shield, Terminal, ArrowRight, MessageSquare, 
  Database, Code, Globe, Lock, BarChart, Server, 
  Activity, CheckCircle, ChevronRight, Layers, ShieldAlert,
  Sparkles, Users, Brain, Target, Rocket, LineChart,
  ShieldCheck, Cloud, Wifi, Clock, PieChart, BarChart3,
  Award, TrendingUp, GitBranch, Cpu as CpuIcon, Sparkle,
  Search, Filter, Database as DbIcon, Network, HardDrive
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [demoText, setDemoText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [confidence, setConfidence] = useState("");
  const [activeDemo, setActiveDemo] = useState(0);
  
  const demoExamples = [
    "VPN is failing and I cannot access the cloud drive",
    "Server database connection timeout error",
    "Security alert: multiple failed login attempts detected",
    "Email server is down across all departments",
    "Critical software update required for security patch"
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDemoInference = () => {
    if (!demoText) {
      // Use example text if empty
      setDemoText(demoExamples[activeDemo]);
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const categories = [
        "Network Infrastructure", 
        "Database Systems", 
        "Security Incident", 
        "Email Services",
        "Software Updates"
      ];
      const priorities = ["Low", "Medium", "High", "Critical"];
      const confidences = ["92.3%", "94.7%", "98.4%", "96.1%", "95.2%"];
      
      const text = demoText.toLowerCase();
      
      if (text.includes("vpn") || text.includes("cloud")) {
        setCategory("Network Infrastructure");
        setPriority("High");
        setConfidence("98.4%");
      } else if (text.includes("database") || text.includes("connection")) {
        setCategory("Database Systems");
        setPriority("Medium");
        setConfidence("94.7%");
      } else if (text.includes("security") || text.includes("alert")) {
        setCategory("Security Incident");
        setPriority("Critical");
        setConfidence("99.2%");
      } else if (text.includes("email") || text.includes("server")) {
        setCategory("Email Services");
        setPriority("High");
        setConfidence("96.1%");
      } else if (text.includes("update") || text.includes("software")) {
        setCategory("Software Updates");
        setPriority("Medium");
        setConfidence("92.3%");
      } else {
        setCategory(categories[Math.floor(Math.random() * categories.length)]);
        setPriority(priorities[Math.floor(Math.random() * priorities.length)]);
        setConfidence(confidences[Math.floor(Math.random() * confidences.length)]);
      }
      
      setIsAnalyzing(false);
    }, 1500);
  };

  const stats = [
    { value: "98.4%", label: "Classification Accuracy", icon: <Brain size={20} /> },
    { value: "<400ms", label: "Response Time", icon: <Clock size={20} /> },
    { value: "1.2M+", label: "Training Samples", icon: <Database size={20} /> },
    { value: "99.9%", label: "Uptime SLA", icon: <ShieldCheck size={20} /> }
  ];

  const features = [
    {
      icon: <Brain size={28} />,
      title: "Dual-Head Transformer",
      description: "Parallel processing for semantic categorization and priority detection",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)"
    },
    {
      icon: <GitBranch size={28} />,
      title: "Real-time Processing",
      description: "Handle 50k+ concurrent requests with sub-400ms latency",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981, #0ea5e9)"
    },
    {
      icon: <ShieldCheck size={28} />,
      title: "Enterprise Security",
      description: "GDPR compliant, ISO 27001 certified with end-to-end encryption",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #ec4899)"
    },
    {
      icon: <LineChart size={28} />,
      title: "Smart Analytics",
      description: "Real-time insights and predictive issue resolution",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)"
    }
  ];

  const useCases = [
    {
      icon: <Server size={24} />,
      title: "IT Support",
      description: "Automated ticket routing and categorization"
    },
    {
      icon: <Shield size={24} />,
      title: "Security Operations",
      description: "Threat detection and incident classification"
    },
    {
      icon: <Users size={24} />,
      title: "Customer Support",
      description: "Intelligent query understanding and routing"
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Business Analytics",
      description: "Trend analysis and predictive insights"
    }
  ];

  return (
    <div style={{
      backgroundColor: '#ffffff',
      color: '#0f172a',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #f1f5f9' : 'none',
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={24} color="#ffffff" />
          </div>
          <span style={{
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #0f172a, #475569)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px'
          }}>
            Nexus<span style={{ color: '#6366f1' }}>AI</span>
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button 
            onClick={() => navigate('/dev-auth')}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'color 0.2s',
              ':hover': { color: '#0f172a' }
            }}
          >
            System Console
          </button>
          <button 
            onClick={() => navigate('/auth')}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '12px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)'
              }
            }}
          >
            Launch Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '180px 5% 100px',
        background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#6366f1',
            marginBottom: '32px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <span>Enterprise Grade •  v2.4 • Now Live</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(3.5rem, 6vw, 5rem)',
            fontWeight: '900',
            lineHeight: '1.1',
            letterSpacing: '-2px',
            margin: '0 0 24px 0',
            background: 'linear-gradient(135deg, #0f172a 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Intelligent Support
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Powered by AI
            </span>
          </h1>

          <p style={{
            fontSize: '1.25rem',
            color: '#64748b',
            lineHeight: '1.6',
            marginBottom: '48px',
            maxWidth: '600px',
            margin: '0 auto 48px'
          }}>
            Transform your helpdesk with our BERT-powered architecture that intelligently categorizes, 
            prioritizes, and routes support tickets in real-time.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={() => navigate('/auth')}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                padding: '18px 40px',
                borderRadius: '14px',
                fontWeight: '700',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)'
                }
              }}
            >
              Get Started Free
              <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/dev-auth')}
              style={{
                background: 'none',
                color: '#0f172a',
                padding: '18px 40px',
                borderRadius: '14px',
                fontWeight: '700',
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  background: '#f8fafc',
                  borderColor: '#cbd5e1'
                }
              }}
            >
              Developer Console
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '80px 5%',
        background: '#f8fafc'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {stats.map((stat, index) => (
            <div 
              key={index}
              style={{
                background: '#ffffff',
                padding: '32px',
                borderRadius: '20px',
                border: '1px solid #f1f5f9',
                textAlign: 'center',
                transition: 'all 0.3s',
                ':hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                  borderColor: '#e2e8f0'
                }
              }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '14px',
                marginBottom: '20px',
                color: '#6366f1'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '8px'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '600'
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demo Section */}
      <section style={{
        padding: '100px 5%',
        background: '#ffffff'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '900',
              letterSpacing: '-1.5px',
              marginBottom: '16px'
            }}>
              See AI in Action
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Experience real-time classification of support tickets with our BERT-powered engine
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            borderRadius: '28px',
            padding: '40px',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.15)',
            border: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px',
              color: '#94a3b8'
            }}>
              <Terminal size={20} />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                letterSpacing: '1px'
              }}>
                SAMPLE CLASSIFICATION PIPELINE
              </span>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <input
                  type="text"
                  placeholder={demoExamples[activeDemo]}
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    color: '#ffffff',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    ':focus': {
                      borderColor: '#6366f1',
                      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                    }
                  }}
                />
                <button
                  onClick={handleDemoInference}
                  disabled={isAnalyzing}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#ffffff',
                    padding: '0 36px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isAnalyzing ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    ':hover': {
                      transform: isAnalyzing ? 'none' : 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                    }
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Activity size={20} className="spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain size={20} />
                      Analyze
                    </>
                  )}
                </button>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {demoExamples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setDemoText(example)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#94a3b8',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid #334155',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ':hover': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#ffffff'
                      }
                    }}
                  >
                    {example.substring(0, 25)}...
                  </button>
                ))}
              </div>
            </div>

            {(demoText || isAnalyzing) && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '24px'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      color: '#94a3b8',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      <Filter size={16} />
                      Category
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ffffff'
                    }}>
                      {isAnalyzing ? 'Analyzing...' : category || 'Not classified'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      color: '#94a3b8',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      <ShieldAlert size={16} />
                      Priority
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: priority === 'Critical' ? '#ef4444' : 
                             priority === 'High' ? '#f59e0b' : 
                             priority === 'Medium' ? '#3b82f6' : '#10b981'
                    }}>
                      {isAnalyzing ? '...' : priority || 'Not determined'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      color: '#94a3b8',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      <Target size={16} />
                      Confidence
                    </div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#10b981'
                    }}>
                      {isAnalyzing ? 'Calculating...' : confidence || '0%'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '100px 5%',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '900',
            letterSpacing: '-1.5px',
            marginBottom: '16px'
          }}>
            Why Choose NexusAI?
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Built with enterprise-grade technology and security standards
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: '#ffffff',
                padding: '40px',
                borderRadius: '24px',
                border: '1px solid #f1f5f9',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden',
                ':hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.1)'
                }
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: feature.gradient,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: '#ffffff'
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#0f172a'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                color: '#64748b',
                lineHeight: '1.6',
                fontSize: '15px'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section style={{
        padding: '100px 5%',
        background: '#ffffff'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '60px'
          }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '900',
              letterSpacing: '-1.5px',
              marginBottom: '16px'
            }}>
              Enterprise Use Cases
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Transform your support operations across multiple domains
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {useCases.map((useCase, index) => (
              <div
                key={index}
                style={{
                  background: '#f8fafc',
                  padding: '32px',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s',
                  ':hover': {
                    background: '#ffffff',
                    borderColor: '#cbd5e1',
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1'
                  }}>
                    {useCase.icon}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#0f172a'
                  }}>
                    {useCase.title}
                  </h3>
                </div>
                
                <p style={{
                  color: '#64748b',
                  lineHeight: '1.6',
                  fontSize: '15px'
                }}>
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '120px 5%',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '900',
            letterSpacing: '-1.5px',
            marginBottom: '24px'
          }}>
            Ready to Transform Your Support?
          </h2>
          
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Join hundreds of enterprises using NexusAI to streamline their support operations 
            and deliver exceptional service.
          </p>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#ffffff',
                padding: '18px 40px',
                borderRadius: '14px',
                fontWeight: '700',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.3)',
                ':hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)'
                }
              }}
            >
              Start Free Trial
              <Rocket size={20} />
            </button>
            
            <button
              onClick={() => navigate('/dev-auth')}
              style={{
                background: 'transparent',
                color: '#ffffff',
                padding: '18px 40px',
                borderRadius: '14px',
                fontWeight: '700',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '80px 5%',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '40px',
            marginBottom: '60px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  padding: '10px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Cpu size={24} color="#ffffff" />
                </div>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #0f172a, #475569)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Nexus<span style={{ color: '#6366f1' }}>AI</span>
                </span>
              </div>
              <p style={{
                color: '#64748b',
                fontSize: '15px',
                maxWidth: '400px'
              }}>
                Enterprise-grade AI-powered support intelligence platform. 
                Transforming helpdesk operations since 2024.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '60px',
              flexWrap: 'wrap'
            }}>
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '20px',
                  letterSpacing: '1px'
                }}>
                  PRODUCT
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>Features</a>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>Solutions</a>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>Pricing</a>
                </div>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '20px',
                  letterSpacing: '1px'
                }}>
                  COMPANY
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>About</a>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>Careers</a>
                  <a href="#" style={{ color: '#64748b', fontSize: '14px', textDecoration: 'none' }}>Contact</a>
                </div>
              </div>
              
              <div>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '20px',
                  letterSpacing: '1px'
                }}>
                  COMPLIANCE
                </h4>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>GDPR Ready</span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>ISO 27001</span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>SOC2 Type II</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            paddingTop: '40px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              © 2024 NexusAI. All rights reserved.
            </div>
            
            <div style={{
              display: 'flex',
              gap: '24px',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cookie Policy</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        *:focus {
          outline: none;
        }
        
        button {
          cursor: pointer;
        }
        
        input::placeholder {
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default Landing;