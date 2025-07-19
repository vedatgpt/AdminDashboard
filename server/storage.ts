import { users, authorizedPersonnel, categories, categoryCustomFields, type User, type InsertUser, type LoginData, type RegisterData, type AuthorizedPersonnel, type InsertAuthorizedPersonnel, type Category, type InsertCategory, type UpdateCategory, type CategoryCustomField, type InsertCustomField } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, desc, asc } from "drizzle-orm";
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
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getChildCategories(parentId: number | null): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: UpdateCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  moveCategoryToParent(id: number, newParentId: number | null): Promise<Category>;
  getCategoryBreadcrumbs(id: number): Promise<Category[]>;
  
  // Custom Fields methods
  getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]>;
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
    let query = db.select().from(categories).where(eq(categories.slug, slug));
    
    if (parentId !== undefined) {
      if (parentId === null) {
        query = query.and(isNull(categories.parentId));
      } else {
        query = query.and(eq(categories.parentId, parentId));
      }
    }
    
    const [category] = await query;
    return category || undefined;
  }

  async getChildCategories(parentId: number | null): Promise<Category[]> {
    if (parentId === null) {
      return await db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    }
    return await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
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

  // Custom Fields methods
  async getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]> {
    return await db.select().from(categoryCustomFields)
      .where(eq(categoryCustomFields.categoryId, categoryId))
      .orderBy(asc(categoryCustomFields.sortOrder), asc(categoryCustomFields.label));
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
}

export const storage = new DatabaseStorage();
