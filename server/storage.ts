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
import { db, pool } from "./db";
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
  getUserTodoCount(userId: string): Promise<number>;

  // Form methods
  getUserForms(userId: string): Promise<(Form & { 
    submissions: Submission[]; 
    aiConversationCount: number;
  })[]>;
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

  // Search
  searchAll(options: {
    userId: string;
    query: string;
    limitPerType?: number;
  }): Promise<
    Array<
      | {
          type: "form";
          id: string;
          title: string;
          description?: string | null;
        }
      | {
          type: "submission";
          id: string; // submissionId
          formId: string;
          title: string | null; // form title
          snippet?: string | null;
        }
      | {
          type: "ai_conversation";
          id: string; // conversationId
          submissionId: string;
          formId: string;
          title: string | null; // form title
          snippet?: string | null;
        }
    >
  >;
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

  async getUserTodoCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(submissions)
      .leftJoin(forms, eq(submissions.formId, forms.id))
      .where(
        and(
          eq(forms.userId, userId),
          eq(submissions.resolved, false),
          isNotNull(submissions.aiProblem)
        )
      );
    return result?.count || 0;
  }

  async getUserForms(userId: string): Promise<(Form & {
    submissions: Submission[];
    aiConversationCount: number;
  })[]> {
    type FormWithAgg = Form & { submissions: Submission[]; aiConversationCount: number };

    const sqlText = `
      SELECT
        f.id,
        f.title,
        f.description,
        f.user_id AS "userId",
        f.fields,
        f.settings,
        f.is_published AS "isPublished",
        f.created_at AS "createdAt",
        f.updated_at AS "updatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'formId', s.form_id,
              'data', s.data,
              'completedAt', s.completed_at,
              'timeTaken', s.time_taken,
              'aiProblem', s.ai_problem,
              'resolved', s.resolved,
              'ipAddress', s.ip_address,
              'resolutionComment', s.resolution_comment
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        )::json AS submissions,
        (
          SELECT COUNT(*)::int
          FROM ai_conversations ac
          JOIN submissions s2 ON s2.id = ac.submission_id
          WHERE s2.form_id = f.id
        ) AS "aiConversationCount"
      FROM forms f
      LEFT JOIN submissions s ON s.form_id = f.id
      WHERE f.user_id = $1
      GROUP BY f.id
      ORDER BY f.updated_at DESC;
    `;

    const { rows } = await pool.query<FormWithAgg>(sqlText, [userId]);
    return rows;
  }

  async getForm(id: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form || undefined;
  }

  async createForm(form: InsertForm): Promise<Form> {
    const [newForm] = await db.insert(forms).values(form as any).returning();
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
    userId,
  }: {
    offset?: number;
    limit?: number;
    userId: string;
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
        resolutionComment: submissions.resolutionComment,
        formTitle: forms.title,
      })
      .from(submissions)
      .leftJoin(forms, eq(submissions.formId, forms.id))
      .where(eq(forms.userId, userId))
      .orderBy(desc(submissions.completedAt))
      .offset(offset)
      .limit(limit);

    return allSubs;
  }

  async countAllSubmissions({ userId }: { userId: string }): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(submissions)
      .leftJoin(forms, eq(submissions.formId, forms.id))
      .where(eq(forms.userId, userId));
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
    const aiProblems = await db
      .select({
        aiProblem: submissions.aiProblem,
        id: submissions.id,
      })
      .from(submissions)
      .where(
        and(eq(submissions.resolved, false), isNotNull(submissions.aiProblem))
      );

    const unresolvedProblems = aiProblems
      .map((row) => `${row.aiProblem} - ${row.id}`)
      .join(", ");
    const problems = await aiService.getProblemRanking(unresolvedProblems);
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
        form: matchingForms.map((f) => ({
          form_id: f.form_id,
          title: f.title,
          submission_id: f.submission_id,
        })),
      };
    });

    return finalData.sort((a, b) => b.count - a.count);
  }

  async saveAIConversation(
    conversation: InsertAIConversation
  ): Promise<AIConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation as any)
      .returning();

    return newConversation;
  }

  async searchAll({
    userId,
    query,
    limitPerType = 5,
  }: {
    userId: string;
    query: string;
    limitPerType?: number;
  }): Promise<
    Array<
      | {
          type: "form";
          id: string;
          title: string;
          description?: string | null;
        }
      | {
          type: "submission";
          id: string;
          formId: string;
          title: string | null;
          snippet?: string | null;
        }
      | {
          type: "ai_conversation";
          id: string;
          submissionId: string;
          formId: string;
          title: string | null;
          snippet?: string | null;
        }
    >
  > {
    const like = `%${query}%`;

    // Forms owned by the user
    const formsSql = `
      SELECT f.id, f.title, f.description
      FROM forms f
      WHERE f.user_id = $1 AND (f.title ILIKE $2 OR f.description ILIKE $2)
      ORDER BY f.updated_at DESC
      LIMIT $3
    `;

    // Submissions belonging to user's forms
    const submissionsSql = `
      SELECT s.id, s.form_id as "formId", f.title, LEFT(s.data::text, 160) as snippet
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      WHERE f.user_id = $1 AND (s.data::text ILIKE $2)
      ORDER BY s.completed_at DESC
      LIMIT $3
    `;

    // AI conversations belonging to user's forms
    const aiSql = `
      SELECT ac.id, ac.submission_id as "submissionId", s.form_id as "formId", f.title, LEFT(ac.messages::text, 160) as snippet
      FROM ai_conversations ac
      JOIN submissions s ON s.id = ac.submission_id
      JOIN forms f ON f.id = s.form_id
      WHERE f.user_id = $1 AND (ac.messages::text ILIKE $2)
      ORDER BY ac.created_at DESC
      LIMIT $3
    `;

    const [formsRes, submissionsRes, aiRes] = await Promise.all([
      pool.query<{ id: string; title: string; description: string | null }>(
        formsSql,
        [userId, like, limitPerType]
      ),
      pool.query<{
        id: string;
        formId: string;
        title: string | null;
        snippet: string | null;
      }>(submissionsSql, [userId, like, limitPerType]),
      pool.query<{
        id: string;
        submissionId: string;
        formId: string;
        title: string | null;
        snippet: string | null;
      }>(aiSql, [userId, like, limitPerType]),
    ]);

    const formsResults = formsRes.rows.map((r) => ({
      type: "form" as const,
      id: r.id,
      title: r.title,
      description: r.description,
    }));

    const submissionsResults = submissionsRes.rows.map((r) => ({
      type: "submission" as const,
      id: r.id,
      formId: r.formId,
      title: r.title,
      snippet: r.snippet,
    }));

    const aiResults = aiRes.rows.map((r) => ({
      type: "ai_conversation" as const,
      id: r.id,
      submissionId: r.submissionId,
      formId: r.formId,
      title: r.title,
      snippet: r.snippet,
    }));

    return [...formsResults, ...submissionsResults, ...aiResults];
  }
}

export const storage = new DatabaseStorage();
