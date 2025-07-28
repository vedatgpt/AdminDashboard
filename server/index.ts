import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from 'express-session';
import helmet from 'helmet';
import crypto from 'crypto';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { type User } from "@shared/schema";

// Extend the session types to match routes.ts
declare module "express-session" {
  interface SessionData {
    user?: User & {
      companyId?: number;
      companyName?: string | null;
    };
    userType?: "user" | "personnel";
    userId?: number;
    csrfToken?: string;
  }
}

const app = express();

// SECURITY: Basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// SECURITY: Rate limiting - DISABLED FOR DEVELOPMENT
// const limiter = rateLimit({
//   windowMs: 5 * 60 * 1000, // 5 minutes
//   max: 1000, // increased from 100 to 1000 for development
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// SECURITY: Enhanced session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'sessionId', // Don't use default 'connect.sid'
}));

// SECURITY: CSRF Protection Middleware - TEMPORARILY DISABLED FOR DEVELOPMENT
// app.use((req, res, next) => {
//   // Generate CSRF token for new sessions
//   if (!req.session.csrfToken) {
//     req.session.csrfToken = crypto.randomBytes(32).toString('hex');
//   }
  
//   // Add CSRF token to response headers for client access
//   res.setHeader('X-CSRF-Token', req.session.csrfToken);
  
//   // Validate CSRF token for state-changing requests
//   if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
//     const token = (req.headers['x-csrf-token'] as string) || (req.headers['x-xsrf-token'] as string);
//     if (!token || token !== req.session.csrfToken) {
//       return res.status(403).json({ error: 'CSRF token validation failed' });
//     }
//   }
  
//   next();
// });

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// SECURITY: Request logging with sanitization
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // SECURITY: Sanitize sensitive data from logs
        const sanitizedResponse = { ...capturedJsonResponse };
        if (sanitizedResponse.password) sanitizedResponse.password = '[REDACTED]';
        if (sanitizedResponse.token) sanitizedResponse.token = '[REDACTED]';
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // SECURITY: Production error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // SECURITY: Don't leak internal errors in production
    const message = process.env.NODE_ENV === 'production' 
      ? (status === 500 ? 'Internal Server Error' : err.message || 'An error occurred')
      : err.message || "Internal Server Error";

    // SECURITY: Log errors but don't expose them
    if (status === 500) {
      console.error('Server Error:', err);
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
