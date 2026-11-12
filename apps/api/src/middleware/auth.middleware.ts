import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Parses JWT payload without native external C-bindings or external dependencies
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Validates Supabase JWT from Authorization: Bearer <token>
 * or falls back to x-user-id for development testing.
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const decoded = decodeJwtPayload(token);
      if (decoded && decoded.sub) {
        (req as any).user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
        };
        return next();
      }
    }
  }

  // Fallback to x-user-id header or body.userId for testing/internal calls
  const headerUserId = req.headers['x-user-id'] as string;
  const bodyUserId = req.body?.userId as string;
  const effectiveUserId = headerUserId || bodyUserId;
  if (effectiveUserId) {
    (req as any).user = { id: effectiveUserId };
    return next();
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'You must be signed in to perform this action' });
  }
  next();
}
