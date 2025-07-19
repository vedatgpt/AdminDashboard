import { 
  users, 
  authorizedPersonnel, 
  categories,
  categoryCustomFields,
  categoryFilters,
  type User, 
  type InsertUser, 
  type LoginData, 
  type RegisterData, 
  type AuthorizedPersonnel, 
  type InsertAuthorizedPersonnel,
  type Category,
  type InsertCategory,
  type CategoryWithChildren,
  type CategoryCustomField,
  type InsertCustomField,
  type CategoryFilter,
  type InsertFilter
} from "@shared/schema";
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
  
  // Category management methods
  getCategories(): Promise<CategoryWithChildren[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(data: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  getCategoryTree(): Promise<CategoryWithChildren[]>;
  getCategoriesPaginated(parentId: number | null, page: number, perPage: number): Promise<{ categories: Category[], total: number, totalPages: number }>;
  getCategoryBreadcrumbs(categoryId: number): Promise<Category[]>;
  
  // Custom fields methods
  getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]>;
  createCustomField(data: InsertCustomField): Promise<CategoryCustomField>;
  updateCustomField(id: number, updates: Partial<Omit<CategoryCustomField, 'id' | 'createdAt'>>): Promise<CategoryCustomField>;
  deleteCustomField(id: number): Promise<void>;
  
  // Category filters methods
  getCategoryFilters(categoryId: number): Promise<CategoryFilter[]>;
  createCategoryFilter(data: InsertFilter): Promise<CategoryFilter>;
  updateCategoryFilter(id: number, updates: Partial<Omit<CategoryFilter, 'id' | 'createdAt'>>): Promise<CategoryFilter>;
  deleteCategoryFilter(id: number): Promise<void>;
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

  // Category management implementation
  async getCategories(): Promise<CategoryWithChildren[]> {
    const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
    return this.buildCategoryTree(allCategories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async updateCategory(id: number, updates: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    // Check if category has children
    const children = await db.select().from(categories).where(eq(categories.parentId, id));
    if (children.length > 0) {
      throw new Error('Bu kategorinin alt kategorileri bulunmaktadır. Önce alt kategorileri silin.');
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getCategoryTree(): Promise<CategoryWithChildren[]> {
    const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
    return this.buildCategoryTree(allCategories);
  }

  async getCategoriesPaginated(parentId: number | null, page: number, perPage: number): Promise<{ categories: Category[], total: number, totalPages: number }> {
    const offset = (page - 1) * perPage;
    
    // Build the where condition based on parentId
    const whereCondition = parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId);
    
    // Get total count
    const totalResult = await db
      .select()
      .from(categories)
      .where(whereCondition);
    
    const total = totalResult.length;
    const totalPages = Math.ceil(total / perPage);
    
    // Get paginated results
    const categoryResults = await db
      .select()
      .from(categories)
      .where(whereCondition)
      .orderBy(asc(categories.sortOrder), asc(categories.name))
      .limit(perPage)
      .offset(offset);
    
    return {
      categories: categoryResults,
      total,
      totalPages
    };
  }

  async getCategoryBreadcrumbs(categoryId: number): Promise<Category[]> {
    const breadcrumbs: Category[] = [];
    let currentCategory = await this.getCategoryById(categoryId);
    
    while (currentCategory && currentCategory.parentId) {
      const parentCategory = await this.getCategoryById(currentCategory.parentId);
      if (parentCategory) {
        breadcrumbs.unshift(parentCategory);
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    
    return breadcrumbs;
  }

  // Custom fields implementation
  async getCategoryCustomFields(categoryId: number): Promise<CategoryCustomField[]> {
    return await db.select().from(categoryCustomFields).where(eq(categoryCustomFields.categoryId, categoryId));
  }

  async createCustomField(data: InsertCustomField): Promise<CategoryCustomField> {
    const [field] = await db.insert(categoryCustomFields).values(data).returning();
    return field;
  }

  async updateCustomField(id: number, updates: Partial<Omit<CategoryCustomField, 'id' | 'createdAt'>>): Promise<CategoryCustomField> {
    const [field] = await db
      .update(categoryCustomFields)
      .set(updates)
      .where(eq(categoryCustomFields.id, id))
      .returning();
    return field;
  }

  async deleteCustomField(id: number): Promise<void> {
    await db.delete(categoryCustomFields).where(eq(categoryCustomFields.id, id));
  }

  // Category filters implementation
  async getCategoryFilters(categoryId: number): Promise<CategoryFilter[]> {
    return await db.select().from(categoryFilters).where(eq(categoryFilters.categoryId, categoryId));
  }

  async createCategoryFilter(data: InsertFilter): Promise<CategoryFilter> {
    const [filter] = await db.insert(categoryFilters).values(data).returning();
    return filter;
  }

  async updateCategoryFilter(id: number, updates: Partial<Omit<CategoryFilter, 'id' | 'createdAt'>>): Promise<CategoryFilter> {
    const [filter] = await db
      .update(categoryFilters)
      .set(updates)
      .where(eq(categoryFilters.id, id))
      .returning();
    return filter;
  }

  async deleteCategoryFilter(id: number): Promise<void> {
    await db.delete(categoryFilters).where(eq(categoryFilters.id, id));
  }

  // Helper method to build category tree
  private buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
    const categoryMap = new Map<number, CategoryWithChildren>();
    const rootCategories: CategoryWithChildren[] = [];

    // First pass: create all categories with empty children arrays
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Second pass: build the tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId === null || category.parentId === undefined) {
        // Root category
        rootCategories.push(categoryWithChildren);
      } else {
        // Child category - add to parent
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;

    // Create map of all categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build tree structure
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId === null) {
        rootCategories.push(categoryWithChildren);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      }
    });

    return rootCategories;
  }
}

export const storage = new DatabaseStorage();
