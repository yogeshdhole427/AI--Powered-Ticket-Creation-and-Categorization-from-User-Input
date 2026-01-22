import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Terminal, Key, Cpu, ArrowRight, Lock } from 'lucide-react';

const DevAuth = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [logs] = useState([
    "> System.init(): Console node ready",
    "> BERT_CORE_v2.4 handshake successful",
    "> Waiting for technician credentials..."
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      if (res.data.user.role !== 'agent') {
        setError("> [AUTH_ERROR]: ACCESS_DENIED. Technical credentials required.");
        return;
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dev-dashboard');
    } catch (err) {
      setError(`> [AUTH_ERROR]: ${err.response?.data?.msg || "INVALID_CREDENTIALS"}`);
    }
  };

  const dvStyles = {
    wrapper: { height: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    glow: { position: 'absolute', width: '500px', height: '500px', background: '#2563eb', filter: 'blur(150px)', opacity: 0.1 },
    card: { width: '900px', background: '#0f172a', borderRadius: '32px', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 },
    topBar: { padding: '20px 30px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px', fontWeight: '700' },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    status: { display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' },
    pulse: { width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' },
    content: { display: 'flex', padding: '60px' },
    left: { flex: 1.2, paddingRight: '60px' },
    right: { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' },
    title: { color: '#fff', fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0', letterSpacing: '-1px' },
    sub: { color: '#64748b', fontSize: '15px', lineHeight: 1.6, marginBottom: '40px' },
    field: { marginBottom: '25px' },
    label: { display: 'block', color: '#fff', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', marginBottom: '10px' },
    inputRow: { display: 'flex', alignItems: 'center', gap: '15px', background: '#020617', padding: '18px', borderRadius: '16px', border: '1px solid #334155' },
    input: { background: 'none', border: 'none', outline: 'none', color: '#fff', width: '100%', fontSize: '14px', fontFamily: 'monospace' },
    loginBtn: { width: '100%', background: '#2563eb', color: '#fff', padding: '20px', borderRadius: '16px', fontWeight: '800', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    logBox: { background: '#020617', borderRadius: '20px', flex: 1, border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    logHeader: { background: '#1e293b', padding: '12px 20px', color: '#64748b', fontSize: '10px', fontWeight: '900' },
    logBody: { padding: '20px', color: '#4ade80', fontFamily: 'monospace', fontSize: '12px', flex: 1 },
    securityMeta: { display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '11px', fontWeight: 'bold', justifyContent: 'center' },
    errorText: { color: '#ef4444', fontSize: '12px', fontFamily: 'monospace', margin: '10px 0' }
  };

  return (
    <div style={dvStyles.wrapper}>
      <div style={dvStyles.glow}></div>
      <div style={dvStyles.card}>
        <div style={dvStyles.topBar}>
          <div style={dvStyles.brand}><Cpu size={20}/> SYSTEM DESK // TIER_4</div>
          <div style={dvStyles.status}><div style={dvStyles.pulse}></div> PROD_ACTIVE</div>
        </div>

        <div style={dvStyles.content}>
          <form style={dvStyles.left} onSubmit={handleLogin} autoComplete="off">
            <h2 style={dvStyles.title}>Developer Access</h2>
            <p style={dvStyles.sub}>Initialize secure session to monitor BERT model telemetry and manual triage overrides.</p>
            {error && <div style={dvStyles.errorText}>{error}</div>}
            <div style={dvStyles.field}>
              <div style={dvStyles.label}>STAFF_IDENTIFIER (EMAIL)</div>
              <div style={dvStyles.inputRow}>
                <Terminal size={18} color="#60a5fa"/><input name="email" style={dvStyles.input} type="text" placeholder="dev@example.com" value={formData.email} onChange={handleChange} autoComplete="new-password" required />
              </div>
            </div>
            <div style={dvStyles.field}>
              <div style={dvStyles.label}>SECURITY_PASSKEY</div>
              <div style={dvStyles.inputRow}>
                <Key size={18} color="#60a5fa"/><input name="password" style={dvStyles.input} type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} autoComplete="new-password" required />
              </div>
            </div>
            <button type="submit" style={dvStyles.loginBtn}>START SESSION <ArrowRight size={18}/></button>
          </form>

          <div style={dvStyles.right}>
            <div style={dvStyles.logBox}>
              <div style={dvStyles.logHeader}>CONSOLE_TELEMETRY</div>
              <div style={dvStyles.logBody}>
                {logs.map((log, i) => <p key={i} style={{margin: '0 0 5px 0'}}>{log}</p>)}
                <p style={{color: '#6366f1'}}>{`> Initializing RSA_4096 handshake...`}</p>
                {error ? <p style={{color: '#ef4444'}}>{error}</p> : <p style={{color: '#94a3b8'}}>{`> Waiting for Auth...`}</p>}
              </div>
            </div>
            <div style={dvStyles.securityMeta}><Lock size={14}/> AES-256 Bit Encryption Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevAuth;