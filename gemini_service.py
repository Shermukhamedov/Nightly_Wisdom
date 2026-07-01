import os
import logging
import google.generativeai as genai
from typing import Optional

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini service initialized with model: gemini-1.5-flash")
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        """
        Translate text to target language using Gemini API.
        
        Args:
            text: The text to translate
            target_language: Target language (uz, ru, en)
        
        Returns:
            Translated text or None if translation fails
        """
        try:
            language_names = {
                "uz": "Uzbek",
                "ru": "Russian", 
                "en": "English"
            }
            
            target_lang_name = language_names.get(target_language, target_language)
            
            prompt = f"""Translate the following text to {target_lang_name}.
            
Requirements:
- Provide accurate translation
- Preserve the original meaning
- Maintain the quote style and tone
- Return ONLY the translation, no explanations
- For Uzbek: Use proper Uzbek Latin script with apostrophes (o', sh, ch, ng, g', etc.)

Text to translate:
{text}"""
            
            logger.info(f"Requesting translation to {target_lang_name} (target_language: {target_language})")
            response = self.model.generate_content(prompt)
            
            if response.text:
                translated_text = response.text.strip()
                logger.info(f"Translation successful: {len(translated_text)} characters")
                return translated_text
            else:
                logger.error("Empty response from Gemini API")
                return None
                
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return None
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        """
        Generate meaning/explanation for a quote using Gemini API.
        
        Args:
            quote: The quote to explain
            language: Language for the explanation (uz, ru, en)
        
        Returns:
            Explanation text or None if generation fails
        """
        try:
            language_names = {
                "uz": "Uzbek",
                "ru": "Russian",
                "en": "English"
            }
            
            lang_name = language_names.get(language, language)
            
            prompt = f"""Explain the meaning of the following quote in {lang_name}.
            
Requirements:
- Explain the quote simply and clearly
- Keep the explanation concise (2-3 sentences)
- Focus on practical life lessons
- Use {lang_name} language
- Avoid long essays or academic language

Quote:
{quote}

Provide the explanation in this format:
Meaning:
"Your explanation here" """
            
            logger.info(f"Requesting meaning generation in {lang_name}")
            response = self.model.generate_content(prompt)
            
            if response.text:
                meaning = response.text.strip()
                logger.info(f"Meaning generation successful: {len(meaning)} characters")
                return meaning
            else:
                logger.error("Empty response from Gemini API")
                return None
                
        except Exception as e:
            logger.error(f"Meaning generation failed: {e}")
            return None

# Global instance
gemini_service = None

def get_gemini_service() -> GeminiService:
    """Get or create Gemini service instance."""
    global gemini_service
    if gemini_service is None:
        gemini_service = GeminiService()
    return gemini_service
