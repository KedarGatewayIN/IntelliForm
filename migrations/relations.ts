import { relations } from "drizzle-orm/relations";
import { submissions, aiConversations, users, forms } from "./schema";

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [aiConversations.submissionId],
      references: [submissions.id],
    }),
  }),
);

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  aiConversations: many(aiConversations),
  form: one(forms, {
    fields: [submissions.formId],
    references: [forms.id],
  }),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  user: one(users, {
    fields: [forms.userId],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const usersRelations = relations(users, ({ many }) => ({
  forms: many(forms),
}));
