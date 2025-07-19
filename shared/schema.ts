import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  companyName: text("company_name"), // Only for corporate users
  profileImage: text("profile_image"), // Profile image URL for corporate users
  role: text("role").notNull().default("individual"), // admin, editor, corporate, individual
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  companyName: true,
  role: true,
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "E-posta adresi veya kullanıcı adı gereklidir"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export const registerSchema = z.object({
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  companyName: z.string().optional(),
  role: z.enum(["admin", "editor", "corporate", "individual"]).default("individual"),
}).refine((data) => {
  // If role is corporate, companyName is required
  if (data.role === "corporate" && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: "Kurumsal hesap için firma adı gereklidir",
  path: ["companyName"]
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
