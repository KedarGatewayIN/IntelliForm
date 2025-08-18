import { pgTable, foreignKey, uuid, text, json, timestamp, unique, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const aiConversations = pgTable("ai_conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	submissionId: uuid("submission_id").notNull(),
	fieldId: text("field_id").notNull(),
	messages: json().default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.submissionId],
			foreignColumns: [submissions.id],
			name: "ai_conversations_submission_id_submissions_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const forms = pgTable("forms", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	userId: uuid("user_id").notNull(),
	fields: json().default([]).notNull(),
	settings: json().default({}).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "forms_user_id_users_id_fk"
		}),
]);

export const submissions = pgTable("submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	formId: uuid("form_id").notNull(),
	data: json().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }).defaultNow().notNull(),
	timeTaken: integer("time_taken"),
	ipAddress: text("ip_address"),
	aiProblem: text("ai_problem"),
	resolved: boolean().default(false).notNull(),
	resolutionComment: text("resolution_comment"),
}, (table) => [
	foreignKey({
			columns: [table.formId],
			foreignColumns: [forms.id],
			name: "submissions_form_id_forms_id_fk"
		}),
]);
