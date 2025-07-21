import express, { type Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import { imageProcessor } from "./utils/imageProcessor";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import session from "express-session";
import categoriesRouter from "./routes/categories";

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.session.userId = req.session.user.id; // Add userId for backward compatibility
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'));
    }
  },
});

// Configure multer for listing images (10MB limit)
const uploadListingImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true, // Session'ları her istekte kaydet
    saveUninitialized: false,
    rolling: true, // Her istekte cookie'yi yenile
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün - daha uzun süre
    }
  }));

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
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return res.json({ user: userWithoutPassword });
        }
      } catch (userAuthError) {
        console.log("Regular user authentication failed for:", loginIdentifier);
      }

      // If regular user authentication fails and identifier is email, try personnel
      if (loginIdentifier && typeof loginIdentifier === 'string' && loginIdentifier.includes("@")) {
        try {
          const personnelAuth = await storage.authenticateAuthorizedPersonnel(loginIdentifier, password);
          
          if (personnelAuth) {
            console.log("Personnel authentication successful for:", loginIdentifier);
            // Store personnel info in session
            req.session.user = {
              id: personnelAuth.personnel.id,
              username: personnelAuth.personnel.email,
              email: personnelAuth.personnel.email,
              firstName: personnelAuth.personnel.firstName,
              lastName: personnelAuth.personnel.lastName,
              role: "authorized_personnel",
              companyName: personnelAuth.company.companyName,
              companyId: personnelAuth.company.id,
              mobilePhone: personnelAuth.personnel.mobilePhone,
              whatsappNumber: personnelAuth.personnel.whatsappNumber,
              isActive: personnelAuth.personnel.isActive,
              createdAt: personnelAuth.personnel.createdAt,
              updatedAt: personnelAuth.personnel.updatedAt,
            };
            req.session.userType = "personnel";

            const { password: _, ...personnelData } = req.session.user;
            return res.json({ user: personnelData });
          }
        } catch (personnelAuthError) {
          console.log("Personnel authentication failed for:", loginIdentifier);
        }
      }

      // If both authentications fail
      return res.status(401).json({ error: "E-posta/kullanıcı adı veya şifre hatalı" });
    } catch (error) {
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
        res.clearCookie('connect.sid');
        res.json({ message: "Başarıyla çıkış yapıldı" });
      });
    } else {
      res.json({ message: "Başarıyla çıkış yapıldı" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const sessionUser = req.session?.user;
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
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Protected admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    // This would be implemented later for admin user management
    res.json({ users: [] });
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
  app.patch("/api/user/contact", requireAuth, async (req, res) => {
    try {
      const { mobilePhone, whatsappNumber, businessPhone } = req.body;
      const userId = req.session.userId;

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
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { firstName, lastName, companyName, username } = req.body;
      const userId = req.session.userId;

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
  app.get("/api/authorized-personnel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
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
  app.post("/api/authorized-personnel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app.patch("/api/authorized-personnel/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app.patch("/api/authorized-personnel/:id/toggle-status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app.delete("/api/authorized-personnel/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app.patch("/api/user/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.userId;

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
  app.patch("/api/user/change-email", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      const userId = req.session.userId;

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
  app.post("/api/user/profile-image", requireAuth, upload.single("profileImage"), async (req, res) => {
    try {
      const userId = req.session.userId;
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
  app.delete("/api/user/profile-image", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;

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
      console.log('Location settings update request:', req.body);
      const updates = req.body;
      const settings = await storage.updateLocationSettings(updates);
      console.log('Location settings updated successfully:', settings);
      res.json(settings);
    } catch (error) {
      console.error('Location settings update error:', error);
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

  // Upload listing images (temporarily removed auth for development)
  app.post("/api/upload/images", uploadListingImages.array('images'), async (req, res) => {
    try {
      const userId = 1; // Temporary fixed user ID for development
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
      console.error('Upload error:', error);
      res.status(500).json({ error: "Dosya yükleme hatası" });
    }
  });

  // Rotate image endpoint
  app.post("/api/upload/images/:imageId/rotate", async (req, res) => {
    try {
      const { imageId } = req.params;
      const userId = 1; // Temporary fixed user ID for development
      
      // Find image file
      const userDir = path.join(process.cwd(), 'uploads', 'users', userId.toString(), 'temp-listings');
      const files = fs.readdirSync(userDir).filter(file => file.startsWith(imageId));
      
      if (files.length === 0) {
        return res.status(404).json({ error: "Resim bulunamadı" });
      }
      
      const imageFile = files[0];
      const imagePath = path.join(userDir, imageFile);
      const thumbnailPath = path.join(userDir, `thumb_${imageFile}`);
      
      // Rotate main image
      await sharp(imagePath)
        .rotate(90)
        .jpeg({ quality: 90 })
        .toFile(imagePath + '_temp');
      
      // Replace original with rotated
      fs.renameSync(imagePath + '_temp', imagePath);
      
      // Rotate thumbnail if exists
      if (fs.existsSync(thumbnailPath)) {
        await sharp(thumbnailPath)
          .rotate(90)
          .jpeg({ quality: 90 })
          .toFile(thumbnailPath + '_temp');
        
        fs.renameSync(thumbnailPath + '_temp', thumbnailPath);
      }
      
      res.json({
        id: imageId,
        url: `/uploads/users/${userId}/temp-listings/${imageFile}`,
        thumbnail: `/uploads/users/${userId}/temp-listings/thumb_${imageFile}`
      });
    } catch (error) {
      console.error('Rotate error:', error);
      res.status(500).json({ error: "Resim döndürme hatası" });
    }
  });

  // Delete uploaded image (temporarily removed auth for development)
  app.delete("/api/upload/images/:imageId", async (req, res) => {
    try {
      const userId = 1; // Temporary fixed user ID for development
      const imageId = req.params.imageId;
      
      // Find and delete the image file
      const userDir = path.join(process.cwd(), 'uploads', 'users', userId.toString(), 'temp-listings');
      const files = await fs.promises.readdir(userDir).catch(() => []);
      
      const imageFile = files.find(file => file.startsWith(imageId));
      if (imageFile) {
        const imagePath = path.join(userDir, imageFile);
        await imageProcessor.deleteImage(imagePath);
      }

      res.json({ message: "Resim silindi" });
    } catch (error) {
      console.error('Delete error:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}
