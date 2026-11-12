import axios from 'axios';
import { supabase } from '@/lib/supabase';

let base = import.meta.env.PROD 
  ? '/api/v1' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1');
if (!base.endsWith('/api/v1')) {
  base = base.replace(/\/+$/, '') + '/api/v1';
}

const api = axios.create({
  baseURL: base,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject Supabase JWT Bearer token into all outgoing API requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('[API Auth Interceptor] Error retrieving session:', err);
  }
  return config;
});

export default api;

