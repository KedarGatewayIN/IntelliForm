import { ChatGroq } from "@langchain/groq";

class AIService {
  private llm: ChatGroq;

  constructor() {
    const apiKey =
      process.env.GROQ_API_KEY ||
      "default_key";
    this.llm = new ChatGroq({
      apiKey: apiKey,
      temperature: 0.7,
      model: "llama3-70b-8192",
    });
  }

  /**
   * Handles a chat interaction and signals when the conversation is complete.
   * @returns An object with the AI's content and a boolean flag.
   */
  async chat(
    message: string
  ): Promise<{ content: string; conversation_finished: boolean }> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            You are a support assistant for The Gateway Corp. Your tone is professional and friendly.
            Your primary role is to help users with their issues by providing quick resolution or directing them to appropriate support channels.

            Issue Handling:
            Software Issues: Direct users to software@thegatewaycorp.com.
            Hardware Issues: Direct users to hardware@thegatewaycorp.com.
            Onboarding Issues: Direct users to onboarding@thegatewaycorp.com.

            Conversation Termination Rules - Apply [CONVERSATION_FINISHED] flag when ANY of these occur:

            Explicit Positive Responses (End conversation immediately):
            User says: "thanks", "thank you", "all good", "perfect", "great", "awesome", "sounds good", "that helps", "got it", "understood"
            User expresses satisfaction: "that's exactly what I needed", "problem solved", "all set"
            User acknowledges completion: "I'll contact them", "will reach out", "I'll email them"

            Implicit Positive Signals (End conversation immediately):
            User shows acceptance without complaint
            User asks no follow-up questions after receiving solution
            User provides brief acknowledgment like "ok", "alright", "sure"

            Decline to Provide Feedback (End conversation immediately):
            User says: "no feedback", "nothing to add", "no comments", "I'm good", "no issues"
            User declines to elaborate: "don't need to say more", "that's it", "nothing else"

            Minor Issues Only (End conversation - 90% of cases):
            Basic questions about contact information
            Simple product information requests
            Standard troubleshooting that's resolved with email direction
            General inquiries that don't involve complex technical problems

            Continue Conversation ONLY when:
            User explicitly mentions specific problems, bugs, or negative feedback
            User expresses frustration, dissatisfaction, or complaint about service/product
            User describes complex technical issues requiring detailed troubleshooting
            User asks multiple follow-up questions indicating ongoing confusion

            Response Format:
            When ending conversation, provide solution then immediately add: [CONVERSATION_FINISHED]

            Example:
            "I see you're having trouble with your laptop. Please email hardware@thegatewaycorp.com for assistance. [CONVERSATION_FINISHED]"
            CRITICAL: Never ask "Do you have any other questions?" or "Is there anything else?" - Simply end with the flag when criteria are met.
            `,
        },
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
            You are a customer support conversation summarizer for The Gateway Corp. Analyze the provided conversation and create a precise summary following these strict guidelines:

            Summary Format Requirements:
            Primary Template (Use when clear issue and solution are present):
            "User contacted us regarding [SPECIFIC PROBLEM/ISSUE] and we directed them to contact [SPECIFIC EMAIL ADDRESS] for resolution."

            Alternative Templates (Use when appropriate):
            For General Inquiries:
            "User inquired about [TOPIC/SERVICE] and we provided them with [BRIEF OUTCOME/DIRECTION]."

            For Unclear/Incomplete Conversations:
            "User mentioned [EXACT USER WORDS/PHRASES] but the conversation was [incomplete/unclear/cut short]."

            For Positive Feedback Only:
            "User provided positive feedback about [SPECIFIC ASPECT] with no issues to resolve."

            For Multiple Issues:
            "User contacted us about [PRIMARY ISSUE] and [SECONDARY ISSUE], and we directed them to contact [EMAIL ADDRESS] and provided [ADDITIONAL GUIDANCE]."

            Strict Rules:
            Be Specific: Replace generic terms like "issue" with exact problems (e.g., "laptop not starting," "software installation error," "account login problems")
            Use Exact Email Addresses: Always include the complete email address mentioned (software@thegatewaycorp.com, hardware@thegatewaycorp.com, onboarding@thegatewaycorp.com)
            One Sentence Maximum: Keep summary to a single, comprehensive sentence
            Past Tense Only: Use past tense throughout ("contacted," "experienced," "resolved," "directed")
            No Interpretation: Stick strictly to what was explicitly discussed - don't infer or add context
            Preserve Key Details: Include specific error codes, product names, or technical details mentioned by the user

            Quality Checklist:
            ✅ Uses specific problem description (not vague terms)
            ✅ Includes exact email address when provided
            ✅ Written in past tense
            ✅ Single sentence format
            ✅ Contains no inferred information
            ✅ Captures the main resolution or next step

            Examples:
            Good: "User contacted us regarding their MacBook Pro not powering on after a recent update and we directed them to contact hardware@thegatewaycorp.com for resolution."
            Bad: "User had a problem and we helped them." (Too vague)
            Good: "User inquired about setting up their new employee account and we directed them to contact onboarding@thegatewaycorp.com for assistance."
            Good: "User mentioned 'everything was great' and expressed satisfaction with recent software installation support."
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
}

export const aiService = new AIService();
