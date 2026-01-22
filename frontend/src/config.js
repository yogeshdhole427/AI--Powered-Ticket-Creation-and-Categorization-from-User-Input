// Development: localhost:5000
// Production: Render URL
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://ticket-ml-backend.onrender.com'
  : 'http://localhost:5001';

export const API_BASE_URL = `${backendUrl}/api`;
export const SOCKET_URL = backendUrl;