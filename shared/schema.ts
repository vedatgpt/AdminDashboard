import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
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

// Categories table for hierarchical category structure
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id").references(() => categories.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  icon: text("icon"), // Icon name or URL
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  adCount: integer("ad_count").notNull().default(0), // Number of ads in this category
  categoryType: text("category_type"), // Manual category type like "Marka", "Seri", "Model", etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint on slug within same parent
  uniqueSlugPerParent: unique().on(table.slug, table.parentId),
}));

// Category custom fields for dynamic form fields
export const categoryCustomFields = pgTable("category_custom_fields", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // text, number, select, checkbox, number_range, boolean
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  isRequired: boolean("is_required").notNull().default(false),
  options: text("options"), // JSON string for select/radio options
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  // Numeric field options
  isNumericOnly: boolean("is_numeric_only").notNull().default(false), // Only allow numbers
  useThousandSeparator: boolean("use_thousand_separator").notNull().default(false), // Add thousand separators (150.000)
  useMobileNumericKeyboard: boolean("use_mobile_numeric_keyboard").notNull().default(false), // Show numeric keyboard on mobile
  // Unit system
  hasUnits: boolean("has_units").notNull().default(false),
  unitOptions: text("unit_options"), // JSON array of unit options like ["km", "mil"] or ["m²", "ft²"]
  defaultUnit: text("default_unit"), // Default selected unit
  // Min/Max values for number fields
  minValue: integer("min_value"), // Minimum allowed value for number fields
  maxValue: integer("max_value"), // Maximum allowed value for number fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema for creating categories
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  adCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  slug: z.string().min(2, "Slug en az 2 karakter olmalıdır").regex(/^[a-z0-9-]+$/, "Slug sadece küçük harf, rakam ve tire içerebilir"),
  icon: z.string().optional().nullable(),
  categoryType: z.string().optional().nullable(),
});

// Schema for updating categories
export const updateCategorySchema = insertCategorySchema.partial();

// Schema for creating custom fields
export const insertCustomFieldSchema = createInsertSchema(categoryCustomFields).omit({
  id: true,
  createdAt: true,
}).extend({
  fieldName: z.string().min(1, "Alan adı gereklidir"),
  fieldType: z.enum(["text", "number", "select", "checkbox", "number_range", "boolean"]),
  label: z.string().min(1, "Etiket gereklidir"),
});

export type User = typeof users.$inferSelect;
export type AuthorizedPersonnel = typeof authorizedPersonnel.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CategoryCustomField = typeof categoryCustomFields.$inferSelect;
export type InsertAuthorizedPersonnel = z.infer<typeof insertAuthorizedPersonnelSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
