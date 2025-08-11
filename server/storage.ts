import { 
  users, 
  forms, 
  submissions, 
  aiConversations,
  type User, 
  type InsertUser, 
  type Form, 
  type InsertForm,
  type Submission,
  type InsertSubmission,
  type AIConversation,
  type InsertAIConversation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, avg, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Form methods
  getUserForms(userId: string): Promise<Form[]>;
  getForm(id: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, updates: Partial<Form>): Promise<Form>;
  deleteForm(id: string): Promise<void>;

  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getFormSubmissions(formId: string): Promise<Submission[]>;
  getFormAnalytics(formId: string): Promise<any>;

  // AI Conversation methods
  saveAIConversation(conversation: InsertAIConversation): Promise<AIConversation>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
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
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserForms(userId: string): Promise<Form[]> {
    const userForms = await db
      .select()
      .from(forms)
      .where(eq(forms.userId, userId))
      .orderBy(desc(forms.updatedAt));
    
    // Get submission counts for each form
    const formsWithCounts = await Promise.all(
      userForms.map(async (form) => {
        const [submissionCount] = await db
          .select({ count: count() })
          .from(submissions)
          .where(eq(submissions.formId, form.id));
        
        const [aiCount] = await db
          .select({ count: count() })
          .from(aiConversations)
          .leftJoin(submissions, eq(submissions.id, aiConversations.submissionId))
          .where(eq(submissions.formId, form.id));

        return {
          ...form,
          submissions: Array(submissionCount.count || 0),
          aiConversations: aiCount.count || 0,
        };
      })
    );

    return formsWithCounts;
  }

  async getForm(id: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form || undefined;
  }

  async createForm(form: InsertForm): Promise<Form> {
    const [newForm] = await db
      .insert(forms)
      .values(form)
      .returning();
    return newForm;
  }

  async updateForm(id: string, updates: Partial<Form>): Promise<Form> {
    const [updatedForm] = await db
      .update(forms)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(forms.id, id))
      .returning();
    return updatedForm;
  }

  async deleteForm(id: string): Promise<void> {
    // Delete related data first
    await db.delete(aiConversations)
      .where(sql`submission_id IN (SELECT id FROM submissions WHERE form_id = ${id})`);
    
    await db.delete(submissions).where(eq(submissions.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db
      .insert(submissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getFormSubmissions(formId: string): Promise<Submission[]> {
    const formSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.formId, formId))
      .orderBy(desc(submissions.completedAt));

    // Get AI conversations for each submission
    const submissionsWithAI = await Promise.all(
      formSubmissions.map(async (submission) => {
        const conversations = await db
          .select()
          .from(aiConversations)
          .where(eq(aiConversations.submissionId, submission.id));

        return {
          ...submission,
          aiConversations: conversations,
        };
      })
    );

    return submissionsWithAI;
  }
  
  async getFormSubmission(submissionId: string): Promise<Submission[]> {
    const formSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));

    return formSubmissions;
  }

  async getFormAnalytics(formId: string): Promise<any> {
    // Get total responses
    const [totalResponsesResult] = await db
      .select({ count: count() })
      .from(submissions)
      .where(eq(submissions.formId, formId));

    const totalResponses = totalResponsesResult.count || 0;

    // Get AI interactions count
    const [aiInteractionsResult] = await db
      .select({ count: count() })
      .from(aiConversations)
      .leftJoin(submissions, eq(submissions.id, aiConversations.submissionId))
      .where(eq(submissions.formId, formId));

    const aiInteractions = aiInteractionsResult.count || 0;

    // Get average time taken
    const [avgTimeResult] = await db
      .select({ avgTime: avg(submissions.timeTaken) })
      .from(submissions)
      .where(eq(submissions.formId, formId));

    const averageTimeSeconds = Math.round(Number(avgTimeResult.avgTime) || 0);

    // For now, assume 100% completion rate since we only store completed submissions
    const completionRate = totalResponses > 0 ? 100 : 0;

    // Get recent responses
    const recentResponses = await db
      .select({
        id: submissions.id,
        completedAt: submissions.completedAt,
        timeTaken: submissions.timeTaken,
      })
      .from(submissions)
      .where(eq(submissions.formId, formId))
      .orderBy(desc(submissions.completedAt))
      .limit(10);

    return {
      totalResponses,
      completionRate,
      aiInteractions,
      averageTimeSeconds,
      recentResponses: recentResponses.map(response => ({
        ...response,
        hasAiInteractions: false, // This would need a more complex query
        status: "completed",
      })),
      responsesByDay: [], // This would need aggregation by date
    };
  }

  async saveAIConversation(conversation: InsertAIConversation): Promise<AIConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();
    return newConversation;
  }
}

export const storage = new DatabaseStorage();
