import { users, calculations, type User, type InsertUser, type Calculation, type InsertCalculation } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Add calculation methods
  saveCalculation(calculation: InsertCalculation): Promise<Calculation>;
  getCalculations(): Promise<Calculation[]>;
  getRecentCalculations(limit: number): Promise<Calculation[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async saveCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const [savedCalculation] = await db
      .insert(calculations)
      .values(calculation)
      .returning();
    return savedCalculation;
  }

  async getCalculations(): Promise<Calculation[]> {
    return db.select().from(calculations).orderBy(calculations.id);
  }

  async getRecentCalculations(limit: number): Promise<Calculation[]> {
    return db
      .select()
      .from(calculations)
      .orderBy(desc(calculations.id))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
