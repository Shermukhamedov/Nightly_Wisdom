import { LanguageCode } from './types';

export class GeminiService {
  constructor(private apiKey: string) {}

  async translateText(text: string, targetLanguage: LanguageCode): Promise<string | null> {
    try {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const translatedText = data.candidates[0].content.parts[0].text?.trim();
        return translatedText || null;
      }

      return null;
    } catch (error) {
      console.error('Translation failed:', error);
      return null;
    }
  }

  async generateMeaning(quote: string, language: LanguageCode): Promise<string | null> {
    try {
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

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const meaning = data.candidates[0].content.parts[0].text?.trim();
        return meaning || null;
      }

      return null;
    } catch (error) {
      console.error('Meaning generation failed:', error);
      return null;
    }
  }
}

let geminiServiceInstance: GeminiService | null = null;

export function getGeminiService(apiKey: string): GeminiService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService(apiKey);
  }
  return geminiServiceInstance;
}
