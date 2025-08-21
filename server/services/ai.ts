import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ProblemRanking {
  problem: string;
  count: number;
  ids: string[];
}

class AIService {
  private llm: BaseChatModel;

  constructor() {
    const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();

    switch (provider) {
      case "openai": {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
          throw new Error("Missing OPENAI_API_KEY for AI_PROVIDER=openai");
        }
        const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
        this.llm = new ChatOpenAI({
          apiKey: openaiApiKey,
          temperature: 0.7,
          model: openaiModel,
        });
        break;
      }
      case "gemini": {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
          throw new Error("Missing GEMINI_API_KEY for AI_PROVIDER=gemini");
        }
        const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        this.llm = new ChatGoogleGenerativeAI({
          apiKey: geminiApiKey,
          temperature: 0.7,
          model: geminiModel,
        });
        break;
      }
      case "groq":
      default: {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
          throw new Error("Missing GROQ_API_KEY for AI_PROVIDER=groq");
        }
        const groqModel = process.env.GROQ_MODEL || "llama3-70b-8192";
        this.llm = new ChatGroq({
          apiKey: groqApiKey,
          temperature: 0.7,
          model: groqModel,
        });
        break;
      }
    }
  }

  /**
   * Handles a chat interaction and signals when the conversation is complete.
   * @returns An object with the AI's content and a boolean flag.
   */
  async chat(
    message: string,
    thread?: { role: "user" | "assistant"; content: string }[]
  ): Promise<{ content: string; conversation_finished: boolean }> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            Persona:
            You are a support assistant for The Gateway Corp. Your tone is professional, empathetic, and friendly.

            Primary Goal:
            Your primary role is to listen to the user, accurately identify their problem or feedback, and acknowledge it. You must not provide any solutions, email addresses, or support channel directions. Your entire purpose is to understand the user's issue (if any) and then stop.

            Core Workflow:
            Analyze the User's Input: Determine if the user's statement clearly identifies a specific problem.

            Clear Problem: (e.g., "My laptop screen is flickering," "The onboarding paperwork was excessive.")
            Unclear Problem: (e.g., "We need to improve," "I think we must go digital," "Things are too slow.")

            Handle Unclear Problems:
            If the problem is unclear, ask one targeted clarifying question to understand the specific area of concern. Your goal is to categorize the issue.
            Avoid open-ended questions. Guide the user toward a category (e.g., software, hardware, a specific process).
            Example for "We must go digitalization": "Going digital can definitely be a great step forward! To ensure I understand your feedback correctly, are you referring to a specific process like onboarding, or our digital services in general?"

            Acknowledge and Terminate:
            If the user have no problem or user gives positive feedback, you must acknowledge it and then stop.
            Once the problem is identified (either from the initial input or after your clarifying question), your job is complete.
            Acknowledge the specific issue you've identified.
            Immediately end the conversation using the [CONVERSATION_FINISHED] flag.

            Problem Identification Categories:
            Your acknowledgment should reflect the category of the problem:

            Software Issues: "Thank you for the feedback on the software."
            Hardware Issues: "Thank you for letting us know about the hardware issue."
            Onboarding Issues: "Thank you for highlighting your experience with the onboarding process."
            General Feedback: "Thank you for sharing your thoughts on [topic]."

            Conversation Termination Rule:
            You must apply the [CONVERSATION_FINISHED] flag as soon as the user's core problem has been clearly identified. This will happen in one of two ways:
            Immediately after the user's first message, if it's clear.
            Immediately after the user responds to your single clarifying question.

            Critical Rules to Follow:
            DO NOT ask "Do you have any issue?" if user give positive feedback or general feedback.
            DO NOT provide solutions.
            DO NOT provide email addresses or ask the user to contact another department.
            DO NOT ask "Is there anything else I can help you with?" or any similar follow-up question.
            DO NOT continue the conversation after the problem is identified. Acknowledge and end.

            Examples of New Behavior
            Example 1: Unclear Input Requiring Clarification
            User: "I think things are very inefficient here."
            LLM: "I see. To help me understand your feedback better, could you let me know if you're referring to a specific software, a company process, or something else?"
            User: "The paperwork for onboarding was just too much."
            LLM: "Thank you for clarifying. We've noted your feedback regarding the paperwork in the onboarding process. [CONVERSATION_FINISHED]"

            Example 2: Clear Input, Immediate Termination
            User: "My work laptop is running very slowly today."
            LLM: "Thank you for letting us know about the performance issue with your laptop. [CONVERSATION_FINISHED]"

            Example 3: Your "Digitalization" Scenario
            User: "I think we must go digitalization."
            LLM: "Going digital can definitely be a great step forward! To ensure I understand your feedback correctly, are you referring to a specific process like onboarding, or our digital services in general?"
            User: "I think there was a lot of paperwork stuff in onboarding."
            LLM: "Thank you for that clarification. We've noted your feedback on the amount of paperwork in the onboarding process. [CONVERSATION_FINISHED]"
            `,
        },
        ...(thread && thread?.length > 0 ? thread : []),
        {
          role: "user",
          content: message,
        },
      ]);

      let content = response.content as string;
      const conversationFinishedFlag = "[CONVERSATION_FINISHED]";
      let isFinished = false;

      if (content.includes(conversationFinishedFlag)) {
        isFinished = true;
        content = content.replace(conversationFinishedFlag, "").trim();
      }

      return { content, conversation_finished: isFinished };
    } catch (error) {
      console.error("AI service error:", error);
      throw new Error("AI service is currently unavailable");
    }
  }

  /**
   * Summarizes a conversation into a concise statement.
   */
  async summarize(conversation: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            You are an LLM that summarizes customer support chat conversations. Your primary goal is to analyze the provided stringified chat and create a clear, direct summary that identifies the user's problem.

            Core Instructions:
            Analyze the chat to understand the user's reason for contact.
            Your output must be a direct summary, without any introductory phrases like "Here's the summary:".
            If a problem is identified, describe the exact problem precisely.
            If there is no problem and the user is providing positive feedback or making a simple inquiry, summarize that positively or factually.
            Crucially, do not include any solutions, resolutions, guidance, or next steps (like contacting an email address) in your summary. Focus only on what the user's issue was.

            Summary Format Templates:

            For Problem Identification:
            "User contacted us regarding [SPECIFIC PROBLEM/ISSUE]."
            Example: "User contacted us regarding an installation failure with error code 80070643 for the new software."

            For General Inquiries:
            "User inquired about [TOPIC/SERVICE]."
            Example: "User inquired about the features included in the Pro subscription tier."

            For Unclear/Incomplete Conversations:
            "User mentioned [EXACT USER WORDS/PHRASES] but the conversation was [incomplete/unclear/cut short]."
            Example: "User mentioned 'it's not working' but the conversation was cut short before they could provide more details."

            For Positive Feedback:
            "User provided positive feedback about [SPECIFIC ASPECT] with no issues to resolve."
            Example: "User provided positive feedback about the quick resolution of their previous ticket."

            For Multiple Issues:
            "User contacted us about [PRIMARY ISSUE] and [SECONDARY ISSUE]."
            Example: "User contacted us about a login problem on the main portal and a broken link on the pricing page."

            Strict Rules:
            Problem-Focused Only: The summary must only describe the user's problem, inquiry, or feedback. Do NOT include any solutions, advice, or actions taken by the support agent.
            Be Specific: Replace generic terms like "an issue" with the exact problem (e.g., "laptop not starting," "software installation error," "account login problems").
            One Sentence Maximum: Keep the summary to a single, comprehensive sentence.
            Past Tense Only: Use past tense throughout ("contacted," "experienced," "inquired").
            No Interpretation: Stick strictly to what was explicitly discussed. Do not infer or add information not present in the chat.
            Preserve Key Details: Include specific error codes, product names, or technical details mentioned by the user.

            Quality Checklist:
            ✅ Identifies the specific problem, inquiry, or feedback.
            ✅ Contains NO solutions, resolutions, or agent actions.
            ✅ Is a direct summary without any introductory phrases.
            ✅ Written in a single, concise sentence using past tense.
            ✅ Captures the core reason for the user's contact accurately.

            Examples:

            Good: "User contacted us regarding their MacBook Pro not powering on after a recent update."
            Bad: "User had a problem and we helped them." (Too vague and mentions a solution).
            Bad: "User contacted us regarding their MacBook Pro not powering on and we directed them to contact hardware support." (Includes a solution/next step).
            Good: "User inquired about the process for setting up a new employee account."
            Good: "User expressed satisfaction with the recent software update, mentioning the improved user interface."
            `,
        },
        {
          role: "user",
          content: conversation,
        },
      ]);

      return response.content as string;
    } catch (error) {
      console.error("AI service error:", error);
      throw new Error("AI service is currently unavailable");
    }
  }

  async getSentimentAnalysis(chat: string) {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            1. Primary Goal
            You are a sentiment analysis assistant for The Gateway Corp. Analyze the provided chat and extract ALL distinct problems mentioned. For each problem, propose 1-3 concise, actionable solutions. Return ONLY valid JSON.

            2. Problem-First Principle
            If any problem, issue, or friction is mentioned anywhere, classify as action_needed, regardless of ratings or positive sentiments.

            3. Response Format (strict)
            - JSON only, no markdown fences or extra text.
            - If ANY problems detected:
              {"action":"action_needed","problems":[{"problem":"specific issue","solutions":["s1","s2"]}, {"problem":"second issue","solutions":["s1"]}]}
              - problems: 1..N entries; each solutions array is 1..3 length.
            - If NO problems:
              {"action":"no_action_needed"}

            4. Guidance and Examples
            Consider all fields like free-text comments for issues. Examples:
            Input: "Paperwork was heavy in onboarding and the office tour was confusing."
            Output: {"action":"action_needed","problems":[{"problem":"excessive paperwork in onboarding","solutions":["Digitize forms","Introduce e-signatures"]},{"problem":"confusing office tour during onboarding","solutions":["Provide a clear map","Assign an onboarding buddy"]}]}
          `,
        },
        {
          role: "user",
          content: chat,
        },
      ]);

      return response.content as string;
    } catch (error) {
      console.error("AI service error:", error);
      throw new Error("AI service is currently unavailable");
    }
  }

  async getProblemRanking(chat: string): Promise<ProblemRanking[]> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            You are an expert AI assistant specializing in granular problem analysis, solution generation, and data aggregation. Your primary goal is to parse user feedback, identify all distinct, specific problems mentioned, brainstorm actionable solutions for each, group them precisely, and output a ranked JSON summary.

            Core Logic for Problem Identification:
            Granularity is Key: Your primary task is to identify the most specific, actionable problems. Avoid broad, generic categories. For example, if a user mentions "paperwork" and "office tour," these are two separate problems, even if they both occurred during "onboarding."
            
            One Entry, Multiple Problems: A single submission ID can report multiple distinct issues. You must deconstruct the input text to identify and process each one separately. For example, the entry "user experienced issues with paperwork and office tour during onboarding - 2" contains TWO distinct problems: "issues with paperwork during onboarding" and "office tour during onboarding". Both of these problems are associated with ID "2".
            
            Precise Canonical Naming: The "problem" name should be a concise summary of the specific issue (e.g., "reducing paperwork in onboarding"), not a high-level category (e.g., "Onboarding Issues").

            Your process must be as follows:
            Parse and Deconstruct Input: Receive the single string of comma-separated "problem - ID" pairs. For each pair, meticulously analyze the description to identify every distinct problem mentioned.
            Group Specific Problems: Group entries that describe the exact same core issue. For example, "reducing paperwork" and "issues with paperwork" should be grouped, but "paperwork issues" and "office tour issues" should NOT be grouped together.
            Establish Descriptive Canonical Names: For each group, create a clear and descriptive canonical name that accurately reflects the specific problem.

            Generate Solutions: For each established canonical problem, smartly brainstorm 2-3 practical and actionable solutions. These solutions should directly address the problem. At least one solution must be provided.

            Aggregate Data: For each group, calculate the total count of mentions and collect all associated submission IDs. Remember that a single ID can appear in multiple groups if it reported multiple problems.

            Sort by Priority: Sort the final groups by count (descending), then alphabetically by the canonical problem name.
            Format Output as JSON: Generate a single, minified JSON string representing an array of objects.

            Each object must contain four keys:
            "problem": The descriptive canonical name string.
            "count": The aggregated count number.
            "ids": A JSON array of the submission IDs (as strings).
            "solutions": A JSON array of strings, where each string is an actionable solution. Provide 2-3 solutions if possible, with a minimum of one.

            Crucial Constraints:
            Do NOT provide any introductory or concluding text.
            Your entire response must be only the final, single-line, valid JSON string.

            Example 1 (Basic Grouping):
            Input: Slow performance - 1, UI is bad - 2, App crashes - 3, Bad performance - 4
            Output: [{"problem":"Slow performance","count":2,"ids":["1","4"],"solutions":["Optimize database queries","Implement caching for frequently accessed data","Analyze code for performance bottlenecks"]},{"problem":"App crashes","count":1,"ids":["3"],"solutions":["Implement comprehensive error handling and logging","Analyze crash logs to identify root cause","Increase test coverage for critical user flows"]},{"problem":"UI is bad","count":1,"ids":["2"],"solutions":["Conduct user experience (UX) research","Update the design system and component library","Simplify the user interface and navigation"]}]

            Example 2 (Complex Deconstruction and Grouping):
            Input: user suggested reducing paperwork in onboarding - 1, user experienced issues with paperwork and office tour during onboarding - 2
            Output: [{"problem":"reducing paperwork in onboarding","count":2,"ids":["1","2"],"solutions":["Digitize onboarding documents and forms","Implement an e-signature solution","Consolidate multiple forms into a single digital packet"]},{"problem":"office tour during onboarding","count":1,"ids":["2"],"solutions":["Create a self-guided virtual tour video","Provide a detailed office map with key locations","Assign an onboarding buddy to give a personalized tour"]}]`,
        },
        {
          role: "user",
          content: chat,
        },
      ]);

      const resultString = response.content as string;

      const problems: ProblemRanking[] = JSON.parse(resultString);

      return problems;
    } catch (error) {
      console.error("AI service error or invalid JSON response:", error);
      throw new Error(
        "Failed to get or parse problem ranking from AI service."
      );
    }
  }

  /**
   * Builds forms through conversation with the user
   */
  async buildForm(
    message: string,
    currentForm: any,
    conversationHistory?: any[]
  ): Promise<{ message: string; formData?: any }> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            You are an expert form builder AI assistant. Your role is to help users create forms through natural conversation.

            Core Capabilities:
            - Create forms based on user descriptions
            - Add, modify, or remove form fields
            - Suggest form improvements
            - Handle various field types: text, email, number, textarea, select, radio, checkbox, date, file, rating, slider
            - Set up form validation rules
            - Configure conditional logic
            - Create professional form titles and descriptions

            Response Format:
            You must respond with a JSON object containing:
            {
              "message": "Your conversational response to the user",
              "formData": {
                "title": "Form title",
                "description": "Form description",
                "fields": [array of field objects],
                "settings": {}
              }
            }

            Field Object Structure:
            {
              "id": "unique-id",
              "type": "field-type",
              "label": "Field Label",
              "placeholder": "Optional placeholder",
              "required": true/false,
              "options": ["array", "for", "select/radio/checkbox"],
              "validation": [{"type": "min/max/email/pattern", "value": "", "message": ""}],
              "aiEnabled": true/false
            }

            Conversation Guidelines:
            1. Be conversational and helpful
            2. Ask clarifying questions when needed
            3. Suggest improvements and best practices
            4. Update the form incrementally based on user requests
            5. Explain what changes you're making

            Examples of User Requests:
            - "Create a contact form"
            - "Add a rating field for satisfaction"
            - "Make the email field required"
            - "Add options to the dropdown"
            - "Remove the phone number field"

            Current Form State: ${JSON.stringify(currentForm)}
          `,
        },
        ...(conversationHistory || []).map((msg: any) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        {
          role: "user",
          content: message,
        },
      ]);

      let responseText = response.content as string;

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0]);
          return jsonResponse;
        }
      } catch (parseError) {
        // If JSON parsing fails, create a basic response
      }

      // Fallback: Create a simple form based on the message
      // if (
      //   !currentForm.title &&
      //   (message.toLowerCase().includes("create") ||
      //     message.toLowerCase().includes("build"))
      // ) {
      //   return {
      //     message:
      //       "I'll help you create that form! Let me start with a basic structure. What specific fields would you like to include?",
      //     formData: {
      //       title: this.extractFormTitle(message),
      //       description: "Please fill out this form",
      //       fields: this.generateBasicFields(message),
      //       settings: {},
      //     },
      //   };
      // }

      return {
        message:
          "I understand you want to work on the form. Could you be more specific about what you'd like to add or change?",
        formData: currentForm,
      };
    } catch (error) {
      console.error("AI form builder error:", error);
      throw new Error("AI form builder service is currently unavailable");
    }
  }

  // private extractFormTitle(message: string): string {
  //   const lowerMessage = message.toLowerCase();
  //   if (lowerMessage.includes("contact")) return "Contact Form";
  //   if (lowerMessage.includes("feedback")) return "Feedback Form";
  //   if (lowerMessage.includes("survey")) return "Survey Form";
  //   if (lowerMessage.includes("application")) return "Application Form";
  //   if (lowerMessage.includes("registration")) return "Registration Form";
  //   if (lowerMessage.includes("booking")) return "Booking Form";
  //   if (lowerMessage.includes("order")) return "Order Form";
  //   return "New Form";
  // }

  // private generateBasicFields(message: string): any[] {
  //   const lowerMessage = message.toLowerCase();
  //   const fields = [];

  //   // Always include name field
  //   fields.push({
  //     id: crypto.randomUUID(),
  //     type: "text",
  //     label: "Full Name",
  //     required: true,
  //     placeholder: "Enter your full name",
  //   });

  //   // Add email if mentioned or for contact forms
  //   if (lowerMessage.includes("email") || lowerMessage.includes("contact")) {
  //     fields.push({
  //       id: crypto.randomUUID(),
  //       type: "email",
  //       label: "Email Address",
  //       required: true,
  //       placeholder: "Enter your email address",
  //       validation: [
  //         {
  //           type: "email",
  //           value: "",
  //           message: "Please enter a valid email address",
  //         },
  //       ],
  //     });
  //   }

  //   // Add phone for contact/booking forms
  //   if (
  //     lowerMessage.includes("phone") ||
  //     lowerMessage.includes("contact") ||
  //     lowerMessage.includes("booking")
  //   ) {
  //     fields.push({
  //       id: crypto.randomUUID(),
  //       type: "text",
  //       label: "Phone Number",
  //       required: false,
  //       placeholder: "Enter your phone number",
  //     });
  //   }

  //   // Add message/comments field
  //   if (
  //     lowerMessage.includes("feedback") ||
  //     lowerMessage.includes("contact") ||
  //     lowerMessage.includes("message")
  //   ) {
  //     fields.push({
  //       id: crypto.randomUUID(),
  //       type: "textarea",
  //       label: lowerMessage.includes("feedback") ? "Your Feedback" : "Message",
  //       required: true,
  //       placeholder: "Please share your thoughts...",
  //     });
  //   }

  //   return fields;
  // }
}

export const aiService = new AIService();
