import { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export interface FeatureFlagData {
  enabled: boolean;
  behavior: 'hide' | 'maintenance' | 'coming_soon';
  customMessage: string;
}

const STORAGE_KEY = 'zibo_feature_flags_cache';

// Load persisted cache from localStorage so page switches never flash
const loadCachedFlags = (): Record<string, FeatureFlagData> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // Ignore JSON error
  }
  return {
    'design-agent-studio': {
      enabled: false,
      behavior: 'coming_soon',
      customMessage: 'We are putting the final touches on our context-aware AI design agent. Early access is rolling out soon!',
    },
    'ai-benchmark': {
      enabled: true,
      behavior: 'maintenance',
      customMessage: 'AI Benchmark is temporarily under maintenance while we upgrade models. We will be back shortly!',
    },
    'collaborative-boards': {
      enabled: true,
      behavior: 'coming_soon',
      customMessage: 'Collaborative workspaces and live canvas are launching soon!',
    },
  };
};

let cachedFlags: Record<string, FeatureFlagData> = loadCachedFlags();

let listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach((fn) => fn());
};

let isFetching = false;

export const refreshFeatureFlags = async () => {
  if (isFetching) return;
  isFetching = true;
  try {
    let base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    if (!base.endsWith('/api/v1')) {
      base = base.replace(/\/+$/, '') + '/api/v1';
    }
    const res = await fetch(`${base}/feature-flags`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        let changed = false;
        data.forEach((f: any) => {
          if (f.key) {
            const existing = cachedFlags[f.key];
            const updated: FeatureFlagData = {
              enabled: typeof f.enabled === 'boolean' ? f.enabled : false,
              behavior: f.behavior || 'coming_soon',
              customMessage: f.customMessage || '',
            };
            if (
              !existing ||
              existing.enabled !== updated.enabled ||
              existing.behavior !== updated.behavior ||
              existing.customMessage !== updated.customMessage
            ) {
              cachedFlags[f.key] = updated;
              changed = true;
            }
          }
        });
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedFlags));
          } catch (e) {
            // Ignore storage error
          }
          notifyListeners();
        }
      }
    }
  } catch (err) {
    console.warn('Failed to refresh feature flags from API:', err);
  } finally {
    isFetching = false;
  }
};

// Initial fetch on module load
refreshFeatureFlags();

/**
 * useFeatureFlag Hook
 * 
 * Synchronously uses localStorage & memory cache so switching routes NEVER flashes
 * internal content before the placeholder renders.
 */
export function useFeatureFlag(flagKey: string, defaultEnabled = false): FeatureFlagData {
  const hasPosthogKey = !!import.meta.env.VITE_POSTHOG_KEY;
  const posthogVal = hasPosthogKey ? posthog.isFeatureEnabled(flagKey) : undefined;

  const [state, setState] = useState<FeatureFlagData>(() => {
    const cached = cachedFlags[flagKey];
    if (cached) {
      return {
        ...cached,
        enabled: typeof posthogVal === 'boolean' ? posthogVal : cached.enabled,
      };
    }
    return {
      enabled: typeof posthogVal === 'boolean' ? posthogVal : defaultEnabled,
      behavior: 'coming_soon',
      customMessage: 'This feature is coming soon!',
    };
  });

  useEffect(() => {
    const update = () => {
      const ph = hasPosthogKey ? posthog.isFeatureEnabled(flagKey) : undefined;
      const cached = cachedFlags[flagKey];
      if (cached) {
        setState({
          ...cached,
          enabled: typeof ph === 'boolean' ? ph : cached.enabled,
        });
      }
    };

    listeners.push(update);

    let unregisterPosthog: (() => void) | undefined;
    if (hasPosthogKey && posthog.onFeatureFlags) {
      unregisterPosthog = posthog.onFeatureFlags(() => {
        update();
      });
    }

    refreshFeatureFlags().then(update);
    const interval = setInterval(() => {
      refreshFeatureFlags();
    }, 6000);

    return () => {
      listeners = listeners.filter((l) => l !== update);
      clearInterval(interval);
      if (unregisterPosthog) {
        unregisterPosthog();
      }
    };
  }, [flagKey, hasPosthogKey]);

  return state;
}
