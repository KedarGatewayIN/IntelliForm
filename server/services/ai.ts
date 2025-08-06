import { ChatGroq } from "@langchain/groq";

class AIService {
  private llm: ChatGroq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "default_key";
    this.llm = new ChatGroq({
      apiKey: apiKey,
      modelName: "llama3-70b-8192",
      temperature: 0.7,
    });
  }

  async chat(message: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        {
          role: "system",
          content: "You are a helpful AI assistant integrated into a form field. Provide helpful, concise responses to user queries. Keep responses conversational and supportive."
        },
        {
          role: "user", 
          content: message
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
