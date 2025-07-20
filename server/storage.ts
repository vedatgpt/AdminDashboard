import { users, authorizedPersonnel, categories, categoryCustomFields, categoryMetadata, type User, type InsertUser, type LoginData, type RegisterData, type AuthorizedPersonnel, type InsertAuthorizedPersonnel, type Category, type InsertCategory, type UpdateCategory, type CategoryCustomField, type InsertCustomField, type CategoryMetadata } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, desc, asc, and, or, inArray, limit, offset } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cache } from "./cache";

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
  getCategoryPath(id: number): Promise<Array<{category: Category, label: string}>>;
  
  // Category Metadata methods
  getCategoryMetadata(categoryId: number): Promise<CategoryMetadata | undefined>;
  setCategoryMetadata(categoryId: number, labelKey: string): Promise<CategoryMetadata>;
  updateCategoryMetadata(categoryId: number, labelKey: string): Promise<CategoryMetadata>;
  deleteCategoryMetadata(categoryId: number): Promise<void>;
  
  // Custom Fields methods
  getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]>;
  getCategoryCustomFieldsWithInheritance(categoryId: number): Promise<CategoryCustomField[]>;
  createCustomField(data: InsertCustomField): Promise<CategoryCustomField>;
  updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CategoryCustomField>;
  deleteCustomField(id: number): Promise<void>;
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
    const cacheKey = cache.keys.categories;
    const cached = cache.get<Category[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
    cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes cache
    return result;
  }

  async getCategoriesTree(): Promise<Category[]> {
    // Get all categories ordered by parent-child relationship
    const allCategories = await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
    
    // Build tree structure
    const categoryMap = new Map<number, Category & { children: Category[] }>();
    const rootCategories: (Category & { children: Category[] })[] = [];

    // Initialize all categories with children array
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
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
    return category || undefined;
  }

  async getCategoryBySlug(slug: string, parentId?: number | null): Promise<Category | undefined> {
    let whereCondition = eq(categories.slug, slug);
    
    if (parentId !== undefined) {
      if (parentId === null) {
        whereCondition = and(whereCondition, isNull(categories.parentId));
      } else {
        whereCondition = and(whereCondition, eq(categories.parentId, parentId));
      }
    }
    
    const [category] = await db.select().from(categories).where(whereCondition);
    return category || undefined;
  }

  async getChildCategories(parentId: number | null): Promise<Category[]> {
    const cacheKey = cache.keys.categoryChildren(parentId);
    const cached = cache.get<Category[]>(cacheKey);
    if (cached) return cached;

    let result: Category[];
    if (parentId === null) {
      result = await db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    } else {
      result = await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    }
    
    cache.set(cacheKey, result, 3 * 60 * 1000); // 3 minutes cache
    return result;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Invalidate relevant caches
    cache.delete(cache.keys.categories);
    cache.delete(cache.keys.categoriesTree);
    cache.delete(cache.keys.categoryChildren(data.parentId));
    
    return category;
  }

  async updateCategory(id: number, updates: UpdateCategory): Promise<Category> {
    const [category] = await db.update(categories)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    
    // Invalidate relevant caches
    cache.delete(cache.keys.categories);
    cache.delete(cache.keys.categoriesTree);
    cache.delete(cache.keys.categoryPath(id));
    cache.delete(cache.keys.categoryChildren(category.parentId));
    
    return category;
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

  async getCategoryPath(id: number): Promise<Array<{category: Category, label: string}>> {
    const cacheKey = cache.keys.categoryPath(id);
    const cached = cache.get<Array<{category: Category, label: string}>>(cacheKey);
    if (cached) return cached;

    const breadcrumbs = await this.getCategoryBreadcrumbs(id);
    
    // Get all metadata for the categories in the path in a single query
    const categoryIds = breadcrumbs.map(cat => cat.id);
    const metadataResults = await db
      .select()
      .from(categoryMetadata)
      .where(inArray(categoryMetadata.categoryId, categoryIds));
    
    // Create a map for quick lookup
    const metadataMap = new Map<number, string>();
    metadataResults.forEach(meta => {
      metadataMap.set(meta.categoryId, meta.labelKey);
    });

    // Build path with labels
    const pathWithLabels = breadcrumbs.map(category => ({
      category,
      label: metadataMap.get(category.id) || "Category"
    }));

    cache.set(cacheKey, pathWithLabels, 5 * 60 * 1000); // 5 minutes cache
    return pathWithLabels;
  }

  // Category Metadata methods
  async getCategoryMetadata(categoryId: number): Promise<CategoryMetadata | undefined> {
    const result = await db
      .select()
      .from(categoryMetadata)
      .where(eq(categoryMetadata.categoryId, categoryId))
      .limit(1);

    return result[0];
  }

  async setCategoryMetadata(categoryId: number, labelKey: string): Promise<CategoryMetadata> {
    const existing = await this.getCategoryMetadata(categoryId);
    
    if (existing) {
      return await this.updateCategoryMetadata(categoryId, labelKey);
    }

    const result = await db
      .insert(categoryMetadata)
      .values({
        categoryId,
        labelKey,
      })
      .returning();

    return result[0];
  }

  async updateCategoryMetadata(categoryId: number, labelKey: string): Promise<CategoryMetadata> {
    const result = await db
      .update(categoryMetadata)
      .set({ labelKey })
      .where(eq(categoryMetadata.categoryId, categoryId))
      .returning();

    if (result.length === 0) {
      throw new Error("Category metadata not found");
    }

    return result[0];
  }

  async deleteCategoryMetadata(categoryId: number): Promise<void> {
    await db
      .delete(categoryMetadata)
      .where(eq(categoryMetadata.categoryId, categoryId));
  }

  // Custom Fields methods
  async getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]> {
    return await db.select().from(categoryCustomFields)
      .where(eq(categoryCustomFields.categoryId, categoryId))
      .orderBy(asc(categoryCustomFields.sortOrder), asc(categoryCustomFields.label));
  }

  async getCategoryCustomFieldsWithInheritance(categoryId: number): Promise<CategoryCustomField[]> {
    const cacheKey = cache.keys.customFields(categoryId);
    const cached = cache.get<CategoryCustomField[]>(cacheKey);
    if (cached) return cached;

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
    const result = allFields.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      }
      return a.label.localeCompare(b.label);
    });

    cache.set(cacheKey, result, 3 * 60 * 1000); // 3 minutes cache
    return result;
  }

  async createCustomField(data: InsertCustomField): Promise<CategoryCustomField> {
    const [field] = await db.insert(categoryCustomFields).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    
    // Invalidate custom fields cache for this category and its children
    cache.delete(cache.keys.customFields(data.categoryId));
    
    return field;
  }

  async updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CategoryCustomField> {
    const [field] = await db.update(categoryCustomFields)
      .set(updates)
      .where(eq(categoryCustomFields.id, id))
      .returning();
    
    // Invalidate custom fields cache for this category
    cache.delete(cache.keys.customFields(field.categoryId));
    
    return field;
  }

  async deleteCustomField(id: number): Promise<void> {
    // Get field before deletion to get categoryId for cache invalidation
    const [field] = await db.select().from(categoryCustomFields).where(eq(categoryCustomFields.id, id));
    
    await db.delete(categoryCustomFields).where(eq(categoryCustomFields.id, id));
    
    if (field) {
      cache.delete(cache.keys.customFields(field.categoryId));
    }
  }
}

export const storage = new DatabaseStorage();
