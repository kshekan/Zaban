import OpenAI from "openai";
import { AIProvider, AIProviderConfig } from "./provider";

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: "https://api.deepseek.com",
    });
    this.model = config.model || "deepseek-chat";
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 8192,
      messages,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Unexpected empty response from DeepSeek");
    }
    return content;
  }

  async validateConfig(): Promise<boolean> {
    try {
      await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
