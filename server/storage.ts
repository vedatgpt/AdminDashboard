import { users, authorizedPersonnel, categories, categoryCustomFields, locations, locationSettings, type User, type InsertUser, type LoginData, type RegisterData, type AuthorizedPersonnel, type InsertAuthorizedPersonnel, type Category, type InsertCategory, type UpdateCategory, type CategoryCustomField, type InsertCustomField, type Location, type InsertLocation, type UpdateLocation, type LocationSettings, type InsertLocationSettings, type UpdateLocationSettings } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, desc, asc, and, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Generate unique username like "velikara4678"
function generateUniqueUsername(firstName: string, lastName: string): string {
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${cleanFirstName}${cleanLastName}${randomNumber}`;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  authenticateUser(loginData: LoginData): Promise<User | null>;
  registerUser(registerData: RegisterData): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  
  // Authorized Personnel methods
  getAuthorizedPersonnel(companyUserId: number): Promise<AuthorizedPersonnel[]>;
  getAuthorizedPersonnelById(id: number): Promise<AuthorizedPersonnel | undefined>;
  getAuthorizedPersonnelByEmail(email: string): Promise<AuthorizedPersonnel | undefined>;
  createAuthorizedPersonnel(companyUserId: number, data: InsertAuthorizedPersonnel): Promise<AuthorizedPersonnel>;
  updateAuthorizedPersonnel(id: number, updates: Partial<Omit<AuthorizedPersonnel, 'id' | 'companyUserId' | 'createdAt' | 'updatedAt'>>): Promise<AuthorizedPersonnel>;
  deleteAuthorizedPersonnel(id: number): Promise<void>;
  authenticateAuthorizedPersonnel(email: string, password: string): Promise<{ personnel: AuthorizedPersonnel; company: User } | null>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoriesTree(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string, parentId?: number | null): Promise<Category | undefined>;
  getChildCategories(parentId: number | null): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: UpdateCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  moveCategoryToParent(id: number, newParentId: number | null): Promise<Category>;
  getCategoryBreadcrumbs(id: number): Promise<Category[]>;
  
  // Custom Fields methods
  getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]>;
  getCategoryCustomFieldsWithInheritance(categoryId: number): Promise<CategoryCustomField[]>;
  createCustomField(data: InsertCustomField): Promise<CategoryCustomField>;
  updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CategoryCustomField>;
  deleteCustomField(id: number): Promise<void>;
  
  // Location methods
  getLocations(): Promise<Location[]>;
  getLocationsTree(): Promise<Location[]>;
  getLocationById(id: number): Promise<Location | undefined>;
  getChildLocations(parentId: number | null): Promise<Location[]>;
  createLocation(data: InsertLocation): Promise<Location>;
  updateLocation(id: number, updates: UpdateLocation): Promise<Location>;
  deleteLocation(id: number): Promise<void>;
  getLocationBreadcrumbs(id: number): Promise<Location[]>;
  
  // Location Settings methods
  getLocationSettings(): Promise<LocationSettings>;
  updateLocationSettings(updates: UpdateLocationSettings): Promise<LocationSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateUser(loginData: LoginData): Promise<User | null> {
    // Try to find user by email first, then by username
    let user = await this.getUserByEmail(loginData.emailOrUsername);
    if (!user) {
      user = await this.getUserByUsername(loginData.emailOrUsername);
    }
    
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) return null;

    return user;
  }

  async registerUser(registerData: RegisterData): Promise<User> {
    // Check if email already exists
    const existingEmail = await this.getUserByEmail(registerData.email);
    if (existingEmail) {
      throw new Error("Bu email adresi zaten kullanılıyor");
    }

    // Generate unique username
    let username = generateUniqueUsername(registerData.firstName, registerData.lastName);
    let attempts = 0;
    
    // Ensure username is unique (try up to 10 times)
    while (await this.getUserByUsername(username) && attempts < 10) {
      username = generateUniqueUsername(registerData.firstName, registerData.lastName);
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error("Benzersiz kullanıcı adı oluşturulamadı, lütfen tekrar deneyin");
    }

    // Create user with generated username
    const userToCreate = {
      ...registerData,
      username,
      companyName: registerData.role === "corporate" ? registerData.companyName : null,
    };

    return this.createUser(userToCreate);
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const [result] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    if (!result) {
      throw new Error("Kullanıcı bulunamadı");
    }
    
    return result;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  // Authorized Personnel methods
  async getAuthorizedPersonnel(companyUserId: number): Promise<AuthorizedPersonnel[]> {
    return db.select().from(authorizedPersonnel).where(eq(authorizedPersonnel.companyUserId, companyUserId));
  }

  async getAuthorizedPersonnelById(id: number): Promise<AuthorizedPersonnel | undefined> {
    const [personnel] = await db.select().from(authorizedPersonnel).where(eq(authorizedPersonnel.id, id));
    return personnel || undefined;
  }

  async getAuthorizedPersonnelByEmail(email: string): Promise<AuthorizedPersonnel | undefined> {
    const [personnel] = await db.select().from(authorizedPersonnel).where(eq(authorizedPersonnel.email, email));
    return personnel || undefined;
  }

  async createAuthorizedPersonnel(companyUserId: number, data: InsertAuthorizedPersonnel): Promise<AuthorizedPersonnel> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const [personnel] = await db.insert(authorizedPersonnel).values({
      ...data,
      companyUserId,
      password: hashedPassword,
    }).returning();

    return personnel;
  }

  async updateAuthorizedPersonnel(id: number, updates: Partial<Omit<AuthorizedPersonnel, 'id' | 'companyUserId' | 'createdAt' | 'updatedAt'>>): Promise<AuthorizedPersonnel> {
    const updateData = { ...updates };
    
    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const [personnel] = await db.update(authorizedPersonnel)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(authorizedPersonnel.id, id))
      .returning();

    return personnel;
  }

  async deleteAuthorizedPersonnel(id: number): Promise<void> {
    await db.delete(authorizedPersonnel).where(eq(authorizedPersonnel.id, id));
  }

  async authenticateAuthorizedPersonnel(email: string, password: string): Promise<{ personnel: AuthorizedPersonnel; company: User } | null> {
    const personnel = await this.getAuthorizedPersonnelByEmail(email);
    
    if (!personnel || !personnel.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, personnel.password);
    if (!isPasswordValid) {
      return null;
    }

    const company = await this.getUserById(personnel.companyUserId);
    if (!company) {
      return null;
    }

    return { personnel, company };
  }

  // Category methods implementation
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async getCategoriesTree(): Promise<Category[]> {
    // Get all categories ordered by parent-child relationship
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
    
    // Build tree structure
    const categoryMap = new Map<number, Category & { children: Category[] }>();
    const rootCategories: (Category & { children: Category[] })[] = [];

    // Initialize all categories with children array
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] } as Category & { children: Category[] });
    });

    // Build parent-child relationships
    allCategories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories as Category[];
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category as Category || undefined;
  }

  async getCategoryBySlug(slug: string, parentId?: number | null): Promise<Category | undefined> {
    let whereCondition = eq(categories.slug, slug);
    
    if (parentId !== undefined) {
      if (parentId === null) {
        whereCondition = and(whereCondition, isNull(categories.parentId))!;
      } else {
        whereCondition = and(whereCondition, eq(categories.parentId, parentId))!;
      }
    }
    
    const [category] = await db.select().from(categories).where(whereCondition);
    return category as Category || undefined;
  }

  async getChildCategories(parentId: number | null): Promise<Category[]> {
    if (parentId === null) {
      const result = await db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
      return result as Category[];
    }
    const result = await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    return result as Category[];
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return category as Category;
  }

  async updateCategory(id: number, updates: UpdateCategory): Promise<Category> {
    const [category] = await db.update(categories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    return category as Category;
  }

  async deleteCategory(id: number): Promise<void> {
    // First check if category has children
    const children = await this.getChildCategories(id);
    if (children.length > 0) {
      throw new Error('Bu kategorinin alt kategorileri var. Önce alt kategorileri silin.');
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }

  async moveCategoryToParent(id: number, newParentId: number | null): Promise<Category> {
    // Prevent circular references
    if (newParentId !== null) {
      const breadcrumbs = await this.getCategoryBreadcrumbs(newParentId);
      if (breadcrumbs.some(cat => cat.id === id)) {
        throw new Error('Bu işlem döngüsel referans oluşturacak.');
      }
    }

    return await this.updateCategory(id, { parentId: newParentId });
  }

  async getCategoryBreadcrumbs(id: number): Promise<Category[]> {
    const breadcrumbs: Category[] = [];
    let currentCategory = await this.getCategoryById(id);
    
    while (currentCategory) {
      breadcrumbs.unshift(currentCategory);
      if (currentCategory.parentId) {
        currentCategory = await this.getCategoryById(currentCategory.parentId);
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  }

  // Custom Fields methods
  async getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]> {
    return await db.select().from(categoryCustomFields)
      .where(eq(categoryCustomFields.categoryId, categoryId))
      .orderBy(asc(categoryCustomFields.sortOrder), asc(categoryCustomFields.label));
  }

  async getCategoryCustomFieldsWithInheritance(categoryId: number): Promise<CategoryCustomField[]> {
    // Get the category breadcrumbs (current category and all parents)
    const breadcrumbs = await this.getCategoryBreadcrumbs(categoryId);
    const allFields: CategoryCustomField[] = [];
    const fieldNamesSeen = new Set<string>();

    // Start from the deepest (current) category and work backwards to parents
    // This ensures child category fields override parent fields with same fieldName
    for (let i = breadcrumbs.length - 1; i >= 0; i--) {
      const category = breadcrumbs[i];
      const fieldsForCategory = await this.getCategoryCustomFields(category.id);
      
      for (const field of fieldsForCategory) {
        // Only add if we haven't seen this fieldName before (child overrides parent)
        if (!fieldNamesSeen.has(field.fieldName)) {
          allFields.push(field);
          fieldNamesSeen.add(field.fieldName);
        }
      }
    }

    // Sort by sortOrder and then by label
    return allFields.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return a.label.localeCompare(b.label);
    });
  }

  async createCustomField(data: InsertCustomField): Promise<CategoryCustomField> {
    const [field] = await db.insert(categoryCustomFields).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return field;
  }

  async updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CategoryCustomField> {
    const [field] = await db.update(categoryCustomFields)
      .set(updates)
      .where(eq(categoryCustomFields.id, id))
      .returning();
    return field;
  }

  async deleteCustomField(id: number): Promise<void> {
    await db.delete(categoryCustomFields).where(eq(categoryCustomFields.id, id));
  }

  // Location methods implementation
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(asc(locations.sortOrder), asc(locations.name));
  }

  async getLocationsTree(): Promise<Location[]> {
    const allLocations = await this.getLocations();
    
    // Build tree structure
    const locationMap = new Map<number, Location & { children: Location[] }>();
    const rootLocations: (Location & { children: Location[] })[] = [];

    // Initialize locations with children array
    allLocations.forEach(location => {
      locationMap.set(location.id, { ...location, children: [] });
    });

    // Build tree structure
    allLocations.forEach(location => {
      const locationWithChildren = locationMap.get(location.id)!;
      if (location.parentId === null) {
        rootLocations.push(locationWithChildren);
      } else {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children.push(locationWithChildren);
        }
      }
    });

    return rootLocations;
  }

  async getLocationById(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async getChildLocations(parentId: number | null): Promise<Location[]> {
    if (parentId === null) {
      return await db.select().from(locations)
        .where(isNull(locations.parentId))
        .orderBy(asc(locations.sortOrder), asc(locations.name));
    } else {
      return await db.select().from(locations)
        .where(eq(locations.parentId, parentId))
        .orderBy(asc(locations.sortOrder), asc(locations.name));
    }
  }

  async createLocation(data: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return location;
  }

  async updateLocation(id: number, updates: UpdateLocation): Promise<Location> {
    const [location] = await db.update(locations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning();
    return location;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  async getLocationBreadcrumbs(id: number): Promise<Location[]> {
    const breadcrumbs: Location[] = [];
    let currentId: number | null = id;

    while (currentId !== null) {
      const location = await this.getLocationById(currentId);
      if (!location) break;
      
      breadcrumbs.unshift(location);
      currentId = location.parentId;
    }

    return breadcrumbs;
  }

  // Location Settings methods implementation
  async getLocationSettings(): Promise<LocationSettings> {
    const [settings] = await db.select().from(locationSettings);
    
    // If no settings exist, create default settings
    if (!settings) {
      const [defaultSettings] = await db.insert(locationSettings).values({
        showCountry: true,
        showCity: true,
        showDistrict: true,
        showNeighborhood: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return defaultSettings;
    }
    
    return settings;
  }

  async updateLocationSettings(updates: UpdateLocationSettings): Promise<LocationSettings> {
    // Get existing settings first
    const existingSettings = await this.getLocationSettings();
    
    const [settings] = await db.update(locationSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(locationSettings.id, existingSettings.id))
      .returning();
    return settings;
  }
}

export const storage = new DatabaseStorage();
