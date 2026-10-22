import { Request, Response } from 'express';

const getPostHogConfig = () => {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const apiHost = process.env.POSTHOG_API_HOST || 'https://us.posthog.com';
  return { projectId, personalApiKey, apiHost };
};

export type FeatureBehavior = 'hide' | 'maintenance' | 'coming_soon';

export interface FeatureMeta {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  defaultBehavior: FeatureBehavior;
  defaultMessage: string;
}

export interface FeatureState {
  enabled: boolean;
  behavior: FeatureBehavior;
  customMessage: string;
}

// Known features with readable labels & descriptions so you can add more features anytime
export const KNOWN_FEATURES: FeatureMeta[] = [
  {
    key: 'design-agent-studio',
    name: 'Design Agent Studio',
    description: 'Enables the AI Design Agent Studio page (/design-agent) and the STUDIO navbar tab.',
    defaultValue: true,
    defaultBehavior: 'coming_soon',
    defaultMessage: 'We are putting the final touches on our context-aware AI design agent. Early access is rolling out soon!',
  },
  {
    key: 'ai-benchmark',
    name: 'AI Benchmark Tool',
    description: 'Enables the AI screen benchmarking comparison tool (/benchmark).',
    defaultValue: true,
    defaultBehavior: 'maintenance',
    defaultMessage: 'AI Benchmark is temporarily under maintenance while we upgrade models. We will be back shortly!',
  },
  {
    key: 'collaborative-boards',
    name: 'Workspaces & Collections',
    description: 'Enables interactive boards, collaborative canvas chat, and screen bookmarking.',
    defaultValue: true,
    defaultBehavior: 'coming_soon',
    defaultMessage: 'Collaborative workspaces and live canvas are launching soon!',
  },
];

// In-memory fallback and metadata store
const localFlagsFallback: Record<string, FeatureState> = {
  'design-agent-studio': {
    enabled: true,
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

/**
 * GET /api/v1/feature-flags
 * Fetches all feature flags and their current status from PostHog (or fallback).
 */
export const getFeatureFlags = async (req: Request, res: Response) => {
  try {
    const { projectId, personalApiKey, apiHost } = getPostHogConfig();

    if (!projectId || !personalApiKey) {
      const result = KNOWN_FEATURES.map((feat) => {
        const local = localFlagsFallback[feat.key] || {
          enabled: feat.defaultValue,
          behavior: feat.defaultBehavior,
          customMessage: feat.defaultMessage,
        };
        return {
          ...feat,
          enabled: local.enabled,
          behavior: local.behavior,
          customMessage: local.customMessage,
          source: 'local_fallback',
        };
      });
      return res.json(result);
    }

    // Query PostHog Feature Flags API
    const response = await fetch(`${apiHost}/api/projects/${projectId}/feature_flags/`, {
      headers: {
        Authorization: `Bearer ${personalApiKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`PostHog flags fetch error: ${response.statusText}`);
      const result = KNOWN_FEATURES.map((feat) => {
        const local = localFlagsFallback[feat.key] || {
          enabled: feat.defaultValue,
          behavior: feat.defaultBehavior,
          customMessage: feat.defaultMessage,
        };
        return {
          ...feat,
          enabled: local.enabled,
          behavior: local.behavior,
          customMessage: local.customMessage,
          source: 'local_fallback',
        };
      });
      return res.json(result);
    }

    const data = await response.json();
    const remoteFlags: any[] = Array.isArray(data.results) ? data.results : [];

    // Map through known features, overlaying remote flag status if exists
    const result = KNOWN_FEATURES.map((feat) => {
      const match = remoteFlags.find((f: any) => f.key === feat.key);
      const local = localFlagsFallback[feat.key] || {
        enabled: feat.defaultValue,
        behavior: feat.defaultBehavior,
        customMessage: feat.defaultMessage,
      };

      return {
        ...feat,
        id: match?.id,
        enabled: match ? match.active : local.enabled,
        behavior: local.behavior,
        customMessage: local.customMessage,
        source: match ? 'posthog' : 'local_default',
      };
    });

    // Also include any extra flags created directly in PostHog so you can see them!
    remoteFlags.forEach((rf: any) => {
      if (!KNOWN_FEATURES.some((kf) => kf.key === rf.key)) {
        const local = localFlagsFallback[rf.key] || {
          enabled: rf.active,
          behavior: 'hide' as FeatureBehavior,
          customMessage: 'This feature is currently unavailable.',
        };
        result.push({
          key: rf.key,
          name: rf.name || rf.key,
          description: 'Custom PostHog flag',
          defaultValue: true,
          defaultBehavior: 'hide' as FeatureBehavior,
          defaultMessage: 'This feature is currently unavailable.',
          id: rf.id,
          enabled: rf.active,
          behavior: local.behavior,
          customMessage: local.customMessage,
          source: 'posthog',
        });
      }
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in getFeatureFlags:', error);
    const result = KNOWN_FEATURES.map((feat) => {
      const local = localFlagsFallback[feat.key] || {
        enabled: feat.defaultValue,
        behavior: feat.defaultBehavior,
        customMessage: feat.defaultMessage,
      };
      return {
        ...feat,
        enabled: local.enabled,
        behavior: local.behavior,
        customMessage: local.customMessage,
        source: 'local_fallback',
      };
    });
    res.json(result);
  }
};

/**
 * PATCH /api/v1/feature-flags/:key
 * Toggles a feature flag ON or OFF in PostHog (or creates it if not yet registered in PostHog).
 * Also updates behavior ('hide' | 'maintenance' | 'coming_soon') and customMessage.
 */
export const updateFeatureFlag = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { enabled, behavior, customMessage } = req.body;

    const existingLocal = localFlagsFallback[key] || {
      enabled: true,
      behavior: 'coming_soon' as FeatureBehavior,
      customMessage: 'Feature is currently unavailable.',
    };

    if (typeof enabled === 'boolean') {
      existingLocal.enabled = enabled;
    }
    if (behavior && ['hide', 'maintenance', 'coming_soon'].includes(behavior)) {
      existingLocal.behavior = behavior;
    }
    if (typeof customMessage === 'string') {
      existingLocal.customMessage = customMessage;
    }
    localFlagsFallback[key] = existingLocal;

    const { projectId, personalApiKey, apiHost } = getPostHogConfig();

    if (!projectId || !personalApiKey) {
      return res.json({ key, ...existingLocal, status: 'updated_locally_missing_keys' });
    }

    if (typeof enabled === 'boolean') {
      // 1. Check if flag exists in PostHog
      const listRes = await fetch(`${apiHost}/api/projects/${projectId}/feature_flags/`, {
        headers: { Authorization: `Bearer ${personalApiKey}` },
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const existing = (listData.results || []).find((f: any) => f.key === key);

        if (existing) {
          // Update existing flag in PostHog
          const patchRes = await fetch(`${apiHost}/api/projects/${projectId}/feature_flags/${existing.id}/`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${personalApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ active: enabled }),
          });

          if (!patchRes.ok) {
            console.warn(`Failed to update PostHog flag: ${patchRes.statusText}`);
          }
        } else {
          // If it does not exist in PostHog yet, create it!
          const featureMeta = KNOWN_FEATURES.find((f) => f.key === key);
          await fetch(`${apiHost}/api/projects/${projectId}/feature_flags/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${personalApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key,
              name: featureMeta?.name || key,
              active: enabled,
              filters: {
                groups: [{ properties: [], rollout_percentage: 100 }],
              },
            }),
          });
        }
      }
    }

    return res.json({ key, ...existingLocal, status: 'synced' });
  } catch (error: any) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: error.message || 'Failed to update feature flag' });
  }
};
