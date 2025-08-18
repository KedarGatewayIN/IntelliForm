import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  userId: uuid("user_id").notNull().references(() => users.id),
  fields: json("fields").$type<FormField[]>().notNull().default(sql`'[]'::json`),
  settings: json("settings").$type<FormSettings>().notNull().default(sql`'{}'::json`),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: uuid("form_id").notNull().references(() => forms.id),
  data: json("data").$type<Record<string, any>>().notNull(),
  completedAt: timestamp("completed_at").default(sql`now()`).notNull(),
  timeTaken: integer("time_taken"), // in seconds
  aiProblem: text("ai_problem"),
  resolved: boolean("resolved").notNull().default(false),
  ipAddress: text("ip_address"),
  resolutionComment: text("resolution_comment"),
});

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: uuid("submission_id").notNull().references(() => submissions.id),
  fieldId: text("field_id").notNull(),
  messages: json("messages").$type<AIMessage[]>().notNull().default(sql`'[]'::json`),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  forms: many(forms),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  form: one(forms, {
    fields: [submissions.formId],
    references: [forms.id],
  }),
  aiConversations: many(aiConversations),
}));

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  submission: one(submissions, {
    fields: [aiConversations.submissionId],
    references: [submissions.id],
  }),
}));

// Types for form fields and settings
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule[];
  aiEnabled?: boolean;
  conditional?: ConditionalLogic;
  matrixRows?: string[];
  matrixColumns?: string[];
}

export interface FormSettings {
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  stepperMode?: boolean;
  allowBack?: boolean;
  showProgress?: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'email' | 'url' | 'pattern';
  value: string | number;
  message: string;
}

export interface ConditionalLogic {
  showIf: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
}

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'password'
  | 'url'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'date'
  | 'file'
  | 'rating'
  | 'slider'
  | 'matrix'
  | 'ai_conversation';

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  completedAt: true,
});

export const insertAIConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

// Inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type Form = typeof forms.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertAIConversation = z.infer<typeof insertAIConversationSchema>;
export type AIConversation = typeof aiConversations.$inferSelect;
