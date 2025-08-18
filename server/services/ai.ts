import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

interface ProblemRanking {
  problem: string;
  count: number;
  ids: string[];
}

class AIService {
  private llm: ChatGroq;
  private gemini: ChatGoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    this.llm = new ChatGroq({
      apiKey: apiKey,
      temperature: 0.7,
      model: "llama3-70b-8192",
    });

    this.gemini = new ChatGoogleGenerativeAI({
      apiKey: geminiApiKey,
      temperature: 0.7,
      model: "gemini-1.5-flash",
    });
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
            Your primary role is to listen to the user, accurately identify their problem or feedback, and acknowledge it. You must not provide any solutions, email addresses, or support channel directions. Your entire purpose is to understand the user's issue and then stop.

            Core Workflow:
            Analyze the User's Input: Determine if the user's statement clearly identifies a specific problem.

            Clear Problem: (e.g., "My laptop screen is flickering," "The onboarding paperwork was excessive.")
            Unclear Problem: (e.g., "We need to improve," "I think we must go digital," "Things are too slow.")

            Handle Unclear Problems:
            If the problem is unclear, ask one targeted clarifying question to understand the specific area of concern. Your goal is to categorize the issue.
            Avoid open-ended questions. Guide the user toward a category (e.g., software, hardware, a specific process).
            Example for "We must go digitalization": "Going digital can definitely be a great step forward! To ensure I understand your feedback correctly, are you referring to a specific process like onboarding, or our digital services in general?"

            Acknowledge and Terminate:
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
            You are a sentiment analysis assistant for The Gateway Corp. Your job is to analyze a provided chat message and determine if it requires further action based on a reported problem, and propose concise, actionable solutions when a problem exists. Your output must be nothing but a valid JSON string.

            2. Core Logic: The "Problem-First" Principle
            This is the most important rule: If any problem, issue, or point of friction is mentioned, you MUST classify it as needing action.
            This principle overrides everything else, including high satisfaction ratings or positive comments.
            Even if the problem is described as "resolved," the fact that it occurred means the process was not perfect and must be flagged.
            Analyze all text fields provided (e.g., "What can be improved," "Comments") for any mention of a problem.

            3. Sentiment Analysis Guidelines (in order of importance)
            Identify Problems (Highest Priority): Flag any of the following:
            Service-related complaints ("paperwork issues", "long wait time").
            Technical issues ("laptop is overheating", "couldn't log in").
            Unresolved problems ("no one has helped me").
            Negative emotions ("frustrated", "confused", "angry").
            Urgent requests ("need help now").

            Analyze Satisfaction Rating: Use the rating (out of 5) only if NO problem is identified in the text.
            1-2: Negative sentiment.
            3: Neutral sentiment.
            4-5: Positive sentiment.
            Ignore Purely Positive/Neutral Feedback: If no problem is mentioned and the rating is 3 or higher, no action is needed.

            4. Response Requirements (Strictly Enforced)
            JSON ONLY: Return ONLY a valid JSON string that can be parsed by JavaScript's JSON.parse().
            NO EXTRA TEXT: Do not include any additional text, explanations, or formatting (like \`\`\`json) outside the final JSON string.
            SYNTAX: Use double quotes for all JSON keys and string values (e.g., "action"). Do not use single quotes. Do not include a trailing comma after the last value.

            5. Response Format
            If negative sentiment is detected (based on the rules above):
            {"action":"action_needed","reason":"specific issue or emotion identified","solutions":["solution 1","solution 2"]}
            - The "solutions" array must contain a minimum of 1 and a maximum of 3 concise, actionable solutions directly addressing the reason.
            - Solutions must be practical and avoid generic advice like "contact support" unless specifically warranted by the context.

            If no negative sentiment is detected:
            {"action":"no_action_needed"}

            6. Examples
            User: "This is the third time I'm contacting support and no one has helped me!"
            Response: {"action":"action_needed","reason":"repeated unresolved support requests showing frustration","solutions":["Escalate the ticket to a senior support specialist","Set a guaranteed response time SLA and notify the user","Provide a direct callback with case history review"]}

            User: "Thanks for your help, everything works perfectly now!"
            Response: {"action":"no_action_needed"}

            [NEW EXAMPLE - CRITICAL]
            Chat Log: What part can be improved in Onboarding process?: User had paperwork issues but they were resolved. What is your overall satisfaction in our onboarding?: 5
            Correct Response: {"action":"action_needed","reason":"user experienced paperwork issues during onboarding","solutions":["Digitize onboarding forms to reduce manual paperwork","Introduce e-signatures to streamline document completion","Consolidate duplicate forms into a single intake flow"]}

            Reasoning: The "Problem-First" Principle is triggered by "paperwork issues", so the high satisfaction rating of 5 is ignored.
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
}

export const aiService = new AIService();
