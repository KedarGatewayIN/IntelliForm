import { ChatGroq } from "@langchain/groq";

class AIService {
  private llm: ChatGroq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "default_key";
    this.llm = new ChatGroq({
      apiKey: apiKey,
      temperature: 0.7,
      model: 'llama3-70b-8192',
    });
  }

  /**
   * Handles a chat interaction and signals when the conversation is complete.
   * @returns An object with the AI's content and a boolean flag.
   */
  async chat(message: string): Promise<{ content: string; conversation_finished: boolean }> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: `
            You are a support assistant for The Gateway Corp. Your tone is professional and friendly.
            Your primary role is to help users answer form questions by clarifying their issues.
            Issue Handling:
            - Software Issues: Direct users to software@thegatewaycorp.com.
            - Hardware Issues: Direct users to hardware@thegatewaycorp.com.
            - Onboarding Issues: Direct users to onboarding@thegatewaycorp.com.

            IMPORTANT: When you have provided a definitive solution or directed the user to the correct support channel, and you believe the conversation on this specific topic is complete, you MUST end your response with the exact flag: [CONVERSATION_FINISHED].
            This flag is critical for the application to proceed.
            If user says all good or nothing from his side or all was nice kind of 100% positive feedback, you can also end the conversation with the flag.
            Never ever ask him if he has any other questions or for further details, just end the conversation with the flag.

            Example with flag:
            "I see you're having trouble with your laptop. Please email hardware@thegatewaycorp.com for assistance. They will be able to help you with that. [CONVERSATION_FINISHED]"
            `
        },
        {
          role: "user", 
          content: message
        }
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
            You are a summarizer AI. Analyze the provided conversation and produce a one-sentence summary in the format: "User faced [X problem] and we suggested them to contact [Y] for it."
            If the conversation is unclear, just respond with what the user said.
            `
        },
        {
          role: "user", 
          content: conversation
        }
      ]);

      return response.content as string;
    } catch (error) {
      console.error("AI service error:", error);
      throw new Error("AI service is currently unavailable");
    }
  }
}

export const aiService = new AIService();