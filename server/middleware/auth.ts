import { Request, Response, NextFunction } from "express";

// Extend Request type to include session
declare global {
  namespace Express {
    interface Request {
      session: any;
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.session.userId = req.session.user.id; // Add userId for backward compatibility
  next();
};

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};