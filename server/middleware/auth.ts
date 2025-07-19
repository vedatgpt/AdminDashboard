// Middleware to check if user is authenticated
export const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.session.userId = req.session.user.id; // Add userId for backward compatibility
  next();
};

// Middleware to check if user is admin
export const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Middleware to check if user is corporate
export const requireCorporate = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'corporate') {
    return res.status(403).json({ error: "Corporate access required" });
  }
  next();
};