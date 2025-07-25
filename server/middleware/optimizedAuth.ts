import type { Request, Response, NextFunction } from "express";
import { sessionCache } from "../utils/sessionCache";

// Extended request interface for authentication
export interface AuthenticatedRequest extends Request {
  session: any;
  user?: any;
}

// Cache for user data to reduce database lookups
const userCache = new Map<number, { user: any; expiresAt: number }>();
const USER_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

// Optimized authentication middleware
export const optimizedAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const sessionId = req.sessionID;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Session required" });
  }

  try {
    // Try to get session from cache first
    let sessionData = sessionCache.get(sessionId);
    
    if (!sessionData) {
      // Fall back to database session store
      // The session middleware already loaded session data
      sessionData = req.session;
      
      if (sessionData) {
        // Cache the session data for future requests
        sessionCache.set(sessionId, sessionData);
      }
    } else {
      // Update request session with cached data
      req.session = sessionData;
    }

    if (!sessionData?.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check user cache to avoid database lookup
    const userId = sessionData.user.id;
    const now = Date.now();
    const cachedUser = userCache.get(userId);
    
    if (cachedUser && now < cachedUser.expiresAt) {
      req.user = cachedUser.user;
      return next();
    }

    // If user not in cache or expired, proceed with session user data
    // (In production, you might want to validate user still exists in DB)
    req.user = sessionData.user;
    
    // Cache user data
    userCache.set(userId, {
      user: sessionData.user,
      expiresAt: now + USER_CACHE_TTL
    });
    
    next();
  } catch (error) {
    console.error('Optimized auth error:', error);
    res.status(500).json({ error: "Authentication system error" });
  }
};

// Optimized admin check middleware
export const optimizedRequireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // First run auth check
  optimizedAuth(req, res, (err?: any) => {
    if (err) {
      return;
    }

    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  });
};

// Session invalidation helper
export const invalidateUserSession = (userId: number): void => {
  userCache.delete(userId);
  // Note: Session cache invalidation would require sessionId, 
  // which we don't have here. Cache TTL will handle cleanup.
};

// Cleanup function for graceful shutdown
export const cleanupAuthCache = (): void => {
  userCache.clear();
  sessionCache.clear();
};

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [userId, cached] of Array.from(userCache.entries())) {
    if (now > cached.expiresAt) {
      userCache.delete(userId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`UserCache: Cleaned ${cleaned} expired entries`);
  }
}, 2 * 60 * 1000); // Every 2 minutes