export interface AIProvider {
  complete(prompt: string, systemPrompt?: string): Promise<string>;
  validateConfig(): Promise<boolean>;
  name: string;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}
