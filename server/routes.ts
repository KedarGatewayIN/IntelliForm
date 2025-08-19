import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auth } from "./middleware/auth";
import { aiService } from "./services/ai";
import { loginSchema, registerSchema, insertFormSchema, insertSubmissionSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Form, Submission } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to generate CSV content from form submissions
function generateCSV(form: Form, submissions: Submission[]): string {
  if (submissions.length === 0) {
    return "";
  }

  // Extract field labels from the form
  const fieldLabels = form.fields.map(field => field.label);
  
  // Create CSV header
  const headers = [
    "Submission ID",
    "Completed At",
    "Time Taken (seconds)",
    "IP Address",
    "AI Problem",
    "AI Solutions",
    "Resolved",
    "Resolution Comment",
    ...fieldLabels
  ];
  
  // Create CSV rows
  const rows = submissions.map(submission => {
    const baseData = [
      submission.id,
      submission.completedAt ? new Date(submission.completedAt).toISOString() : "",
      submission.timeTaken || "",
      submission.ipAddress || "",
      submission.aiProblem || "",
      Array.isArray(submission.aiSolutions) ? submission.aiSolutions.join("; ") : "",
      submission.resolved ? "Yes" : "No",
      submission.resolutionComment || ""
    ];
    
    // Add form field data
    const fieldData = form.fields.map(field => {
      const value = submission.data[field.id];
      if (value === null || value === undefined) {
        return "";
      }
      if (Array.isArray(value)) {
        return value.join("; ");
      }
      return String(value);
    });
    
    return [...baseData, ...fieldData];
  });
  
  // Combine headers and rows
  const csvRows = [headers, ...rows];
  
  // Convert to CSV format (handle commas and quotes properly)
  return csvRows.map(row => 
    row.map(cell => {
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
      });
      
      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({ user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("auth-token");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", auth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, username: user.username, email: user.email, todoCount: await storage.getUserTodoCount(req.userId!) } });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Forms routes
  app.get("/api/forms", auth, async (req, res) => {
    try {
      const forms = await storage.getUserForms(req.userId!);
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Failed to get forms" });
    }
  });

  app.post("/api/forms", auth, async (req, res) => {
    try {
      const formData = insertFormSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      
      const form = await storage.createForm(formData);
      res.json(form);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create form" });
    }
  });

  app.get("/api/forms/:id", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check ownership
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form" });
    }
  });

  app.put("/api/forms/:id", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check ownership
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedForm = await storage.updateForm(req.params.id, {
        id: req.body.id,
        title: req.body.title,
        description: req.body.description,
        userId: req.body.userId,
        fields: req.body.fields,
        settings: req.body.settings,
        isPublished: req.body.isPublished,
      });
      res.json(updatedForm);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update form" });
    }
  });

  app.delete("/api/forms/:id", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check ownership
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteForm(req.params.id);
      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // Public form routes (for form filling)
  app.get("/api/public/forms/:id", async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form || !form.isPublished) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Return form without sensitive data
      const { userId, ...publicForm } = form;
      res.json(publicForm);
    } catch (error) {
      res.status(500).json({ message: "Failed to get form" });
    }
  });

  app.post("/api/public/forms/:id/submit", async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form || !form.isPublished) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      const submissionData = insertSubmissionSchema.parse({
        formId: req.params.id,
        data: req.body.data,
        timeTaken: req.body.timeTaken,
        ipAddress: req.ip,
      });
      
      const submission = await storage.createSubmission(submissionData);
      res.json({ submissionId: submission.id });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to submit form" });
    }
  });

  // Submissions routes
  app.get("/api/submissions/recent", auth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const offset = (page - 1) * pageSize;
      const total = await storage.countAllSubmissions({ userId: req.userId! });
      const submissions = await storage.getAllSubmissions({ offset, limit: pageSize, userId: req.userId! });
      res.json({ submissions, total, page, pageSize });
    } catch (error) {
      res.status(500).json({ message: "Failed to get recent submissions" });
    }
  });
  app.get("/api/forms/:id/submissions", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check ownership
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const submissions = await storage.getFormSubmissions(req.params.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get submissions" });
    }
  });
  app.get("/api/forms/:id/submission/:sid", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      const submissions = await storage.getFormSubmission(req.params.sid);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get submissions" });
    }
  });
  app.put("/api/submission/:sid", auth, async (req, res) => {
    try {
      const body = req.body as { resolved?: boolean; resolutionComment?: string };

      if (body && body.resolved === true) {
        const comment = (body.resolutionComment ?? "").trim();
        if (!comment) {
          return res.status(400).json({ message: "resolutionComment is required when resolving" });
        }
      }

      const updated = await storage.updateSubmission(req.params.sid, {
        ...req.body,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to get submissions" });
    }
  });

  app.get("/api/forms/:id/analytics", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      // Check ownership
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const analytics = await storage.getFormAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  app.get("/api/forms/:id/export", auth, async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (form.userId !== req.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const submissions = await storage.getFormSubmissions(req.params.id);
      
      if (submissions.length === 0) {
        return res.status(404).json({ message: "No submissions found for this form" });
      }

      const csvContent = generateCSV(form, submissions);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${form.title}_submissions_${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export form data" });
    }
  });

  // AI conversation routes
  app.get("/api/ai/summarize-problems", async(req, res) => {
    try {
      const response = await storage.summarizeProblems();
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "AI service unavailable" });
    }
  })
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, thread } = req.body;
      
      const response = await aiService.chat(message, thread);
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "AI service unavailable" });
    }
  });

  app.post("/api/ai/saveAIConversation", async (req, res) => {
    try {
      const { submissionId, fieldId, messages } = req.body as {
        submissionId: string,
        fieldId: string,
        messages: {
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
        }[],
      };
      
      if (!messages || !fieldId || !submissionId) {
        return res.status(400).json({ message: "Messages, submissionId and fieldId are required" });
      }
      
      const response = await storage.saveAIConversation({
        fieldId,
        submissionId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      });
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "AI service unavailable" });
    }
  });
  
  // AI conversation routes
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { conversation } = req.body;
      const response = await aiService.summarize(conversation);
      res.json({ response });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "AI service unavailable" });
    }
  });

  // Global search (authenticated)
  app.get("/api/search", auth, async (req, res) => {
    try {
      const q = (req.query.q as string) ?? "";
      const limit = parseInt((req.query.limit as string) ?? "5", 10);
      if (!q || q.trim().length === 0) {
        return res.json({ results: [] });
      }

      const results = await storage.searchAll({
        userId: req.userId!,
        query: q.trim(),
        limitPerType: Math.min(Math.max(limit, 1), 20),
      });

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Failed to search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
