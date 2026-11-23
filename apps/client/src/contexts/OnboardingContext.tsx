import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { OnboardingModal } from '@/components/OnboardingModal';

interface OnboardingContextType {
  openOnboarding: () => void;
  closeOnboarding: () => void;
  isOnboardingOpen: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const isAuthPage = () => {
      const path = window.location.pathname.toLowerCase();
      const authPaths = ['/login', '/signup', '/register', '/auth', '/forgot-password', '/reset-password'];
      return authPaths.some((p) => path.startsWith(p));
    };

    // If on auth page or not logged in, ensure modal is closed
    if (isAuthPage() || !user) {
      setIsOpen(false);
      return;
    }

    // Check if user has completed onboarding in PostgreSQL
    const checkStatus = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (user.id) headers['x-user-id'] = user.id;

        const res = await fetch(`${API_URL}/api/v1/onboarding/status`, { headers });
        const json = await res.json();

        // If user is not onboarded in database, open modal
        if (json.success && !json.data?.isOnboarded) {
          const timer = setTimeout(() => {
            if (!isAuthPage()) {
              setIsOpen(true);
            }
          }, 600);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        // Fallback to local check if offline
        const localStatus = localStorage.getItem(`zibo_onboarding_${user.id}`);
        if (!localStatus && !isAuthPage()) {
          setIsOpen(true);
        }
      }
    };

    checkStatus();
  }, [user]);

  return (
    <OnboardingContext.Provider
      value={{
        openOnboarding: () => setIsOpen(true),
        closeOnboarding: () => setIsOpen(false),
        isOnboardingOpen: isOpen,
      }}
    >
      {children}
      <OnboardingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={() => setIsOpen(false)}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

