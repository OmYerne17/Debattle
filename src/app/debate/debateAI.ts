'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiResponse {
  content: string;
  role: 'AI1' | 'AI2';
}

// Model names
const MODEL_NAME_PRO = 'gemini-1.5-flash';
const MODEL_NAME_FLASH = 'gemini-1.5-flash';

function truncateTo30Words(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 30) return text;
  return words.slice(0, 30).join(' ') + '...';
}

export class DebateAI {
  private generativeClient: GoogleGenerativeAI | null = null;
  private proModel: any = null;
  private conModel: any = null;
  private proChat: any = null;
  private conChat: any = null;
  private topic: string = '';
  private apiKey: string | undefined;
  private initialized: boolean = false;

  constructor(apiKey: string | undefined) {
    this.apiKey = apiKey;
    if (this.apiKey) {
      this.initializeGenerativeAI();
    }
  }

  private initializeGenerativeAI() {
    try {
      if (!this.apiKey) {
        console.error("API Key not found");
        return;
      }
      this.generativeClient = new GoogleGenerativeAI(this.apiKey);
      this.proModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_PRO });
      this.conModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_FLASH });
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Gemini AI:", error);
      this.initialized = false;
    }
  }

  public setTopic(topic: string) {
    this.topic = topic;
    if (!this.initialized) {
      this.initializeGenerativeAI();
    }
    this.resetChatSessions();
  }

  private resetChatSessions() {
    if (!this.proModel || !this.conModel) {
      console.error("Models not initialized yet");
      return;
    }
    try {
      this.proChat = this.proModel.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `The debate topic is: ${this.topic}. Your task is to argue in favor of this position.` }],
          },
          {
            role: "model",
            parts: [{ text: `I understand that the topic is \"${this.topic}\". I'll be arguing in favor of this position, presenting the strongest supporting arguments and evidence.` }],
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      });
      this.conChat = this.conModel.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `The debate topic is: ${this.topic}. Your task is to argue against this position.` }],
          },
          {
            role: "model",
            parts: [{ text: `I understand that the topic is \"${this.topic}\". I'll be arguing against this position, presenting the strongest opposing arguments and evidence.` }],
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      });
    } catch (error) {
      console.error("Error resetting chat sessions:", error);
    }
  }

  public async generateInitialArguments(): Promise<GeminiResponse[]> {
    try {
      if (!this.initialized) {
        this.initializeGenerativeAI();
      }
      if (!this.topic) {
        throw new Error("Topic not set");
      }
      if (!this.proChat || !this.conChat) {
        this.resetChatSessions();
      }
      if (!this.proChat || !this.conChat) {
        throw new Error("Failed to initialize chat sessions");
      }
      const proPrompt = `Present your opening argument in favor of \"${this.topic}\". Be concise but persuasive, focusing on the strongest arguments. Keep your response under 30 words or use 2 clear points.`;
      const conPrompt = `Present your opening argument against \"${this.topic}\". Be concise but persuasive, focusing on the strongest arguments. Keep your response under 30 words or use 2 clear points.`;
      const [proResult, conResult] = await Promise.all([
        this.proChat.sendMessage(proPrompt),
        this.conChat.sendMessage(conPrompt)
      ]);
      const proText = truncateTo30Words(proResult.response.text() || 'Unable to generate argument in favor.');
      const conText = truncateTo30Words(conResult.response.text() || 'Unable to generate argument against.');
      return [
        { content: proText, role: 'AI1' },
        { content: conText, role: 'AI2' },
      ];
    } catch (error) {
      return this.generateArgumentsWithDirectAPI();
    }
  }

  private async generateArgumentsWithDirectAPI(): Promise<GeminiResponse[]> {
    try {
      if (!this.generativeClient) {
        throw new Error("Generative client not initialized");
      }
      const proModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_PRO });
      const proResult = await proModel.generateContent(
        `You are an AI debater arguing in FAVOR of the topic: \"${this.topic}\". Present your opening argument in favor of this topic. Be concise, persuasive, and logical. Focus on the strongest arguments. Keep your response under 30 words with points or 2 sentences.`
      );
      const conModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_FLASH });
      const conResult = await conModel.generateContent(
        `You are an AI debater arguing AGAINST the topic: \"${this.topic}\". Present your opening argument against this topic. Be concise, persuasive, and logical. Focus on the strongest arguments. Keep your response under 30 words with points or 2 sentences.`
      );
      const proText = truncateTo30Words(proResult.response.text() || 'Unable to generate argument in favor.');
      const conText = truncateTo30Words(conResult.response.text() || 'Unable to generate argument against.');
      return [
        { content: proText, role: 'AI1' },
        { content: conText, role: 'AI2' },
      ];
    } catch (error) {
      return [
        { content: 'Error generating argument in favor. Please try again.', role: 'AI1' },
        { content: 'Error generating argument against. Please try again.', role: 'AI2' },
      ];
    }
  }

  public async generateProResponse(message: string): Promise<string> {
    try {
      if (!this.proChat) {
        if (this.generativeClient) {
          const proModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_PRO });
          const result = await proModel.generateContent(
            `You are an AI debater arguing in FAVOR of the topic: \"${this.topic}\". ${message} Keep your response under 30 words or use 2 clear points.`
          );
          return truncateTo30Words(result.response.text() || 'Unable to generate a response.');
        }
        throw new Error("Pro AI chat not initialized");
      }
      const result = await this.proChat.sendMessage(message);
      return truncateTo30Words(result.response.text() || 'Unable to generate a response.');
    } catch (error) {
      return 'Error generating a response. Please try again.';
    }
  }

  public async generateConResponse(message: string): Promise<string> {
    try {
      if (!this.conChat) {
        if (this.generativeClient) {
          const conModel = this.generativeClient.getGenerativeModel({ model: MODEL_NAME_FLASH });
          const result = await conModel.generateContent(
            `You are an AI debater arguing AGAINST the topic: \"${this.topic}\". ${message} Keep your response under 30 words or use 2 clear points.`
          );
          return truncateTo30Words(result.response.text() || 'Unable to generate a response.');
        }
        throw new Error("Con AI chat not initialized");
      }
      const result = await this.conChat.sendMessage(message);
      return truncateTo30Words(result.response.text() || 'Unable to generate a response.');
    } catch (error) {
      return 'Error generating a response. Please try again.';
    }
  }
}

export async function generateDebateArguments(topic: string, apiKey: string): Promise<GeminiResponse[]> {
  try {
    if (!apiKey) {
      throw new Error('Missing API key');
    }
    const debateAI = new DebateAI(apiKey);
    debateAI.setTopic(topic);
    return await debateAI.generateInitialArguments();
  } catch (error) {
    return [
      { content: 'Error generating argument in favor. Please try again later.', role: 'AI1' },
      { content: 'Error generating argument against. Please try again later.', role: 'AI2' },
    ];
  }
} 