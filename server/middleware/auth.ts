import { Request, Response, NextFunction } from "express";
import type { User } from "@shared/schema";
import session from "express-session";

// Extended Request interface for typed session access
export interface AuthenticatedRequest extends Request {
  session: session.Session & {
    user?: User & {
      companyId?: number;
      companyName?: string | null;
    };
    userType?: "user" | "personnel";
    userId?: number;
  };
}

// Middleware to check if user is authenticated
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
  }
  req.session.userId = req.session.user.id; // Add userId for backward compatibility
  next();
};

// Middleware to check if user is admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin yetkisi gerekli" });
  }
  next();
};

// Middleware to check if user is corporate
export const requireCorporate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session?.user || (req.session.user as any).membershipType !== 'corporate') {
    return res.status(403).json({ error: "Kurumsal üyelik gerekli" });
  }
  next();
};