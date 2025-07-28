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
  parentId: integer("parent_id").references((): any => categories.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  icon: text("icon"), // Icon name or URL
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  adCount: integer("ad_count").notNull().default(0), // Number of ads in this category
  categoryType: text("category_type"), // Manual category type like "Marka", "Seri", "Model", etc.
  // Free listing settings - separate for individual and corporate users
  freeListingLimitIndividual: integer("free_listing_limit_individual").notNull().default(0),
  freeResetPeriodIndividual: text("free_reset_period_individual").notNull().default("monthly"),
  freeListingLimitCorporate: integer("free_listing_limit_corporate").notNull().default(0), 
  freeResetPeriodCorporate: text("free_reset_period_corporate").notNull().default("monthly"),
  applyToSubcategories: boolean("apply_to_subcategories").notNull().default(true),
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

// Locations table for hierarchical location structure (Country > City > District > Neighborhood)
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // country, city, district, neighborhood
  parentId: integer("parent_id").references((): any => locations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Schema for creating locations
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Lokasyon adı en az 2 karakter olmalıdır"),
  type: z.enum(["country", "city", "district", "neighborhood"]),
});

// Schema for updating locations
export const updateLocationSchema = insertLocationSchema.partial();

// User category usage tracking for free listings - separate for individual and corporate
export const userCategoryUsage = pgTable("user_category_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  userType: text("user_type").notNull(), // "individual" or "corporate"
  usedFreeListings: integer("used_free_listings").notNull().default(0),
  resetDate: timestamp("reset_date").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint per user per category per userType
  uniqueUserCategoryType: unique().on(table.userId, table.categoryId, table.userType),
}));

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
export type Category = typeof categories.$inferSelect & {
  children?: Category[];
};
export type Location = typeof locations.$inferSelect & {
  children?: Location[];
};
export type CategoryCustomField = typeof categoryCustomFields.$inferSelect;
export type InsertAuthorizedPersonnel = z.infer<typeof insertAuthorizedPersonnelSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
export type InsertCustomField = z.infer<typeof insertCustomFieldSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

// Location settings for managing visibility
export const locationSettings = pgTable("location_settings", {
  id: serial("id").primaryKey(),
  showCountry: boolean("show_country").default(true).notNull(),
  showCity: boolean("show_city").default(true).notNull(),
  showDistrict: boolean("show_district").default(true).notNull(),
  showNeighborhood: boolean("show_neighborhood").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for location settings
export const insertLocationSettingsSchema = createInsertSchema(locationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateLocationSettingsSchema = insertLocationSettingsSchema.partial();

export type LocationSettings = typeof locationSettings.$inferSelect;
export type InsertLocationSettings = z.infer<typeof insertLocationSettingsSchema>;
export type UpdateLocationSettings = z.infer<typeof updateLocationSettingsSchema>;

// Draft listings table for listing creation process
export const draftListings = pgTable("draft_listings", {
  id: serial("id").primaryKey(), // This will be the classifiedId
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: text("title"),
  description: text("description"),
  price: text("price"), // JSON string for {value, currency}
  customFields: text("custom_fields"), // JSON string for form data
  photos: text("photos"), // JSON array of photo metadata
  locationData: text("location_data"), // JSON object for location selections
  status: text("status").notNull().default("draft"), // draft, published, deleted
  // Step completion tracking for Progressive Disclosure
  step1Completed: boolean("step1_completed").notNull().default(false), // Category selection completed
  step2Completed: boolean("step2_completed").notNull().default(false), // Form data completed
  step3Completed: boolean("step3_completed").notNull().default(false), // Photos uploaded
  step4Completed: boolean("step4_completed").notNull().default(false), // Preview confirmed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for creating draft listings
export const insertDraftListingSchema = createInsertSchema(draftListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  customFields: z.string().optional(),
  photos: z.string().optional(),
  locationData: z.string().optional(),
});

// Schema for updating draft listings
export const updateDraftListingSchema = insertDraftListingSchema.partial();

export type DraftListing = typeof draftListings.$inferSelect;
export type InsertDraftListing = z.infer<typeof insertDraftListingSchema>;
export type UpdateDraftListing = z.infer<typeof updateDraftListingSchema>;

// Sessions table for production-ready session storage
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON session data
  expire: timestamp("expire").notNull(),
});

export type Session = typeof sessions.$inferSelect;

// Doping packages table for listing promotion system
export const dopingPackages = pgTable("doping_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  price: integer("price").notNull().default(0), // Price in TL cents (e.g., 5000 = 50.00 TL)
  durationDays: integer("duration_days").notNull().default(30), // Duration in days
  features: text("features"), // JSON array of features like ["top_listing", "highlighted", "badge"]
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for creating doping packages
export const insertDopingPackageSchema = createInsertSchema(dopingPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating doping packages
export const updateDopingPackageSchema = insertDopingPackageSchema.partial();

export type DopingPackage = typeof dopingPackages.$inferSelect;
export type InsertDopingPackage = z.infer<typeof insertDopingPackageSchema>;
export type UpdateDopingPackage = z.infer<typeof updateDopingPackageSchema>;

// Category packages table for category-specific listing packages
export const categoryPackages = pgTable("category_packages", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0), // Price in kuruş (cents)
  durationDays: integer("duration_days").notNull().default(30),
  features: text("features").notNull().default("[]"), // JSON array of features
  membershipTypes: text("membership_types").notNull().default('["individual","corporate"]'), // JSON array
  applyToSubcategories: boolean("apply_to_subcategories").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for creating category packages
export const insertCategoryPackageSchema = createInsertSchema(categoryPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Paket adı gereklidir"),
  price: z.number().min(0, "Fiyat 0 veya pozitif olmalıdır"),
  durationDays: z.number().min(1, "Süre en az 1 gün olmalıdır"),
  features: z.string().default("[]"),
  membershipTypes: z.string().default('["individual","corporate"]'),
});

// Schema for updating category packages
export const updateCategoryPackageSchema = insertCategoryPackageSchema.partial();

export type CategoryPackage = typeof categoryPackages.$inferSelect;
export type InsertCategoryPackage = z.infer<typeof insertCategoryPackageSchema>;
export type UpdateCategoryPackage = z.infer<typeof updateCategoryPackageSchema>;
