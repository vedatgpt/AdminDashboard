import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import session from "express-session";

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// Middleware to check if user is admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

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
      const { firstName, lastName, email, companyName, username } = req.body;
      const userId = req.session.userId;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ error: "Ad, soyad ve e-posta zorunludur" });
      }

      // Get current user to check role
      const currentUser = await storage.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten kullanılıyor" });
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
        email,
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

  const httpServer = createServer(app);
  return httpServer;
}
