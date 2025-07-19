import express, { type Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import session from "express-session";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(loginData);
      
      if (!user) {
        return res.status(401).json({ error: "Kullanıcı adı veya şifre hatalı" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "Hesabınız devre dışı bırakılmış" });
      }

      // Store user in session
      req.session.user = user;
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: "Geçersiz veri" });
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

  app.get("/api/auth/me", (req, res) => {
    const user = req.session?.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(user);
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

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Profil güncellenirken hata oluştu" });
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

  const httpServer = createServer(app);
  return httpServer;
}
