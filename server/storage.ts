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
import { Problem } from "@shared/schema";
import { randomUUID } from "crypto";
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
  getUserForms(userId: string): Promise<
    (Form & {
      submissions: Submission[];
      aiConversationCount: number;
    })[]
  >;
  getForm(id: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, updates: Partial<Form>): Promise<Form>;
  deleteForm(id: string): Promise<void>;

  // Submission methods
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getFormSubmissions(formId: string): Promise<Submission[]>;
  getFormAnalytics(formId: string): Promise<any>;
  getFilteredSubmissions(options: {
    userId: string;
    offset?: number;
    limit?: number;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      ip?: string;
      hasAiProblem?: boolean;
      resolved?: boolean;
      timeMin?: number;
      timeMax?: number;
      query?: string;
      aiQuery?: string;
      hasAiConversation?: boolean;
    };
  }): Promise<(Submission & { formTitle: string | null })[]>;
  countFilteredSubmissions(options: {
    userId: string;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      ip?: string;
      hasAiProblem?: boolean;
      resolved?: boolean;
      timeMin?: number;
      timeMax?: number;
      query?: string;
      aiQuery?: string;
      hasAiConversation?: boolean;
    };
  }): Promise<number>;

  // AI Conversation methods
  saveAIConversation(
    conversation: InsertAIConversation,
  ): Promise<AIConversation>;

  // Resolved problems (grouped)
  getResolvedProblemsGrouped(options: {
    userId: string;
    page?: number;
    pageSize?: number;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      query?: string;
    };
  }): Promise<{
    items: Array<{
      problem: string;
      count: number;
      form: Array<{
        form_id: string;
        title: string | null;
        submission_id: string;
        completed_at: string | null;
      }>;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>;

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
    // Count submissions that have at least one unresolved problem
    const sqlText = `
      SELECT COUNT(*)::int AS count
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      WHERE f.user_id = $1
        AND EXISTS (
          SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)') AS j
        )
    `;
    const { rows } = await pool.query<{ count: number }>(sqlText, [userId]);
    return rows[0]?.count || 0;
  }

  async getUserForms(userId: string): Promise<
    (Form & {
      submissions: Submission[];
      aiConversationCount: number;
    })[]
  > {
    type FormWithAgg = Form & {
      submissions: Submission[];
      aiConversationCount: number;
    };

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
              'problems', s.problems,
              'ipAddress', s.ip_address
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
    const [newForm] = await db
      .insert(forms)
      .values(form as any)
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
    await db
      .delete(aiConversations)
      .where(
        sql`submission_id IN (SELECT id FROM submissions WHERE form_id = ${id})`,
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
      try {
        const sentiment = JSON.parse(aiResponse) as unknown as
          | { problems?: { problem: string; solutions?: string[] }[] }
          | { reason?: string; solutions?: string[] };

        let problems: Problem[] = [];

        if ("problems" in sentiment && Array.isArray(sentiment.problems)) {
          problems = sentiment.problems
            .filter(
              (p) =>
                p &&
                typeof p.problem === "string" &&
                p.problem.trim().length > 0,
            )
            .slice(0, 10)
            .map((p) => ({
              id: randomUUID(),
              problem: p.problem.trim(),
              solutions: Array.isArray(p.solutions)
                ? p.solutions.slice(0, 3)
                : [],
              resolved: false,
              resolutionComment: "",
            }));
        } else if (
          "reason" in sentiment &&
          typeof sentiment.reason === "string" &&
          sentiment.reason.trim().length > 0
        ) {
          problems = [
            {
              id: randomUUID(),
              problem: sentiment.reason.trim(),
              solutions: Array.isArray((sentiment as any).solutions)
                ? (sentiment as any).solutions!.slice(0, 3)
                : [],
              resolved: false,
              resolutionComment: "",
            },
          ];
        }

        this.updateSubmission(newSubmission.id, {
          formId: submission.formId,
          data: submission.data,
          timeTaken: submission.timeTaken,
          ipAddress: submission.ipAddress,
          problems,
        });
      } catch (e) {
        console.error("Failed to parse AI sentiment response: ", e);
      }
    });

    return newSubmission;
  }

  async updateSubmission(
    submission_id: string,
    submission: Partial<InsertSubmission>,
  ): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(submission as any)
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
      }),
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
        problems: submissions.problems,
        ipAddress: submissions.ipAddress,
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

  async getFilteredSubmissions({
    userId,
    offset = 0,
    limit = 10,
    filters = {},
  }: {
    userId: string;
    offset?: number;
    limit?: number;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      ip?: string;
      hasAiProblem?: boolean;
      resolved?: boolean;
      timeMin?: number;
      timeMax?: number;
      query?: string;
      aiQuery?: string;
      hasAiConversation?: boolean;
    };
  }): Promise<(Submission & { formTitle: string | null })[]> {
    const params: any[] = [userId];
    const where: string[] = [`f.user_id = $${params.length}`];

    if (filters.formId) {
      params.push(filters.formId);
      where.push(`s.form_id = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      where.push(`s.completed_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      where.push(`s.completed_at <= $${params.length}`);
    }
    if (filters.ip) {
      params.push(`%${filters.ip}%`);
      where.push(`s.ip_address ILIKE $${params.length}`);
    }
    if (typeof filters.hasAiProblem === "boolean") {
      if (filters.hasAiProblem) {
        where.push(
          `EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      } else {
        where.push(
          `NOT EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      }
    }
    if (typeof filters.resolved === "boolean") {
      if (filters.resolved) {
        where.push(
          `NOT EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      } else {
        where.push(
          `EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      }
    }
    if (typeof filters.timeMin === "number") {
      params.push(filters.timeMin);
      where.push(`s.time_taken >= $${params.length}`);
    }
    if (typeof filters.timeMax === "number") {
      params.push(filters.timeMax);
      where.push(`s.time_taken <= $${params.length}`);
    }
    if (filters.query) {
      params.push(`%${filters.query}%`);
      where.push(`s.data::text ILIKE $${params.length}`);
    }
    if (filters.aiQuery) {
      params.push(`%${filters.aiQuery}%`);
      where.push(`s.problems::text ILIKE $${params.length}`);
    }
    if (typeof filters.hasAiConversation === "boolean") {
      if (filters.hasAiConversation) {
        where.push(
          `EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.submission_id = s.id)`,
        );
      } else {
        where.push(
          `NOT EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.submission_id = s.id)`,
        );
      }
    }

    // Pagination params
    params.push(offset);
    const offsetIndex = params.length;
    params.push(limit);
    const limitIndex = params.length;

    const sqlText = `
      SELECT 
        s.id,
        s.form_id as "formId",
        s.data,
        s.completed_at as "completedAt",
        s.time_taken as "timeTaken",
        s.problems,
        s.ip_address as "ipAddress",
        f.title as "formTitle"
      FROM submissions s
      LEFT JOIN forms f ON f.id = s.form_id
      WHERE ${where.join(" AND ")}
      ORDER BY s.completed_at DESC
      OFFSET $${offsetIndex}
      LIMIT $${limitIndex}
    `;

    const { rows } = await pool.query<
      Submission & { formTitle: string | null }
    >(sqlText, params);
    return rows;
  }

  async countFilteredSubmissions({
    userId,
    filters = {},
  }: {
    userId: string;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      ip?: string;
      hasAiProblem?: boolean;
      resolved?: boolean;
      timeMin?: number;
      timeMax?: number;
      query?: string;
      aiQuery?: string;
      hasAiConversation?: boolean;
    };
  }): Promise<number> {
    const params: any[] = [userId];
    const where: string[] = [`f.user_id = $${params.length}`];

    if (filters.formId) {
      params.push(filters.formId);
      where.push(`s.form_id = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      where.push(`s.completed_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      where.push(`s.completed_at <= $${params.length}`);
    }
    if (filters.ip) {
      params.push(`%${filters.ip}%`);
      where.push(`s.ip_address ILIKE $${params.length}`);
    }
    if (typeof filters.hasAiProblem === "boolean") {
      if (filters.hasAiProblem) {
        where.push(
          `EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      } else {
        where.push(
          `NOT EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      }
    }
    if (typeof filters.resolved === "boolean") {
      if (filters.resolved) {
        where.push(
          `NOT EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      } else {
        where.push(
          `EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == false)'))`,
        );
      }
    }
    if (typeof filters.timeMin === "number") {
      params.push(filters.timeMin);
      where.push(`s.time_taken >= $${params.length}`);
    }
    if (typeof filters.timeMax === "number") {
      params.push(filters.timeMax);
      where.push(`s.time_taken <= $${params.length}`);
    }
    if (filters.query) {
      params.push(`%${filters.query}%`);
      where.push(`s.data::text ILIKE $${params.length}`);
    }
    if (filters.aiQuery) {
      params.push(`%${filters.aiQuery}%`);
      where.push(`s.problems::text ILIKE $${params.length}`);
    }
    if (typeof filters.hasAiConversation === "boolean") {
      if (filters.hasAiConversation) {
        where.push(
          `EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.submission_id = s.id)`,
        );
      } else {
        where.push(
          `NOT EXISTS (SELECT 1 FROM ai_conversations ac WHERE ac.submission_id = s.id)`,
        );
      }
    }

    const countSql = `
      SELECT COUNT(*)::int as count
      FROM submissions s
      LEFT JOIN forms f ON f.id = s.form_id
      WHERE ${where.join(" AND ")}
    `;

    const { rows } = await pool.query<{ count: number }>(countSql, params);
    return rows[0]?.count ?? 0;
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
        hasAiInteractions: false,
        status: "completed",
      })),
      responsesByDay: [],
    };
  }

  async summarizeProblems() {
    const rows = await db
      .select({ id: submissions.id, problems: submissions.problems })
      .from(submissions);

    const unresolvedPairs: string[] = [];
    for (const row of rows) {
      const probs = (row.problems as unknown as Problem[]) || [];
      for (const p of probs) {
        if (p && p.problem && p.problem.trim().length > 0 && !p.resolved) {
          unresolvedPairs.push(`${p.problem} - ${row.id}`);
        }
      }
    }

    const unresolvedProblems = unresolvedPairs.join(", ");
    if (!unresolvedProblems.trim()) {
      return [] as any;
    }
    const problems = await aiService.getProblemRanking(unresolvedProblems);
    const submissionIds = Array.from(new Set(problems.flatMap((p) => p.ids)));

    const submissionWithForms = await db
      .select({
        submission_id: submissions.id,
        form_id: forms.id,
        title: forms.title,
        completed_at: submissions.completedAt,
      })
      .from(submissions)
      .innerJoin(forms, eq(forms.id, submissions.formId))
      .where(inArray(submissions.id, submissionIds));

    const finalData = problems.map((p) => {
      const matchingForms = submissionWithForms.filter((f) =>
        p.ids.includes(f.submission_id),
      );

      return {
        ...p,
        form: matchingForms.map((f) => ({
          form_id: f.form_id,
          title: f.title,
          submission_id: f.submission_id,
          completed_at: f.completed_at,
        })),
      };
    });

    return finalData.sort((a, b) => b.count - a.count);
  }

  async updateSubmissionProblem(
    submissionId: string,
    problemId: string,
    updates: { resolved?: boolean; resolutionComment?: string },
  ): Promise<Submission> {
    const [current] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId));
    if (!current) {
      throw new Error("Submission not found");
    }
    const currentProblems: Problem[] = (current as any).problems || [];
    const updatedProblems: Problem[] = currentProblems.map((p) =>
      p.id === problemId
        ? {
            ...p,
            resolved: updates.resolved ?? p.resolved,
            resolutionComment:
              typeof updates.resolutionComment === "string"
                ? updates.resolutionComment
                : p.resolutionComment,
          }
        : p,
    );

    return await this.updateSubmission(submissionId, {
      problems: updatedProblems,
    });
  }

  async resolveGroupedProblem(
    canonicalProblem: string,
    submissionIds: string[],
    resolutionComment: string,
  ): Promise<number> {
    const rows = await db
      .select()
      .from(submissions)
      .where(inArray(submissions.id, submissionIds));

    let updatedCount = 0;
    const norm = (s: string) => s.toLowerCase().trim();
    const canon = norm(canonicalProblem);

    for (const row of rows) {
      const probs: Problem[] = ((row as any).problems as Problem[]) || [];
      let changed = false;
      const next: Problem[] = probs.map((p) => {
        const pp = norm(p.problem);
        const matches =
          pp === canon || pp.includes(canon) || canon.includes(pp);
        if (!p.resolved && matches) {
          changed = true;
          return { ...p, resolved: true, resolutionComment };
        }
        return p;
      });
      if (changed) {
        await this.updateSubmission(row.id, {
          problems: next,
        });
        updatedCount++;
      }
    }
    return updatedCount;
  }

  async saveAIConversation(
    conversation: InsertAIConversation,
  ): Promise<AIConversation> {
    const [newConversation] = await db
      .insert(aiConversations)
      .values(conversation as any)
      .returning();

    return newConversation;
  }

  async getResolvedProblemsGrouped({
    userId,
    page = 1,
    pageSize = 10,
    filters = {},
  }: {
    userId: string;
    page?: number;
    pageSize?: number;
    filters?: {
      formId?: string;
      dateFrom?: string;
      dateTo?: string;
      query?: string;
    };
  }): Promise<{
    items: Array<{
      problem: string;
      count: number;
      form: Array<{
        form_id: string;
        title: string | null;
        submission_id: string;
        completed_at: string | null;
      }>;
    }>;
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params: any[] = [userId];
    const where: string[] = [
      `f.user_id = $${params.length}`,
      `EXISTS (SELECT 1 FROM jsonb_path_query_array((s.problems::jsonb), '$[*] ? (@.resolved == true)'))`,
    ];

    if (filters.formId) {
      params.push(filters.formId);
      where.push(`s.form_id = $${params.length}`);
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      where.push(`s.completed_at >= $${params.length}`);
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      where.push(`s.completed_at <= $${params.length}`);
    }
    if (filters.query && filters.query.trim()) {
      params.push(`%${filters.query.trim()}%`);
      where.push(`s.problems::text ILIKE $${params.length}`);
    }

    const sqlText = `
      SELECT s.id, s.form_id as form_id, s.completed_at as completed_at, s.problems, f.title
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      WHERE ${where.join(" AND ")}
      ORDER BY s.completed_at DESC
    `;

    const { rows } = await pool.query<{
      id: string;
      form_id: string;
      completed_at: string | null;
      problems: any;
      title: string | null;
    }>(sqlText, params);

    const normalize = (s: string) => s.toLowerCase().trim();
    const groups = new Map<
      string,
      {
        problem: string;
        count: number;
        form: Array<{
          form_id: string;
          title: string | null;
          submission_id: string;
          completed_at: string | null;
        }>;
      }
    >();

    for (const row of rows) {
      const probs: Problem[] = (row as any).problems || [];
      for (const p of probs) {
        if (!p?.problem) continue;
        if (p.resolved !== true) continue;
        const key = normalize(p.problem);
        if (!groups.has(key)) {
          groups.set(key, { problem: p.problem, count: 0, form: [] });
        }
        const g = groups.get(key)!;
        g.count += 1;
        g.form.push({
          form_id: row.form_id,
          title: row.title,
          submission_id: row.id,
          completed_at: row.completed_at,
        });
      }
    }

    const all = Array.from(groups.values()).sort((a, b) => b.count - a.count);
    const total = all.length;
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const safePage = Math.max(1, page);
    const start = (safePage - 1) * safePageSize;
    const items = all.slice(start, start + safePageSize);

    return { items, total, page: safePage, pageSize: safePageSize };
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
        [userId, like, limitPerType],
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
