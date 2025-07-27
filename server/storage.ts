import { users, authorizedPersonnel, categories, categoryCustomFields, locations, locationSettings, draftListings, dopingPackages, listingPackages, listingPackageCategoryPricing, corporatePackageAllocations, type User, type InsertUser, type LoginData, type RegisterData, type AuthorizedPersonnel, type InsertAuthorizedPersonnel, type Category, type InsertCategory, type UpdateCategory, type CategoryCustomField, type InsertCustomField, type Location, type InsertLocation, type UpdateLocation, type LocationSettings, type InsertLocationSettings, type UpdateLocationSettings, type DraftListing, type InsertDraftListing, type UpdateDraftListing, type DopingPackage, type InsertDopingPackage, type UpdateDopingPackage, type ListingPackage, type InsertListingPackage, type UpdateListingPackage, type ListingPackageCategoryPricing, type InsertListingPackageCategoryPricing, type UpdateListingPackageCategoryPricing, type CorporatePackageAllocation, type InsertCorporatePackageAllocation, type ListingPackageWithPricing } from "@shared/schema";
import { db } from "./db";
import { eq, isNull, desc, asc, and, or, sql, inArray } from "drizzle-orm";
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
  getAllUsers(): Promise<User[]>;
  
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
  reorderLocations(parentId: number | null, locationIds: number[]): Promise<void>;
  getLocationBreadcrumbs(id: number): Promise<Location[]>;
  
  // Location Settings methods
  getLocationSettings(): Promise<LocationSettings>;
  updateLocationSettings(updates: UpdateLocationSettings): Promise<LocationSettings>;

  // Draft Listings methods
  getDraftListing(id: number): Promise<DraftListing | undefined>;
  getUserDraftListings(userId: number): Promise<DraftListing[]>;
  getUserDraftForCategory(userId: number, categoryId: number): Promise<DraftListing | undefined>;
  createDraftListing(data: InsertDraftListing): Promise<DraftListing>;
  updateDraftListing(id: number, updates: UpdateDraftListing): Promise<DraftListing>;
  deleteDraftListing(id: number): Promise<void>;
  publishDraftListing(id: number): Promise<DraftListing>;
  markStepCompleted(id: number, step: number): Promise<DraftListing>;

  // Doping Packages methods
  getDopingPackages(): Promise<DopingPackage[]>;
  getDopingPackageById(id: number): Promise<DopingPackage | undefined>;
  createDopingPackage(data: InsertDopingPackage): Promise<DopingPackage>;
  updateDopingPackage(id: number, updates: UpdateDopingPackage): Promise<DopingPackage>;
  deleteDopingPackage(id: number): Promise<void>;
  reorderDopingPackages(packageIds: number[]): Promise<void>;

  // Listing Packages methods
  getListingPackages(): Promise<ListingPackage[]>;
  getListingPackageById(id: number): Promise<ListingPackage | undefined>;
  getListingPackageWithPricing(id: number): Promise<ListingPackageWithPricing | undefined>;
  createListingPackage(data: InsertListingPackage): Promise<ListingPackage>;
  updateListingPackage(id: number, updates: UpdateListingPackage): Promise<ListingPackage>;
  deleteListingPackage(id: number): Promise<void>;
  reorderListingPackages(packageIds: number[]): Promise<void>;

  // Listing Package Category Pricing methods
  getPackageCategoryPricing(packageId: number): Promise<ListingPackageCategoryPricing[]>;
  createPackageCategoryPricing(data: InsertListingPackageCategoryPricing): Promise<ListingPackageCategoryPricing>;
  updatePackageCategoryPricing(id: number, updates: UpdateListingPackageCategoryPricing): Promise<ListingPackageCategoryPricing>;
  deletePackageCategoryPricing(id: number): Promise<void>;
  deletePackageCategoryPricingByPackage(packageId: number): Promise<void>;

  // Corporate Package Allocation methods
  getCorporatePackageAllocations(corporateUserId: number): Promise<CorporatePackageAllocation[]>;
  createCorporatePackageAllocation(data: InsertCorporatePackageAllocation): Promise<CorporatePackageAllocation>;
  updateCorporatePackageAllocation(id: number, updates: Partial<CorporatePackageAllocation>): Promise<CorporatePackageAllocation>;
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

  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(asc(users.createdAt));
      return allUsers;
    } catch (error: any) {
      throw new Error("Kullanıcılar alınamadı");
    }
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
    // Get ALL categories (both active and inactive) ordered by parent-child relationship
    const allCategories = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
    
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
    try {
      const [category] = await db.select().from(categories).where(eq(categories.id, id));
      return category as Category || undefined;
    } catch (error: any) {
      console.error('getCategoryById error:', error);
      throw error;
    }
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
    let result: any[];
    if (parentId === null) {
      result = await db.select().from(categories).where(isNull(categories.parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    } else {
      result = await db.select().from(categories).where(eq(categories.parentId, parentId)).orderBy(asc(categories.sortOrder), asc(categories.name));
    }
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
      if (breadcrumbs.some((cat: Category) => cat.id === id)) {
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
    const result = await db.select().from(categoryCustomFields)
      .where(eq(categoryCustomFields.categoryId, categoryId))
      .orderBy(asc(categoryCustomFields.sortOrder), asc(categoryCustomFields.label));
    return result as CategoryCustomField[];
  }

  async getCategoryCustomFieldsWithInheritance(categoryId: number): Promise<CategoryCustomField[]> {
    try {
      // Get direct fields first
      const directFields = await db.select().from(categoryCustomFields)
        .where(eq(categoryCustomFields.categoryId, categoryId))
        .orderBy(asc(categoryCustomFields.sortOrder), asc(categoryCustomFields.label));
      
      // If we have direct fields, return them
      if (directFields.length > 0) {
        return directFields as CategoryCustomField[];
      }
      
      // No direct fields, check parent hierarchy
      const category = await this.getCategoryById(categoryId);
      if (!category?.parentId) {
        return []; // No parent, no fields
      }
      
      // Recursively check parent categories
      return await this.getCategoryCustomFieldsWithInheritance(category.parentId);
    } catch (error: any) {
      console.error('Get custom fields with inheritance error:', error);
      return [];
    }
  }

  async createCustomField(data: InsertCustomField): Promise<CategoryCustomField> {
    const [field] = await db.insert(categoryCustomFields).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return field as CategoryCustomField;
  }

  async updateCustomField(id: number, updates: Partial<InsertCustomField>): Promise<CategoryCustomField> {
    const [field] = await db.update(categoryCustomFields)
      .set(updates)
      .where(eq(categoryCustomFields.id, id))
      .returning();
    return field as CategoryCustomField;
  }

  async deleteCustomField(id: number): Promise<void> {
    await db.delete(categoryCustomFields).where(eq(categoryCustomFields.id, id));
  }

  // Location methods implementation
  async getLocations(): Promise<Location[]> {
    const result = await db.select().from(locations).orderBy(asc(locations.sortOrder), asc(locations.name));
    return result as Location[];
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
    let result: any[];
    if (parentId === null) {
      result = await db.select().from(locations)
        .where(isNull(locations.parentId))
        .orderBy(asc(locations.sortOrder), asc(locations.name));
    } else {
      result = await db.select().from(locations)
        .where(eq(locations.parentId, parentId))
        .orderBy(asc(locations.sortOrder), asc(locations.name));
    }
    return result as Location[];
  }

  async createLocation(data: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return location as Location;
  }

  async updateLocation(id: number, updates: UpdateLocation): Promise<Location> {
    const [location] = await db.update(locations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(locations.id, id))
      .returning();
    return location as Location;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  async reorderLocations(parentId: number | null, locationIds: number[]): Promise<void> {
    // Update sort order for each location
    for (let i = 0; i < locationIds.length; i++) {
      await db.update(locations)
        .set({ 
          sortOrder: i + 1,
          updatedAt: new Date()
        })
        .where(eq(locations.id, locationIds[i]));
    }
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

  // Draft Listings methods
  async getDraftListing(id: number, userId?: number): Promise<DraftListing | undefined> {
    // Build WHERE conditions
    const conditions = [eq(draftListings.id, id)];
    
    // If userId provided, add ownership check
    if (userId !== undefined) {
      conditions.push(eq(draftListings.userId, userId));
    }
    
    const [draft] = await db.select().from(draftListings).where(and(...conditions));
    return draft || undefined;
  }

  async getUserDraftListings(userId: number): Promise<DraftListing[]> {
    return await db.select().from(draftListings)
      .where(and(eq(draftListings.userId, userId), eq(draftListings.status, "draft")))
      .orderBy(desc(draftListings.updatedAt));
  }

  async createDraftListing(data: InsertDraftListing): Promise<DraftListing> {
    const [draft] = await db.insert(draftListings).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return draft;
  }

  async updateDraftListing(id: number, updates: UpdateDraftListing): Promise<DraftListing> {
    const [draft] = await db.update(draftListings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(draftListings.id, id))
      .returning();
    return draft;
  }

  async deleteDraftListing(id: number): Promise<void> {
    await db.delete(draftListings).where(eq(draftListings.id, id));
  }

  async getUserDraftForCategory(userId: number, categoryId: number): Promise<DraftListing | undefined> {
    const [draft] = await db.select().from(draftListings)
      .where(
        and(
          eq(draftListings.userId, userId),
          eq(draftListings.categoryId, categoryId),
          eq(draftListings.status, "draft")
        )
      )
      .orderBy(desc(draftListings.updatedAt))
      .limit(1);
    return draft || undefined;
  }

  async publishDraftListing(id: number): Promise<DraftListing> {
    const [draft] = await db.update(draftListings)
      .set({
        status: "published",
        updatedAt: new Date(),
      })
      .where(eq(draftListings.id, id))
      .returning();
    return draft;
  }

  // Step completion tracking methods
  async updateStepCompletion(id: number, step: number, completed: boolean = true): Promise<DraftListing> {
    const updateData: any = { updatedAt: new Date() };
    
    switch (step) {
      case 1:
        updateData.step1Completed = completed;
        break;
      case 2:
        updateData.step2Completed = completed;
        break;
      case 3:
        updateData.step3Completed = completed;
        break;
      case 4:
        updateData.step4Completed = completed;
        break;
      default:
        throw new Error(`Invalid step number: ${step}`);
    }
    
    const [draft] = await db.update(draftListings)
      .set(updateData)
      .where(eq(draftListings.id, id))
      .returning();
    return draft;
  }

  async markStepCompleted(id: number, step: number): Promise<DraftListing> {
    return this.updateStepCompletion(id, step, true);
  }

  async markStepIncomplete(id: number, step: number): Promise<DraftListing> {
    return this.updateStepCompletion(id, step, false);
  }

  async getStepCompletionStatus(id: number): Promise<{
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
  } | null> {
    const draft = await this.getDraftListing(id);
    if (!draft) return null;
    
    return {
      step1: draft.step1Completed || false,
      step2: draft.step2Completed || false,
      step3: draft.step3Completed || false,
      step4: draft.step4Completed || false,
    };
  }

  // Doping Packages Implementation
  async getDopingPackages(): Promise<DopingPackage[]> {
    const packages = await db.select()
      .from(dopingPackages)
      .orderBy(asc(dopingPackages.sortOrder), asc(dopingPackages.name));
    return packages;
  }

  async getDopingPackageById(id: number): Promise<DopingPackage | undefined> {
    const [dopingPackage] = await db.select()
      .from(dopingPackages)
      .where(eq(dopingPackages.id, id));
    return dopingPackage;
  }

  async createDopingPackage(data: InsertDopingPackage): Promise<DopingPackage> {
    const [dopingPackage] = await db.insert(dopingPackages)
      .values(data)
      .returning();
    return dopingPackage;
  }

  async updateDopingPackage(id: number, updates: UpdateDopingPackage): Promise<DopingPackage> {
    const [dopingPackage] = await db.update(dopingPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dopingPackages.id, id))
      .returning();
    return dopingPackage;
  }

  async deleteDopingPackage(id: number): Promise<void> {
    await db.delete(dopingPackages).where(eq(dopingPackages.id, id));
  }

  async reorderDopingPackages(packageIds: number[]): Promise<void> {
    for (let i = 0; i < packageIds.length; i++) {
      await db.update(dopingPackages)
        .set({ sortOrder: i + 1 })
        .where(eq(dopingPackages.id, packageIds[i]));
    }
  }

  // Listing Packages Implementation
  async getListingPackages(): Promise<ListingPackage[]> {
    const packages = await db.select()
      .from(listingPackages)
      .orderBy(asc(listingPackages.sortOrder), asc(listingPackages.name));
    return packages;
  }

  async getListingPackageById(id: number): Promise<ListingPackage | undefined> {
    const [listingPackage] = await db.select()
      .from(listingPackages)
      .where(eq(listingPackages.id, id));
    return listingPackage;
  }

  async getListingPackageWithPricing(id: number): Promise<ListingPackageWithPricing | undefined> {
    const [listingPackage] = await db.select()
      .from(listingPackages)
      .where(eq(listingPackages.id, id));
    
    if (!listingPackage) return undefined;

    const categoryPricing = await db.select()
      .from(listingPackageCategoryPricing)
      .where(eq(listingPackageCategoryPricing.packageId, id));

    return {
      ...listingPackage,
      categoryPricing
    };
  }

  async createListingPackage(data: InsertListingPackage): Promise<ListingPackage> {
    const [listingPackage] = await db.insert(listingPackages)
      .values(data)
      .returning();
    return listingPackage;
  }

  async updateListingPackage(id: number, updates: UpdateListingPackage): Promise<ListingPackage> {
    const [listingPackage] = await db.update(listingPackages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listingPackages.id, id))
      .returning();
    return listingPackage;
  }

  async deleteListingPackage(id: number): Promise<void> {
    await db.delete(listingPackages).where(eq(listingPackages.id, id));
  }

  async reorderListingPackages(packageIds: number[]): Promise<void> {
    for (let i = 0; i < packageIds.length; i++) {
      await db.update(listingPackages)
        .set({ sortOrder: i + 1 })
        .where(eq(listingPackages.id, packageIds[i]));
    }
  }

  // Listing Package Category Pricing Implementation
  async getPackageCategoryPricing(packageId: number): Promise<ListingPackageCategoryPricing[]> {
    const pricing = await db.select()
      .from(listingPackageCategoryPricing)
      .where(eq(listingPackageCategoryPricing.packageId, packageId))
      .orderBy(asc(listingPackageCategoryPricing.categoryId));
    return pricing;
  }

  async createPackageCategoryPricing(data: InsertListingPackageCategoryPricing): Promise<ListingPackageCategoryPricing> {
    const [pricing] = await db.insert(listingPackageCategoryPricing)
      .values(data)
      .returning();
    return pricing;
  }

  async updatePackageCategoryPricing(id: number, updates: UpdateListingPackageCategoryPricing): Promise<ListingPackageCategoryPricing> {
    const [pricing] = await db.update(listingPackageCategoryPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(listingPackageCategoryPricing.id, id))
      .returning();
    return pricing;
  }

  async deletePackageCategoryPricing(id: number): Promise<void> {
    await db.delete(listingPackageCategoryPricing).where(eq(listingPackageCategoryPricing.id, id));
  }

  async deletePackageCategoryPricingByPackage(packageId: number): Promise<void> {
    await db.delete(listingPackageCategoryPricing)
      .where(eq(listingPackageCategoryPricing.packageId, packageId));
  }

  // Corporate Package Allocation Implementation
  async getCorporatePackageAllocations(corporateUserId: number): Promise<CorporatePackageAllocation[]> {
    const allocations = await db.select()
      .from(corporatePackageAllocations)
      .where(eq(corporatePackageAllocations.corporateUserId, corporateUserId))
      .orderBy(desc(corporatePackageAllocations.createdAt));
    return allocations;
  }

  async createCorporatePackageAllocation(data: InsertCorporatePackageAllocation): Promise<CorporatePackageAllocation> {
    const [allocation] = await db.insert(corporatePackageAllocations)
      .values(data)
      .returning();
    return allocation;
  }

  async updateCorporatePackageAllocation(id: number, updates: Partial<CorporatePackageAllocation>): Promise<CorporatePackageAllocation> {
    const [allocation] = await db.update(corporatePackageAllocations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporatePackageAllocations.id, id))
      .returning();
    return allocation;
  }
}

export const storage = new DatabaseStorage();
