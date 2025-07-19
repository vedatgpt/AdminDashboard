import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
  // Contact information fields
  mobilePhone: text("mobile_phone"),
  whatsappNumber: text("whatsapp_number"),
  businessPhone: text("business_phone"), // Only for corporate users
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
// Authorized Personnel table for corporate users
export const authorizedPersonnel = pgTable("authorized_personnel", {
  id: serial("id").primaryKey(),
  companyUserId: integer("company_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  mobilePhone: text("mobile_phone"),
  whatsappNumber: text("whatsapp_number"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for creating authorized personnel
export const insertAuthorizedPersonnelSchema = createInsertSchema(authorizedPersonnel).omit({
  id: true,
  companyUserId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

export type User = typeof users.$inferSelect;
export type AuthorizedPersonnel = typeof authorizedPersonnel.$inferSelect;
export type InsertAuthorizedPersonnel = z.infer<typeof insertAuthorizedPersonnelSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Categories table for infinite depth category system
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => categories.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Custom fields for categories (infinite customization)
export const categoryCustomFields = pgTable("category_custom_fields", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // 'text', 'select', 'checkbox', 'number-range'
  isRequired: boolean("is_required").notNull().default(false),
  options: json("options"), // For select dropdowns: ["option1", "option2"], for ranges: {min: 0, max: 100}
  placeholder: text("placeholder"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Category filters and sorting options
export const categoryFilters = pgTable("category_filters", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  filterType: text("filter_type").notNull(), // 'sort', 'filter'
  fieldName: text("field_name").notNull(), // Field name to filter/sort by
  label: text("label").notNull(), // Display label
  options: json("options"), // Sort options like ['asc', 'desc'] or filter values
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema for creating categories
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for custom fields
export const insertCustomFieldSchema = createInsertSchema(categoryCustomFields).omit({
  id: true,
  createdAt: true,
});

// Schema for filters
export const insertFilterSchema = createInsertSchema(categoryFilters).omit({
  id: true,
  createdAt: true,
});

// Category field validation schemas
export const customFieldTypeSchema = z.enum(["text", "select", "checkbox", "number-range"]);

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  parentId: z.number().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

export const customFieldFormSchema = z.object({
  fieldName: z.string().min(2, "Alan adı en az 2 karakter olmalıdır"),
  fieldType: customFieldTypeSchema,
  isRequired: z.boolean().default(false),
  options: z.any().optional(), // Will be validated based on field type
  placeholder: z.string().optional(),
});

// Type definitions
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type CategoryCustomField = typeof categoryCustomFields.$inferSelect;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type CategoryFilter = typeof categoryFilters.$inferSelect;
export type InsertFilter = z.infer<typeof insertFilterSchema>;
export type CustomFieldType = z.infer<typeof customFieldTypeSchema>;

// Extended category with children for tree structure
export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  customFields?: CategoryCustomField[];
  filters?: CategoryFilter[];
}
