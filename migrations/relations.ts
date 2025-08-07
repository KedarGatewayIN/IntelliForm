import { relations } from "drizzle-orm/relations";
import { forms, submissions, aiConversations, users } from "./schema";

export const submissionsRelations = relations(submissions, ({one, many}) => ({
	form: one(forms, {
		fields: [submissions.formId],
		references: [forms.id]
	}),
	aiConversations: many(aiConversations),
}));

export const formsRelations = relations(forms, ({one, many}) => ({
	submissions: many(submissions),
	user: one(users, {
		fields: [forms.userId],
		references: [users.id]
	}),
}));

export const aiConversationsRelations = relations(aiConversations, ({one}) => ({
	submission: one(submissions, {
		fields: [aiConversations.submissionId],
		references: [submissions.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	forms: many(forms),
}));