import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onOpenChange(false);
      } else {
        // Request Beta
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/v1/auth/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to submit beta request');
        }

        setSuccess('Beta request submitted! We will email you once approved.');
        setName('');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Sync default mode if it changes
  React.useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] text-white border-[#333]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Join the Beta'}
          </DialogTitle>
          <DialogDescription className="text-[#A1A1A1]">
            {mode === 'login' 
              ? 'Enter your email and password to access the full library.' 
              : 'Register for our waitlist to get early access.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
          {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md">{error}</div>}
          {success && <div className="text-green-500 text-sm bg-green-500/10 p-3 rounded-md">{success}</div>}

          {mode === 'register' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-[#0E0E0E] border-[#333]"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hi@example.com"
              className="bg-[#0E0E0E] border-[#333]"
              required
            />
          </div>

          {mode === 'login' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0E0E0E] border-[#333]"
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 mt-2" disabled={loading}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Request Access')}
          </Button>
        </form>

        <div className="text-center text-sm text-[#A1A1A1] mt-2">
          {mode === 'login' ? "Don't have an account? " : "Already approved? "}
          <button 
            type="button" 
            className="text-white hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Join Free' : 'Sign In'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
