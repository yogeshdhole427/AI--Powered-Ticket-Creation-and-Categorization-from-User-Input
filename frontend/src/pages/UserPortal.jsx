import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Info } from 'lucide-react';

const UserPortal = ({ isGuest = false }) => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // Sends data to Node.js which bridges to FastAPI BERT
        await axios.post('http://localhost:5000/api/tickets/generate', formData);
        alert("Success! AI has categorized and routed your ticket.");
        navigate('/');
    } catch (err) { 
        alert("Error: Check if Backend (Port 5000) and AI (Port 8000) are running."); 
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backBtn}>
        <ArrowLeft size={18} /> Back to Home
      </button>
      
      <div style={styles.header}>
        <h2>{isGuest ? 'Guest Support' : 'Employee Support Portal'}</h2>
        {isGuest && (
          <p style={styles.guestNote}>
            <Info size={14} /> You are in a <strong>Guest Session</strong>.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} style={styles.form}>
        <div style={styles.inputGroup}>
          <label>Issue Subject</label>
          <input 
            style={styles.input} 
            placeholder="e.g., Cannot access Outlook" 
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})} 
            required 
          />
        </div>

        <div style={styles.inputGroup}>
          <label>Detailed Description</label>
          <textarea 
            style={styles.textarea} 
            placeholder="Please describe what happened..." 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})} 
            required 
          />
        </div>

        <button type="submit" style={styles.submitBtn} disabled={loading}>
          {loading ? 'AI Categorizing...' : 'Submit Incident'} <Send size={18} style={{marginLeft: '8px'}} />
        </button>
      </form>
    </div>
  );
};

const styles = {
    container: { padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' },
    header: { marginBottom: '30px' },
    backBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' },
    guestNote: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' },
    textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', height: '120px', fontSize: '16px', resize: 'vertical' },
    submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', transition: '0.2s' }
};

export default UserPortal;