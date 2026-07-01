import { LanguageCode } from './types';

interface AIProvider {
  name: string;
  translateText(text: string, targetLanguage: LanguageCode): Promise<string | null>;
  generateMeaning(quote: string, language: LanguageCode): Promise<string | null>;
  isRateLimitError(error: any): boolean;
}

class GroqProvider implements AIProvider {
  name = 'Groq';
  
  constructor(private apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const targetLangName = languageNames[targetLanguage];
    
    const prompt = `Translate the following text to ${targetLangName}.

Requirements:
- Provide accurate translation
- Preserve the original meaning
- Maintain the quote style and tone
- Return ONLY the translation, no explanations
- For Uzbek: Use proper Uzbek Latin script with apostrophes (o', sh, ch, ng, g', etc.)

Text to translate:
${text}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      return null;
    } catch (error) {
      console.error('Groq translation error:', error);
      throw error;
    }
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const langName = languageNames[language];
    
    const prompt = `Explain the meaning of the following quote in ${langName}.

Requirements:
- Explain the quote simply and clearly
- Keep the explanation concise (2-3 sentences)
- Focus on practical life lessons
- Use ${langName} language
- Avoid long essays or academic language

Quote:
${quote}

Provide the explanation in this format:
Meaning:
"Your explanation here"`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      return null;
    } catch (error) {
      console.error('Groq meaning generation error:', error);
      throw error;
    }
  }

  isRateLimitError(error: any): boolean {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('quota');
  }
}

class CohereProvider implements AIProvider {
  name = 'Cohere';
  
  constructor(private apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Name': 'NightlyWisdomBot'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.generations && data.generations[0] && data.generations[0].text) {
        return data.generations[0].text.trim();
      }

      return null;
    } catch (error) {
      console.error('Cohere translation error:', error);
      throw error;
    }
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Name': 'NightlyWisdomBot'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.generations && data.generations[0] && data.generations[0].text) {
        return data.generations[0].text.trim();
      }

      return null;
    } catch (error) {
      console.error('Cohere meaning generation error:', error);
      throw error;
    }
  }

  isRateLimitError(error: any): boolean {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('quota');
  }
}

class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  
  constructor(private apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      return null;
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }

      return null;
    } catch (error) {
      console.error('OpenAI meaning generation error:', error);
      throw error;
    }
  }

  isRateLimitError(error: any): boolean {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('quota');
  }
}

class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  
  constructor(private apiKey: string) {
    this.apiKey = apiKey;
  }

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text.trim();
      }

      return null;
    } catch (error) {
      console.error('Anthropic translation error:', error);
      throw error;
    }
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    const languageNames: Record<LanguageCode, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text.trim();
      }

      return null;
    } catch (error) {
      console.error('Anthropic meaning generation error:', error);
      throw error;
    }
  }

  isRateLimitError(error: any): boolean {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes('rate limit') || errorStr.includes('429') || errorStr.includes('quota');
  }
}

export class MultiProviderAIService {
  private providers: AIProvider[] = [];
  private providerIndex = 0;

  constructor(env: any) {
    this.initializeProviders(env);
  }

  private initializeProviders(env: any): void {
    // Groq
    if (env.GROQ_API_KEY) {
      this.providers.push(new GroqProvider(env.GROQ_API_KEY));
      console.log('Groq provider initialized');
    }

    // Cohere
    if (env.COHERE_API_KEY) {
      this.providers.push(new CohereProvider(env.COHERE_API_KEY));
      console.log('Cohere provider initialized');
    }

    // OpenAI
    if (env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(env.OPENAI_API_KEY));
      console.log('OpenAI provider initialized');
    }

    // Anthropic
    if (env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider(env.ANTHROPIC_API_KEY));
      console.log('Anthropic provider initialized');
    }

    if (this.providers.length === 0) {
      throw new Error('No AI providers configured. Please set at least one API key.');
    }

    console.log(`Initialized ${this.providers.length} AI providers`);
  }

  private getNextProvider(): AIProvider {
    const provider = this.providers[this.providerIndex];
    this.providerIndex = (this.providerIndex + 1) % this.providers.length;
    return provider;
  }

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    let lastError: any = null;

    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.getNextProvider();

      try {
        console.log(`Attempting translation with ${provider.name}`);
        const result = await provider.translateText(text, targetLanguage);

        if (result) {
          console.log(`Translation successful with ${provider.name}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        if (provider.isRateLimitError(error)) {
          console.warn(`${provider.name} rate limited, trying next provider`);
        } else {
          console.error(`${provider.name} failed:`, error);
        }
      }
    }

    console.error(`All providers failed for translation. Last error:`, lastError);
    return null;
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    let lastError: any = null;

    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.getNextProvider();

      try {
        console.log(`Attempting meaning generation with ${provider.name}`);
        const result = await provider.generateMeaning(quote, language);

        if (result) {
          console.log(`Meaning generation successful with ${provider.name}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        if (provider.isRateLimitError(error)) {
          console.warn(`${provider.name} rate limited, trying next provider`);
        } else {
          console.error(`${provider.name} failed:`, error);
        }
      }
    }

    console.error(`All providers failed for meaning generation. Last error:`, lastError);
    return null;
  }
}

let aiServiceInstance: MultiProviderAIService | null = null;

export function getAIService(env: any): MultiProviderAIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new MultiProviderAIService(env);
  }
  return aiServiceInstance;
}
