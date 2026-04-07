'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiResponse {
  content: string;
  role: 'AI1' | 'AI2';
}

// Model names
const MODEL_NAME_PRO = 'gemini-2.5-flash-lite';
const MODEL_NAME_FLASH = 'gemini-2.5-flash-lite';

function truncateTo30Words(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= 30) return text;
  return words.slice(0, 30).join(' ') + '...';
}

export class DebateAI {
  private generativeClient: GoogleGenerativeAI | null = null;
  private proModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
  private conModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
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
      this.proModel = this.generativeClient.getGenerativeModel({ 
        model: MODEL_NAME_PRO,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      });
      this.conModel = this.generativeClient.getGenerativeModel({ 
        model: MODEL_NAME_FLASH,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.8,
          topK: 40
        }
      });
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
  }

  private extractTextFromResponse(response: any): string {
    try {
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      
      // Check if response has candidates array
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        
        // Check if candidate has content with parts
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          const text = candidate.content.parts[0].text;
          if (text && text.trim()) {
            return text.trim();
          }
        }
        
        // Check if candidate has content with text directly
        if (candidate.content && candidate.content.text) {
          const text = candidate.content.text;
          if (text && text.trim()) {
            return text.trim();
          }
        }
      }
      
      // Fallback: try to get text from response directly
      if (response.text) {
        return response.text().trim();
      }
      
      // Check if response has a text method
      if (typeof response.text === 'function') {
        const text = response.text();
        if (text && text.trim()) {
          return text.trim();
        }
      }
      
      console.warn('No text content found in response');
      return '';
    } catch (error) {
      console.error('Error extracting text from response:', error);
      return '';
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
      if (!this.proModel || !this.conModel) {
        throw new Error("Models not initialized");
      }

      const proPrompt = `You are an AI debater arguing in FAVOR of the topic: "${this.topic}". Present your opening argument in favor of this topic. Be concise, persuasive, and logical. Focus on the strongest arguments. Keep your response under 30 words with 2 clear points.`;
      const conPrompt = `You are an AI debater arguing AGAINST the topic: "${this.topic}". Present your opening argument against this topic. Be concise, persuasive, and logical. Focus on the strongest arguments. Keep your response under 30 words with 2 clear points.`;

      // console.log('Generating arguments for topic:', this.topic);
      // console.log('Pro prompt:', proPrompt);
      // console.log('Con prompt:', conPrompt);

      const [proResult, conResult] = await Promise.all([
        this.proModel.generateContent(proPrompt),
        this.conModel.generateContent(conPrompt)
      ]);

      // console.log('Pro result:', proResult);
      // console.log('Con result:', conResult);

      const proText = this.extractTextFromResponse(proResult.response);
      const conText = this.extractTextFromResponse(conResult.response);

      // console.log('Extracted pro text:', proText);
      // console.log('Extracted con text:', conText);

      const finalProText = proText ? truncateTo30Words(proText) : 'Unable to generate argument in favor.';
      const finalConText = conText ? truncateTo30Words(conText) : 'Unable to generate argument against.';

      return [
        { content: finalProText, role: 'AI1' },
        { content: finalConText, role: 'AI2' },
      ];
    } catch (error) {
      console.error('Error generating initial arguments:', error);
      return [
        { content: 'Error generating argument in favor. Please try again.', role: 'AI1' },
        { content: 'Error generating argument against. Please try again.', role: 'AI2' },
      ];
    }
  }

  public async generateProResponse(message: string): Promise<string> {
    try {
      if (!this.proModel) {
        throw new Error("Pro model not initialized");
      }

      const prompt = `You are an AI debater arguing in FAVOR of the topic: "${this.topic}". ${message} Keep your response under 30 words or use 2 clear points.`;
      
      const result = await this.proModel.generateContent(prompt);
      const text = this.extractTextFromResponse(result.response);
      
      return text ? truncateTo30Words(text) : 'Unable to generate a response.';
    } catch (error) {
      console.error('Error generating pro response:', error);
      return 'Error generating a response. Please try again.';
    }
  }

  public async generateConResponse(message: string): Promise<string> {
    try {
      if (!this.conModel) {
        throw new Error("Con model not initialized");
      }

      const prompt = `You are an AI debater arguing AGAINST the topic: "${this.topic}". ${message} Keep your response under 30 words or use 2 clear points.`;
      
      const result = await this.conModel.generateContent(prompt);
      const text = this.extractTextFromResponse(result.response);
      
      return text ? truncateTo30Words(text) : 'Unable to generate a response.';
    } catch (error) {
      console.error('Error generating con response:', error);
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
    console.error('Error in generateDebateArguments:', error);
    return [
      { content: 'Error generating argument in favor. Please try again later.', role: 'AI1' },
      { content: 'Error generating argument against. Please try again later.', role: 'AI2' },
    ];
  }
}