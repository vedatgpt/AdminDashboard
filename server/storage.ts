import { users, type User, type InsertUser, type LoginData, type RegisterData } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
