import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import { imageProcessor } from "./utils/imageProcessor";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { loginSchema, registerSchema, type User } from "@shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import categoriesRouter from "./routes/categories";
import { SESSION_CONFIG, FILE_LIMITS, SERVER_CONFIG } from "./config/constants";
import { pool } from "./db";
// import rateLimit from 'express-rate-limit';

import { requireAuth, requireAdmin, requireCorporate, type AuthenticatedRequest } from "./middleware/auth";

// Extend Express Session type to include custom user properties
declare module 'express-session' {
  interface SessionData {
    user?: User & {
      companyId?: number;
      companyName?: string | null;
    };
    userType?: "user" | "personnel";
    userId?: number;
  }
}

// SECURITY: Rate limiting - DISABLED FOR DEVELOPMENT
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 auth requests per windowMs
//   message: 'Too many authentication attempts, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const uploadLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 20, // limit each IP to 20 upload requests per windowMs
//   message: 'Too many file uploads, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// SECURITY: Enhanced multer configuration with validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_LIMITS.PROFILE_IMAGE,
  },
  fileFilter: (req, file, cb) => {
    // SECURITY: Enhanced file type validation
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPG ve PNG dosyaları kabul edilir'));
    }
  },
});

// SECURITY: Enhanced multer for listing images
const uploadListingImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_LIMITS.LISTING_IMAGE,
    files: FILE_LIMITS.MAX_LISTING_IMAGES
  },
  fileFilter: (req, file, cb) => {
    // SECURITY: Enhanced file type validation
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPG, PNG ve WebP dosyaları kabul edilir'));
    }
  },
});

// SECURITY: Input validation middleware
const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: any) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: result.error.errors
        });
      }
      req.body = result.data; // Use sanitized data
      next();
    } catch (error) {
      return res.status(400).json({
        error: 'Input validation failed'
      });
    }
  };
};

// SECURITY: Sanitize query parameters
const sanitizeQuery = (req: Request, res: Response, next: any) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/[<>]/g, '');
      }
    });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // SECURITY: Rate limiting - DISABLED FOR DEVELOPMENT
  // app.use('/api/', apiLimiter);
  // app.use('/api/auth/', authLimiter);
  // app.use('/api/upload/', uploadLimiter);

  // SECURITY: Input sanitization
  app.use(sanitizeQuery);

  // Performance middleware
  app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Session middleware with PostgreSQL store (production-ready)
  const PgSession = connectPgSimple(session);

  app.use(session({
    store: new PgSession({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: true, // Auto-create table if missing
    }),
    secret: SESSION_CONFIG.SECRET,
    resave: true, // Production için true - session persistence
    saveUninitialized: false,
    rolling: true, // Extend session on activity
    name: 'sessionid', // Custom session name
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Secure in production
      httpOnly: true,
      maxAge: SESSION_CONFIG.MAX_AGE,
      sameSite: 'strict' // Stricter same-site policy
    }
  }));

  // SECURITY: Enhanced step route guard with better validation
  const stepRouteGuard = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const path = req.path;
    const classifiedId = req.query.classifiedId as string;

    // Only apply to step routes
    const stepMatch = path.match(/\/create-listing\/step-(\d+)/);
    if (!stepMatch) {
      return next();
    }

    const currentStep = parseInt(stepMatch[1]);

    // SECURITY: Validate step number
    if (isNaN(currentStep) || currentStep < 1 || currentStep > 5) {
      console.log(`🚨 SERVER GUARD: Invalid step number ${currentStep}`);
      return res.redirect('/create-listing/step-1');
    }

    // Skip validation for Step1
    if (currentStep === 1) {
      console.log(`✅ SERVER GUARD: Step1 access allowed (creates new draft)`);
      return next();
    }

    // Require authentication for all steps
    if (!req.session?.user?.id) {
      console.log(`🚨 SERVER GUARD: Unauthenticated user blocked from Step ${currentStep}`);
      return res.redirect('/auth/login');
    }

    // SECURITY: Validate classifiedId format
    if (!classifiedId || !/^\d+$/.test(classifiedId)) {
      console.log(`🚨 SERVER GUARD: Invalid classifiedId format: ${classifiedId}`);
      return res.redirect('/create-listing/step-1');
    }

    try {
      const draft = await storage.getDraftListing(parseInt(classifiedId), req.session.user.id);

      if (!draft) {
        console.log(`🚨 SERVER GUARD: Draft ${classifiedId} not found for user ${req.session.user.id}`);
        return res.redirect('/create-listing/step-1');
      }

      // SECURITY: Additional ownership validation
      if (draft.userId !== req.session.user.id) {
        console.log(`🚨 SERVER GUARD: Unauthorized access attempt - User ${req.session.user.id} tried to access draft ${classifiedId} owned by ${draft.userId}`);
        return res.redirect('/create-listing/step-1');
      }

      // Step validation logic
      let shouldRedirect = false;
      let redirectStep = 1;

      if (currentStep >= 2 && !draft.step1Completed) {
        console.log(`🚨 SERVER GUARD: Step1 not completed for Step ${currentStep} access`);
        shouldRedirect = true;
        redirectStep = 1;
      }

      if (currentStep >= 3 && !draft.step2Completed) {
        console.log(`🚨 SERVER GUARD: Step2 not completed for Step ${currentStep} access`);
        shouldRedirect = true;
        redirectStep = 2;
      }

      if (currentStep >= 4 && !draft.step3Completed) {
        console.log(`🚨 SERVER GUARD: Step3 not completed for Step ${currentStep} access`);
        shouldRedirect = true;
        redirectStep = 3;
      }

      if (shouldRedirect) {
        const redirectPath = `/create-listing/step-${redirectStep}?classifiedId=${classifiedId}`;
        console.log(`🚨 SERVER GUARD: SECURITY VIOLATION - Redirecting from Step ${currentStep} to ${redirectPath}`);
        return res.redirect(redirectPath);
      }

      console.log(`✅ SERVER GUARD: Step ${currentStep} access allowed - all validations passed`);
      next();

    } catch (error) {
      console.error('🚨 SERVER GUARD ERROR:', error);
      return res.redirect('/create-listing/step-1');
    }
  };

  // Apply server-side router guard BEFORE serving static files
  app.use(stepRouteGuard);

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Serve category icons
  app.use('/uploads/category-icons', express.static(path.join(process.cwd(), 'uploads', 'category-icons')));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password, emailOrUsername } = req.body;
      const loginIdentifier = identifier || emailOrUsername;

      // Basic validation
      if (!loginIdentifier || !password) {
        return res.status(400).json({ error: "E-posta/kullanıcı adı ve şifre gerekli" });
      }

      // First try regular user authentication
      try {
        const loginData = { emailOrUsername: loginIdentifier, password };
        const user = await storage.authenticateUser(loginData);

        if (user) {
          if (!user.isActive) {
            return res.status(401).json({ error: "Hesabınız devre dışı bırakılmış" });
          }

          // Store user in session
          req.session.user = user;
          req.session.userType = "user";

          console.log('LOGIN SUCCESS - User stored in session:', { id: user.id, username: user.username });
          console.log('LOGIN SUCCESS - Session ID:', req.sessionID);

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ user: userWithoutPassword });
        }
      } catch (userAuthError: any) {
        // User authentication failed, will try personnel auth
      }

      // If regular user authentication fails and identifier is email, try personnel
      if (loginIdentifier && typeof loginIdentifier === 'string' && loginIdentifier.includes("@")) {
        try {
          const personnelAuth = await storage.authenticateAuthorizedPersonnel(loginIdentifier, password);

          if (personnelAuth) {

            // Store personnel info in session
            req.session.user = {
              id: personnelAuth.personnel.id,
              username: personnelAuth.personnel.email,
              password: '', // Don't store actual password
              email: personnelAuth.personnel.email,
              firstName: personnelAuth.personnel.firstName,
              lastName: personnelAuth.personnel.lastName,
              companyName: personnelAuth.company.companyName,
              profileImage: null,
              mobilePhone: personnelAuth.personnel.mobilePhone,
              whatsappNumber: personnelAuth.personnel.whatsappNumber,
              businessPhone: null,
              role: "authorized_personnel",
              isActive: personnelAuth.personnel.isActive,
              createdAt: personnelAuth.personnel.createdAt,
              updatedAt: personnelAuth.personnel.updatedAt,
              companyId: personnelAuth.company.id,
            };
            req.session.userType = "personnel";

            const { password: _, ...personnelData } = req.session.user;
            return res.json({ user: personnelData });
          }
        } catch (personnelAuthError: any) {
          // Personnel authentication failed, will try fallback
        }
      }

      // If both authentications fail
      return res.status(401).json({ error: "E-posta/kullanıcı adı veya şifre hatalı" });
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Request body:", req.body);
      console.error("Error stack:", error.stack);
      res.status(500).json({ error: "Giriş işlemi sırasında hata oluştu" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerData = registerSchema.parse(req.body);
      const user = await storage.registerUser(registerData);

      // Store user in session
      req.session.user = user;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Kayıt işlemi başarısız" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Çıkış işlemi başarısız" });
        }
        res.clearCookie('sessionid', {
          secure: false,
          httpOnly: true,
          sameSite: 'lax'
        });
        res.json({ message: "Başarıyla çıkış yapıldı" });
      });
    } else {
      res.json({ message: "Başarıyla çıkış yapıldı" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const sessionUser = req.session?.user;
    console.log('AUTH/ME - Session user:', sessionUser ? { id: sessionUser.id, username: sessionUser.username } : 'none');
    console.log('AUTH/ME - Session ID:', req.sessionID);
    console.log('AUTH/ME - Session store:', req.session ? 'exists' : 'none');

    if (!sessionUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // If this is an authorized personnel session, return the session data directly
      if (req.session?.userType === "personnel") {
        const { password, ...userWithoutPassword } = sessionUser;
        return res.json(userWithoutPassword);
      }

      // For regular users, get fresh user data from database
      const freshUser = await storage.getUserById(sessionUser.id);
      if (freshUser) {
        // Update session with fresh data
        req.session.user = freshUser;
        const { password, ...userWithoutPassword } = freshUser;
        res.json(userWithoutPassword);
      } else {
        res.status(401).json({ error: "User not found" });
      }
    } catch (error: any) {
      console.error('AUTH/ME Error:', error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Protected admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ error: "Kullanıcılar alınamadı" });
    }
  });

  // Public profile route
  app.get("/api/users/profile/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Don't return sensitive information
      const { password, ...publicUser } = user;
      res.json(publicUser);
    } catch (error) {
      res.status(500).json({ error: "Sunucu hatası" });
    }
  });

  // Update user contact information
  app.patch("/api/user/contact", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { mobilePhone, whatsappNumber, businessPhone } = req.body;
      const userId = req.session.user!.id;

      // Get current user to check role
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      const updatedUser = await storage.updateUser(userId, {
        // Contact information (available for all users)
        mobilePhone: mobilePhone || null,
        whatsappNumber: whatsappNumber || null,
        // Business phone only for corporate users
        ...(currentUser.role === "corporate" && { businessPhone: businessPhone || null }),
      });

      // Update session with fresh user data
      req.session.user = updatedUser;

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "İletişim bilgileri güncellenirken hata oluştu" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { firstName, lastName, companyName, username } = req.body;
      const userId = req.session.user!.id;

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({ error: "Ad ve soyad zorunludur" });
      }

      // Get current user to check role
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Validate username for corporate users
      if (currentUser.role === "corporate" && username) {
        if (username.length < 3) {
          return res.status(400).json({ error: "Kullanıcı adı en az 3 karakter olmalı" });
        }

        // Check if username is already taken by another user
        if (username !== currentUser.username) {
          const existingUsername = await storage.getUserByUsername(username);
          if (existingUsername && existingUsername.id !== userId) {
            return res.status(400).json({ error: "Bu kullanıcı adı zaten kullanılıyor" });
          }
        }
      }

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        companyName: companyName || null,
        ...(currentUser.role === "corporate" && username && { username }),
      });

      // Update session with fresh user data
      req.session.user = updatedUser;

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Profil güncellenirken hata oluştu" });
    }
  });

  // Authorized Personnel Management API endpoints

  // Get authorized personnel for current corporate user
  app.get("/api/authorized-personnel", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;

      // Verify user is corporate
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Bu özellik sadece kurumsal hesaplar için geçerlidir" });
      }

      const personnelList = await storage.getAuthorizedPersonnel(userId);
      res.json(personnelList);
    } catch (error) {
      res.status(500).json({ error: "Yetkili kişiler alınırken hata oluştu" });
    }
  });

  // Create new authorized personnel
  app.post("/api/authorized-personnel", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { firstName, lastName, email, password, mobilePhone, whatsappNumber } = req.body;

      // Verify user is corporate
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Bu özellik sadece kurumsal hesaplar için geçerlidir" });
      }

      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Ad, soyad, e-posta ve şifre zorunludur" });
      }

      // Check if email already exists (both in users and authorized personnel)
      const existingUser = await storage.getUserByEmail(email);
      const existingPersonnel = await storage.getAuthorizedPersonnelByEmail(email);

      if (existingUser || existingPersonnel) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor" });
      }

      const personnel = await storage.createAuthorizedPersonnel(userId, {
        firstName,
        lastName,
        email,
        password,
        mobilePhone: mobilePhone || null,
        whatsappNumber: whatsappNumber || null,
        isActive: true,
      });

      // Don't return password
      const { password: _, ...personnelData } = personnel;
      res.status(201).json(personnelData);
    } catch (error) {
      res.status(500).json({ error: "Yetkili kişi oluşturulurken hata oluştu" });
    }
  });

  // Update authorized personnel
  app.patch("/api/authorized-personnel/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const personnelId = parseInt(req.params.id);
      const { firstName, lastName, email, password, mobilePhone, whatsappNumber } = req.body;

      // Verify user is corporate
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Bu özellik sadece kurumsal hesaplar için geçerlidir" });
      }

      // Verify personnel belongs to current user
      const personnel = await storage.getAuthorizedPersonnelById(personnelId);
      if (!personnel || personnel.companyUserId !== userId) {
        return res.status(404).json({ error: "Yetkili kişi bulunamadı" });
      }

      // Check if email already exists (excluding current personnel)
      if (email && email !== personnel.email) {
        const existingUser = await storage.getUserByEmail(email);
        const existingPersonnel = await storage.getAuthorizedPersonnelByEmail(email);

        if (existingUser || (existingPersonnel && existingPersonnel.id !== personnelId)) {
          return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor" });
        }
      }

      const updatedPersonnel = await storage.updateAuthorizedPersonnel(personnelId, {
        firstName,
        lastName,
        email,
        ...(password && { password }),
        mobilePhone: mobilePhone || null,
        whatsappNumber: whatsappNumber || null,
      });

      // Don't return password
      const { password: _, ...personnelData } = updatedPersonnel;
      res.json(personnelData);
    } catch (error) {
      res.status(500).json({ error: "Yetkili kişi güncellenirken hata oluştu" });
    }
  });

  // Toggle authorized personnel active status
  app.patch("/api/authorized-personnel/:id/toggle-status", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const personnelId = parseInt(req.params.id);
      const { isActive } = req.body;

      // Verify user is corporate
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Bu özellik sadece kurumsal hesaplar için geçerlidir" });
      }

      // Verify personnel belongs to current user
      const personnel = await storage.getAuthorizedPersonnelById(personnelId);
      if (!personnel || personnel.companyUserId !== userId) {
        return res.status(404).json({ error: "Yetkili kişi bulunamadı" });
      }

      const updatedPersonnel = await storage.updateAuthorizedPersonnel(personnelId, {
        isActive,
      });

      // Don't return password
      const { password: _, ...personnelData } = updatedPersonnel;
      res.json(personnelData);
    } catch (error) {
      res.status(500).json({ error: "Yetkili durumu değiştirilirken hata oluştu" });
    }
  });

  // Delete authorized personnel
  app.delete("/api/authorized-personnel/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const personnelId = parseInt(req.params.id);

      // Verify user is corporate
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Bu özellik sadece kurumsal hesaplar için geçerlidir" });
      }

      // Verify personnel belongs to current user
      const personnel = await storage.getAuthorizedPersonnelById(personnelId);
      if (!personnel || personnel.companyUserId !== userId) {
        return res.status(404).json({ error: "Yetkili kişi bulunamadı" });
      }

      await storage.deleteAuthorizedPersonnel(personnelId);
      res.json({ message: "Yetkili kişi silindi" });
    } catch (error) {
      res.status(500).json({ error: "Yetkili kişi silinirken hata oluştu" });
    }
  });

  // Change password
  app.patch("/api/user/change-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user!.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Mevcut şifre ve yeni şifre gerekli" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Yeni şifre en az 6 karakter olmalı" });
      }

      // Get current user
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Mevcut şifre hatalı" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(userId, { password: hashedNewPassword });

      res.json({ message: "Şifre başarıyla değiştirildi" });
    } catch (error) {
      res.status(500).json({ error: "Şifre değiştirilirken hata oluştu" });
    }
  });

  // Change user email
  app.patch("/api/user/change-email", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { email } = req.body;
      const userId = req.session.user!.id;

      // Validate email format
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Geçerli bir e-posta adresi giriniz" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor" });
      }

      const updatedUser = await storage.updateUser(userId, { email });

      // Update session with fresh user data
      req.session.user = updatedUser;

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "E-posta güncellenirken hata oluştu" });
    }
  });

  // Upload profile image
  app.post("/api/user/profile-image", requireAuth, upload.single("profileImage"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "Profil resmi gerekli" });
      }

      // Get current user to check role
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Only corporate users can upload profile images
      if (currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Sadece kurumsal kullanıcılar profil resmi yükleyebilir" });
      }

      // Create user-specific uploads directory if it doesn't exist
      const userUploadsDir = path.join(process.cwd(), "uploads", "users", userId.toString(), "profile-images");
      if (!fs.existsSync(userUploadsDir)) {
        fs.mkdirSync(userUploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `profile_${Date.now()}${fileExtension}`;
      const filePath = path.join(userUploadsDir, fileName);

      // Process and compress image
      await sharp(file.buffer)
        .resize(400, 400, { fit: "cover", position: "center" })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      // Delete old profile image if exists
      if (currentUser.profileImage) {
        const oldImagePath = path.join(process.cwd(), currentUser.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update user with new profile image URL
      const profileImageUrl = `/uploads/users/${userId}/profile-images/${fileName}`;
      const updatedUser = await storage.updateUser(userId, { profileImage: profileImageUrl });

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ ...userWithoutPassword, profileImage: profileImageUrl });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ error: "Profil resmi yüklenirken hata oluştu" });
    }
  });

  // Delete profile image
  app.delete("/api/user/profile-image", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session.user!.id;

      // Get current user
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Only corporate users can delete profile images
      if (currentUser.role !== "corporate") {
        return res.status(403).json({ error: "Sadece kurumsal kullanıcılar profil resmi silebilir" });
      }

      // Delete physical file if exists
      if (currentUser.profileImage) {
        const imagePath = path.join(process.cwd(), currentUser.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Update user to remove profile image URL
      const updatedUser = await storage.updateUser(userId, { profileImage: null });

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile image delete error:", error);
      res.status(500).json({ error: "Profil resmi silinirken hata oluştu" });
    }
  });

  // Mount categories routes
  app.use('/api/categories', categoriesRouter);

  // Locations API routes

  // Get all locations in tree structure
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocationsTree();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Lokasyonlar alınırken hata oluştu" });
    }
  });

  // Get child locations by parent ID
  app.get("/api/locations/:parentId/children", async (req, res) => {
    try {
      const parentId = parseInt(req.params.parentId);
      const locations = await storage.getChildLocations(parentId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Alt lokasyonlar alınırken hata oluştu" });
    }
  });

  // Get location by ID
  app.get("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await storage.getLocationById(id);

      if (!location) {
        return res.status(404).json({ error: "Lokasyon bulunamadı" });
      }

      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Lokasyon alınırken hata oluştu" });
    }
  });

  // Get location breadcrumbs
  app.get("/api/locations/:id/breadcrumbs", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const breadcrumbs = await storage.getLocationBreadcrumbs(id);
      res.json(breadcrumbs);
    } catch (error) {
      res.status(500).json({ error: "Breadcrumb alınırken hata oluştu" });
    }
  });

  // Create location
  app.post("/api/locations", requireAdmin, async (req, res) => {
    try {
      const { name, type, parentId, sortOrder } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: "Lokasyon adı ve tipi gereklidir" });
      }

      const location = await storage.createLocation({
        name,
        type,
        parentId: parentId || null,
        sortOrder: sortOrder || 0,
        isActive: true,
      });

      res.status(201).json(location);
    } catch (error) {
      res.status(500).json({ error: "Lokasyon oluşturulurken hata oluştu" });
    }
  });

  // Update location
  app.patch("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const location = await storage.updateLocation(id, updates);
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Lokasyon güncellenirken hata oluştu" });
    }
  });

  // Delete location
  app.delete("/api/locations/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await storage.deleteLocation(id);
      res.json({ message: "Lokasyon silindi" });
    } catch (error) {
      res.status(500).json({ error: "Lokasyon silinirken hata oluştu" });
    }
  });

  // Reorder locations
  app.patch("/api/locations-reorder", requireAdmin, async (req, res) => {
    try {
      const { parentId, locationIds } = req.body;

      if (!Array.isArray(locationIds)) {
        return res.status(400).json({ error: "locationIds array gerekli" });
      }

      // Convert string IDs to numbers if needed
      const numericLocationIds = locationIds.map(id => parseInt(String(id), 10));

      // Validate all IDs are valid numbers
      if (numericLocationIds.some(id => isNaN(id) || id <= 0)) {
        return res.status(400).json({ error: "Geçersiz lokasyon ID'leri" });
      }

      await storage.reorderLocations(parentId, numericLocationIds);
      res.json({ message: "Lokasyon sıralaması güncellendi" });
    } catch (error) {

      res.status(500).json({ error: "Lokasyon sıralaması güncellenirken hata oluştu" });
    }
  });

  // Location Settings API routes

  // Get location settings
  app.get("/api/location-settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getLocationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Lokasyon ayarları alınırken hata oluştu" });
    }
  });

  // Update location settings
  app.patch("/api/location-settings", requireAdmin, async (req, res) => {
    try {

      const updates = req.body;
      const settings = await storage.updateLocationSettings(updates);

      res.json(settings);
    } catch (error) {

      res.status(500).json({ error: `Lokasyon ayarları güncellenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` });
    }
  });

  // Get visible location settings for public use (without admin check)
  app.get("/api/location-settings/public", async (req, res) => {
    try {
      const settings = await storage.getLocationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Lokasyon ayarları alınırken hata oluştu" });
    }
  });

  // Draft Listings API routes

  // Get draft listing by ID (Authentication required + ownership check)
  app.get("/api/draft-listings/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      const draft = await storage.getDraftListing(id);

      if (!draft) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      // Verify ownership - user can only access their own drafts
      if (draft.userId !== userId) {
        return res.status(403).json({ error: "Bu ilan taslağına erişim yetkiniz yok" });
      }

      res.json(draft);
    } catch (error) {
      res.status(500).json({ error: "İlan taslağı alınırken hata oluştu" });
    }
  });

  // Get user's draft listings
  app.get("/api/draft-listings", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

      if (categoryId) {
        // Get draft for specific category
        const draft = await storage.getUserDraftForCategory(userId, categoryId);
        res.json(draft ? [draft] : []);
      } else {
        // Get all user drafts
        const drafts = await storage.getUserDraftListings(userId);
        res.json(drafts);
      }
    } catch (error) {
      res.status(500).json({ error: "İlan taslakları alınırken hata oluştu" });
    }
  });

  // Create new draft listing
  app.post("/api/draft-listings", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      // CRITICAL FIX: Delete existing drafts before creating new one
      const existingDrafts = await storage.getUserDraftListings(userId);
      console.log(`📊 Kullanıcı ${userId} için ${existingDrafts.length} adet mevcut draft bulundu`);

      if (existingDrafts.length > 0) {
        for (const existingDraft of existingDrafts) {
          await storage.deleteDraftListing(existingDraft.id);
          console.log(`🗑️ Eski draft silindi: ID ${existingDraft.id} (User ${userId})`);
        }
        console.log(`✅ Toplam ${existingDrafts.length} adet eski draft silme işlemi tamamlandı`);
      }

      const draft = await storage.createDraftListing({
        userId,
        status: "draft"
      });

      console.log(`✅ Yeni draft oluşturuldu: ID ${draft.id} (User ${userId})`);
      res.status(201).json(draft);
    } catch (error) {
      console.error('Draft oluşturma hatası:', error);
      res.status(500).json({ error: "İlan taslağı oluşturulurken hata oluştu" });
    }
  });

  // Update draft listing
  app.patch("/api/draft-listings/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      const updates = req.body;
      const draft = await storage.updateDraftListing(id, updates);
      res.json(draft);
    } catch (error) {
      res.status(500).json({ error: "İlan taslağı güncellenirken hata oluştu" });
    }
  });

  // Delete draft listing
  app.delete("/api/draft-listings/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      await storage.deleteDraftListing(id);
      res.json({ message: "İlan taslağı silindi" });
    } catch (error) {
      res.status(500).json({ error: "İlan taslağı silinirken hata oluştu" });
    }
  });

  // Publish draft listing
  app.post("/api/draft-listings/:id/publish", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      const publishedListing = await storage.publishDraftListing(id);
      res.json(publishedListing);
    } catch (error) {
      res.status(500).json({ error: "İlan yayınlanırken hata oluştu" });
    }
  });

  // Step completion tracking endpoints

  // Mark step as completed
  app.post("/api/draft-listings/:id/step/:step/complete", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const step = parseInt(req.params.step);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      if (step < 1 || step > 4) {
        return res.status(400).json({ error: "Geçersiz step numarası (1-4 arası olmalı)" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      // SERVER-SIDE VALIDATION REMOVED
      // Client-side validation handles all form validation

      const updatedDraft = await storage.markStepCompleted(id, step);
      res.json(updatedDraft);
    } catch (error) {
      console.error('Step completion error:', error);
      res.status(500).json({ error: "Step completion güncellenirken hata oluştu" });
    }
  });

  // Mark step as incomplete
  app.post("/api/draft-listings/:id/step/:step/incomplete", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const step = parseInt(req.params.step);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      if (step < 1 || step > 4) {
        return res.status(400).json({ error: "Geçersiz step numarası (1-4 arası olmalı)" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      const updatedDraft = await storage.markStepIncomplete(id, step);
      res.json(updatedDraft);
    } catch (error) {
      res.status(500).json({ error: "Step completion güncellenirken hata oluştu" });
    }
  });

  // Get step completion status
  app.get("/api/draft-listings/:id/steps", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.session?.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Kullanıcı girişi gerekli" });
      }

      // Verify ownership
      const existingDraft = await storage.getDraftListing(id);
      if (!existingDraft || existingDraft.userId !== userId) {
        return res.status(404).json({ error: "İlan taslağı bulunamadı" });
      }

      const stepStatus = await storage.getStepCompletionStatus(id);
      res.json(stepStatus);
    } catch (error) {
      res.status(500).json({ error: "Step durumu alınırken hata oluştu" });
    }
  });

  // Upload listing images (with proper authentication)
  app.post("/api/upload/images", requireAuth, uploadListingImages.array('images'), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.user!.id; // Use real authenticated user ID
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Hiç dosya yüklenmedi" });
      }

      const uploadedImages = [];

      for (const file of files) {
        const imageId = uuidv4();
        const extension = path.extname(file.originalname);
        const filename = `${imageId}${extension}`;

        // Create user directory structure
        const userDir = path.join(process.cwd(), 'uploads', 'users', userId.toString(), 'temp-listings');
        
        // Ensure directory exists
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }
        
        const imagePath = path.join(userDir, filename);

        try {
          const processedImage = await imageProcessor.processImage(
            file.buffer,
            imagePath,
            {
              maxWidth: 1920,
              maxHeight: 1080,
              quality: 85,
              watermark: true,
              generateThumbnail: true
            }
          );

          uploadedImages.push({
            id: imageId,
            filename: processedImage.filename,
            url: `/uploads/users/${userId}/temp-listings/${processedImage.filename}`,
            thumbnail: processedImage.thumbnailPath 
              ? `/uploads/users/${userId}/temp-listings/${path.basename(processedImage.thumbnailPath)}`
              : undefined,
            size: processedImage.processedSize,
            originalSize: processedImage.originalSize
          });
        } catch (processError) {
          console.error('Image processing error:', processError);
          continue; // Skip this image but continue with others
        }
      }

      if (uploadedImages.length === 0) {
        return res.status(500).json({ error: "Hiçbir resim işlenemedi" });
      }

      res.json({ images: uploadedImages });
    } catch (error) {

      res.status(500).json({ error: "Dosya yükleme hatası" });
    }
  });



  // Delete uploaded image (with proper authentication)
  app.delete("/api/upload/images/:imageId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.user!.id; // Use real authenticated user ID
      const imageId = req.params.imageId;

      // Find and delete the image file
      const userDir = path.join(process.cwd(), 'uploads', 'users', userId.toString(), 'temp-listings');
      
      // Check if directory exists
      if (!fs.existsSync(userDir)) {
        return res.status(404).json({ error: "Kullanıcı dizini bulunamadı" });
      }
      
      const files = await fs.promises.readdir(userDir).catch(() => []);

      const imageFile = files.find(file => file.startsWith(imageId));
      if (imageFile) {
        const imagePath = path.join(userDir, imageFile);
        await imageProcessor.deleteImage(imagePath);
      }

      res.json({ message: "Resim silindi" });
    } catch (error) {

      res.status(500).json({ error: "Resim silme hatası" });
    }
  });
  app.get("/api/location-settings/public", async (req, res) => {
    try {
      const settings = await storage.getLocationSettings();
      res.json({
        showCountry: settings.showCountry,
        showCity: settings.showCity,
        showDistrict: settings.showDistrict,
        showNeighborhood: settings.showNeighborhood,
      });
    } catch (error) {
      res.status(500).json({ error: "Lokasyon ayarları alınırken hata oluştu" });
    }
  });

  // Category Packages routes moved to categories router

app.patch("/api/category-packages/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz paket ID" });
    }

    const { updateCategoryPackageSchema } = await import("@shared/schema");
    const validatedData = updateCategoryPackageSchema.parse(req.body);
    const categoryPackage = await storage.updateCategoryPackage(id, validatedData);
    res.json(categoryPackage);
  } catch (error: any) {
    console.error("Error updating category package:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Geçersiz veri", details: error.errors });
    }
    res.status(500).json({ error: "Kategori paketi güncellenemedi" });
  }
});

app.delete("/api/category-packages/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz paket ID" });
    }

    await storage.deleteCategoryPackage(id);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error deleting category package:", error);
    res.status(500).json({ error: "Kategori paketi silinemedi" });
  }
});

app.patch("/api/categories/:categoryId/packages/reorder", requireAdmin, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Geçersiz kategori ID" });
    }

    const { packageIds } = req.body;
    if (!Array.isArray(packageIds) || packageIds.some(id => typeof id !== 'number')) {
      return res.status(400).json({ error: "Geçersiz paket ID'leri" });
    }

    await storage.reorderCategoryPackages(categoryId, packageIds);
    res.status(204).send();
  } catch (error: any) {
    console.error("Error reordering category packages:", error);
    res.status(500).json({ error: "Kategori paketleri sıralanamadı" });
  }
});

// Doping Packages routes
  app.get("/api/doping-packages", async (req, res) => {
    try {
      const packages = await storage.getDopingPackages();
      res.json(packages);
    } catch (error: any) {
      console.error("Error fetching doping packages:", error);
      res.status(500).json({ error: "Doping paketleri alınırken hata oluştu" });
    }
  });

  app.get("/api/doping-packages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Geçersiz paket ID" });
      }

      const dopingPackage = await storage.getDopingPackageById(id);
      if (!dopingPackage) {
        return res.status(404).json({ error: "Doping paketi bulunamadı" });
      }

      res.json(dopingPackage);
    } catch (error: any) {
      console.error("Error fetching doping package:", error);
      res.status(500).json({ error: "Doping paketi alınırken hata oluştu" });
    }
  });

  app.post("/api/doping-packages", requireAdmin, async (req, res) => {
    try {
      const dopingPackage = await storage.createDopingPackage(req.body);
      res.status(201).json(dopingPackage);
    } catch (error: any) {
      console.error("Error creating doping package:", error);
      if (error.message?.includes("unique")) {
        res.status(400).json({ error: "Bu isimde bir paket zaten mevcut" });
      } else {
        res.status(400).json({ error: "Doping paketi oluşturulurken hata oluştu" });
      }
    }
  });

  app.patch("/api/doping-packages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Geçersiz paket ID" });
      }

      const dopingPackage = await storage.updateDopingPackage(id, req.body);
      res.json(dopingPackage);
    } catch (error: any) {
      console.error("Error updating doping package:", error);
      if (error.message?.includes("unique")) {
        res.status(400).json({ error: "Bu isimde bir paket zaten mevcut" });
      } else {
        res.status(400).json({ error: "Doping paketi güncellenirken hata oluştu" });
      }
    }
  });

  app.delete("/api/doping-packages/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Geçersiz paket ID" });
      }

      await storage.deleteDopingPackage(id);
      res.json({ message: "Doping paketi başarıyla silindi" });
    } catch (error: any) {
      console.error("Error deleting doping package:", error);
      res.status(500).json({ error: "Doping paketi silinirken hata oluştu" });
    }
  });

  app.patch("/api/doping-packages/reorder", requireAdmin, async (req, res) => {
    try {
      const { packageIds } = req.body;
      if (!Array.isArray(packageIds)) {
        return res.status(400).json({ error: "packageIds array gerekli" });
      }

      await storage.reorderDopingPackages(packageIds);
      res.json({ message: "Doping paketleri başarıyla yeniden sıralandı" });
    } catch (error: any) {
      console.error("Error reordering doping packages:", error);
      res.status(500).json({ error: "Doping paketleri sıralanırken hata oluştu" });
    }
  });

  // Free listing settings routes
  app.patch("/api/categories/:categoryId/free-listing-settings", requireAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const { freeListingLimitIndividual, freeResetPeriodIndividual, freeListingLimitCorporate, freeResetPeriodCorporate, applyToSubcategories } = req.body;

      // Validation
      if (typeof freeListingLimitIndividual !== "number" || freeListingLimitIndividual < 0) {
        return res.status(400).json({ error: "Individual free listing limit must be a non-negative number" });
      }

      if (typeof freeListingLimitCorporate !== "number" || freeListingLimitCorporate < 0) {
        return res.status(400).json({ error: "Corporate free listing limit must be a non-negative number" });
      }

      if (!["monthly", "yearly", "once"].includes(freeResetPeriodIndividual)) {
        return res.status(400).json({ error: "Invalid individual reset period" });
      }

      if (!["monthly", "yearly", "once"].includes(freeResetPeriodCorporate)) {
        return res.status(400).json({ error: "Invalid corporate reset period" });
      }

      const updatedCategory = await storage.updateCategory(categoryId, {
        freeListingLimitIndividual,
        freeResetPeriodIndividual,
        freeListingLimitCorporate,
        freeResetPeriodCorporate,
        applyToSubcategories: applyToSubcategories || false,
      });

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating free listing settings:", error);
      res.status(500).json({ error: "Failed to update free listing settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
