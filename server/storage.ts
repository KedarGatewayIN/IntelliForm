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
  type InsertAIConversation,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  desc,
  count,
  avg,
  sql,
  isNotNull,
  and,
  inArray,
} from "drizzle-orm";
import { aiService } from "./services/ai";

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
  saveAIConversation(
    conversation: InsertAIConversation
  ): Promise<AIConversation>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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
          .leftJoin(
            submissions,
            eq(submissions.id, aiConversations.submissionId)
          )
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
    const [newForm] = await db.insert(forms).values(form).returning();
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
    await db
      .delete(aiConversations)
      .where(
        sql`submission_id IN (SELECT id FROM submissions WHERE form_id = ${id})`
      );

    await db.delete(submissions).where(eq(submissions.formId, id));
    await db.delete(forms).where(eq(forms.id, id));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const form = await this.getForm(submission.formId);

    const context =
      Object.entries(submission.data)
        ?.map(([key, value]) => {
          const field = form?.fields.find((f) => f.id === key);
          return field ? `${field.label}: ${value}` : `${key}: ${value}`;
        })
        .join("\n") || "";

    const [newSubmission] = await db
      .insert(submissions)
      .values({
        formId: submission.formId,
        data: submission.data,
        timeTaken: submission.timeTaken,
        ipAddress: submission.ipAddress,
      })
      .returning();

    aiService.getSentimentAnalysis(context).then((aiResponse) => {
      const sentiment = JSON.parse(aiResponse) as unknown as {
        action: "action_needed" | "no_action_needed";
        reason?: string;
      };
      this.updateSubmission(newSubmission.id, {
        formId: submission.formId,
        data: submission.data,
        timeTaken: submission.timeTaken,
        ipAddress: submission.ipAddress,
        resolved: false,
        aiProblem: sentiment?.reason,
      });
    });

    return newSubmission;
  }

  async updateSubmission(
    submission_id: string,
    submission: Partial<InsertSubmission>
  ): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set({ ...submission })
      .where(eq(submissions.id, submission_id))
      .returning();
    return updatedSubmission;
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

  async getAllSubmissions({
    offset = 0,
    limit = 10,
  }: {
    offset?: number;
    limit?: number;
  }): Promise<(Submission & { formTitle: string | null })[]> {
    const allSubs = await db
      .select({
        id: submissions.id,
        formId: submissions.formId,
        data: submissions.data,
        completedAt: submissions.completedAt,
        timeTaken: submissions.timeTaken,
        aiProblem: submissions.aiProblem,
        resolved: submissions.resolved,
        ipAddress: submissions.ipAddress,
        formTitle: forms.title,
      })
      .from(submissions)
      .leftJoin(forms, eq(submissions.formId, forms.id))
      .orderBy(desc(submissions.completedAt))
      .offset(offset)
      .limit(limit);

    return allSubs;
  }

  async countAllSubmissions(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(submissions);
    return result.count || 0;
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
      recentResponses: recentResponses.map((response) => ({
        ...response,
        hasAiInteractions: false, // This would need a more complex query
        status: "completed",
      })),
      responsesByDay: [], // This would need aggregation by date
    };
  }

  async summarizeProblems() {
    // const result = await db
    //   .select({
    //     aiProblem: submissions.aiProblem,
    //     id: submissions.id,
    //   })
    //   .from(submissions)
    //   .where(
    //     and(eq(submissions.resolved, false), isNotNull(submissions.aiProblem))
    //   );

    // const unresolvedProblems = result
    //   .map((row) => `${row.aiProblem} - ${row.id}`)
    //   .join(", ");
    // const problems = await aiService.getProblemRanking(unresolvedProblems);
    const problems = [
      {
        problem: "reducing paperwork in onboarding",
        count: 2,
        ids: [
          "83fbc7ed-6c06-42a1-bb8f-f430c3a0d126",
          "6065e04a-21c9-4933-b00a-d63eac4e8f69",
        ],
      },
      {
        problem: "office tour during onboarding",
        count: 1,
        ids: ["6065e04a-21c9-4933-b00a-d63eac4e8f69"],
      },
    ];

    const submissionIds = Array.from(new Set(problems.flatMap((p) => p.ids)));

    const submissionWithForms = await db
      .select({
        submission_id: submissions.id,
        form_id: forms.id,
        title: forms.title,
      })
      .from(submissions)
      .innerJoin(forms, eq(forms.id, submissions.formId))
      .where(inArray(submissions.id, submissionIds));

    const finalData = problems.map((p) => {
      const matchingForms = submissionWithForms.filter((f) =>
        p.ids.includes(f.submission_id)
      );

      return {
        ...p,
        formName: Array.from(new Set(matchingForms.map((f) => f.title))),
        form: matchingForms.map((f) => ({
          form_id: f.form_id,
          submission_id: f.submission_id,
        })),
      };
    });

    return finalData;
  }

  async saveAIConversation(
    conversation: InsertAIConversation
  ): Promise<AIConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation)
      .returning();

    return newConversation;
  }
}

export const storage = new DatabaseStorage();
