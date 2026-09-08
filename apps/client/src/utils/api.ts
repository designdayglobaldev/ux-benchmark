import axios from 'axios';

let base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
if (!base.endsWith('/api/v1')) {
  base = base.replace(/\/+$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
