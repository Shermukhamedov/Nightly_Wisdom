import os
import logging
import asyncio
from typing import Optional, List
from abc import ABC, abstractmethod
import httpx
from gemini_service import get_gemini_service

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.name = self.__class__.__name__
    
    @abstractmethod
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        """Translate text to target language."""
        pass
    
    @abstractmethod
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        """Generate meaning/explanation for a quote."""
        pass
    
    def is_rate_limit_error(self, error: Exception) -> bool:
        """Check if error is a rate limit error."""
        error_str = str(error).lower()
        return any(keyword in error_str for keyword in ['rate limit', 'quota', '429', 'quota exceeded'])


class GroqProvider(AIProvider):
    """Groq API provider using Llama models."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = "llama-3.3-70b-versatile"
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
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
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("choices") and data["choices"][0].get("message"):
                    return data["choices"][0]["message"]["content"].strip()
                
                return None
                
        except Exception as e:
            logger.error(f"Groq translation error: {e}")
            raise
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        lang_name = language_names.get(language, language)
        
        prompt = f"Explain this quote in {lang_name} in 2-3 sentences: {quote}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("choices") and data["choices"][0].get("message"):
                    return data["choices"][0]["message"]["content"].strip()
                
                return None
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Groq meaning generation HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Groq API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Groq meaning generation error: {e}")
            raise


class CohereProvider(AIProvider):
    """Cohere API provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://api.cohere.ai/v1"
        self.model = "command"
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        target_lang_name = language_names.get(target_language, target_language)
        
        prompt = f"Translate the following text to {target_lang_name}. Return only the translation: {text}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "X-Client-Name": "NightlyWisdomBot"
                    },
                    json={
                        "model": self.model,
                        "message": prompt,
                        "max_tokens": 500,
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("text"):
                    return data["text"].strip()
                
                return None
                
        except Exception as e:
            logger.error(f"Cohere translation error: {e}")
            raise
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        lang_name = language_names.get(language, language)
        
        prompt = f"Explain the meaning of this quote in {lang_name} in 2-3 sentences: {quote}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "X-Client-Name": "NightlyWisdomBot"
                    },
                    json={
                        "model": self.model,
                        "message": prompt,
                        "max_tokens": 300,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("text"):
                    return data["text"].strip()
                
                return None
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Cohere meaning generation HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Cohere API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Cohere meaning generation error: {e}")
            raise


class OpenAIProvider(AIProvider):
    """OpenAI API provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://api.openai.com/v1"
        self.model = "gpt-3.5-turbo"
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        target_lang_name = language_names.get(target_language, target_language)
        
        prompt = f"Translate the following text to {target_lang_name}. Return only the translation: {text}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("choices") and data["choices"][0].get("message"):
                    return data["choices"][0]["message"]["content"].strip()
                
                return None
                
        except Exception as e:
            logger.error(f"OpenAI translation error: {e}")
            raise
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        lang_name = language_names.get(language, language)
        
        prompt = f"Explain the meaning of this quote in {lang_name} in 2-3 sentences: {quote}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("choices") and data["choices"][0].get("message"):
                    return data["choices"][0]["message"]["content"].strip()
                
                return None
                
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenAI meaning generation HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"OpenAI API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"OpenAI meaning generation error: {e}")
            raise


class AnthropicProvider(AIProvider):
    """Anthropic Claude API provider."""
    
    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.base_url = "https://api.anthropic.com/v1"
        self.model = "claude-3-5-haiku-20241022"
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        target_lang_name = language_names.get(target_language, target_language)
        
        prompt = f"Translate the following text to {target_lang_name}. Return only the translation: {text}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("content") and data["content"][0].get("text"):
                    return data["content"][0]["text"].strip()
                
                return None
                
        except Exception as e:
            logger.error(f"Anthropic translation error: {e}")
            raise
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        language_names = {"uz": "Uzbek", "ru": "Russian", "en": "English"}
        lang_name = language_names.get(language, language)
        
        prompt = f"Explain the meaning of this quote in {lang_name} in 2-3 sentences: {quote}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 300,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                
                if response.status_code == 429:
                    raise Exception(f"Rate limit exceeded: {response.text}")
                
                response.raise_for_status()
                data = response.json()
                
                if data.get("content") and data["content"][0].get("text"):
                    return data["content"][0]["text"].strip()
                
                return None
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Anthropic meaning generation HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Anthropic API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Anthropic meaning generation error: {e}")
            raise


class GeminiProvider(AIProvider):
    """Gemini API provider using existing gemini_service."""

    def __init__(self, api_key: str):
        super().__init__(api_key)
        self.gemini_service = get_gemini_service()

    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        """Translate text using Gemini service."""
        try:
            result = await self.gemini_service.translate_text(text, target_language)
            if result:
                return result
            raise Exception("Gemini returned empty translation")
        except Exception as e:
            logger.error(f"Gemini translation error: {e}")
            raise

    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        """Generate meaning using Gemini service."""
        try:
            result = await self.gemini_service.generate_meaning(quote, language)
            if result:
                return result
            raise Exception("Gemini returned empty meaning")
        except Exception as e:
            logger.error(f"Gemini meaning generation error: {e}")
            raise


class MultiProviderAIService:
    """Multi-provider AI service with automatic fallback."""
    
    def __init__(self):
        self.providers: List[AIProvider] = []
        self.provider_index = 0
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available providers from environment variables."""

        # Groq
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            self.providers.append(GroqProvider(groq_key))
            logger.info("Groq provider initialized")

        # Cohere
        cohere_key = os.getenv("COHERE_API_KEY")
        if cohere_key:
            self.providers.append(CohereProvider(cohere_key))
            logger.info("Cohere provider initialized")

        # OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.providers.append(OpenAIProvider(openai_key))
            logger.info("OpenAI provider initialized")

        # Anthropic
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            self.providers.append(AnthropicProvider(anthropic_key))
            logger.info("Anthropic provider initialized")

        # Gemini (always available as fallback)
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            self.providers.append(GeminiProvider(gemini_key))
            logger.info("Gemini provider initialized")

        if not self.providers:
            raise ValueError("No AI providers configured. Please set at least one API key.")

        logger.info(f"Initialized {len(self.providers)} AI providers")
    
    def _get_next_provider(self) -> AIProvider:
        """Get next provider in rotation."""
        provider = self.providers[self.provider_index]
        self.provider_index = (self.provider_index + 1) % len(self.providers)
        return provider
    
    async def translate_text(self, text: str, target_language: str) -> Optional[str]:
        """Translate text with automatic fallback between providers."""
        last_error = None
        
        for attempt in range(len(self.providers)):
            provider = self._get_next_provider()
            
            try:
                logger.info(f"Attempting translation with {provider.name}")
                result = await provider.translate_text(text, target_language)
                
                if result:
                    logger.info(f"Translation successful with {provider.name}")
                    return result
                
            except Exception as e:
                last_error = e
                if provider.is_rate_limit_error(e):
                    logger.warning(f"{provider.name} rate limited, trying next provider")
                else:
                    logger.error(f"{provider.name} failed: {e}")
        
        logger.error(f"All providers failed for translation. Last error: {last_error}")
        return None
    
    async def generate_meaning(self, quote: str, language: str) -> Optional[str]:
        """Generate meaning with automatic fallback between providers."""
        last_error = None
        
        for attempt in range(len(self.providers)):
            provider = self._get_next_provider()
            
            try:
                logger.info(f"Attempting meaning generation with {provider.name}")
                result = await provider.generate_meaning(quote, language)
                
                if result:
                    logger.info(f"Meaning generation successful with {provider.name}")
                    return result
                
            except Exception as e:
                last_error = e
                if provider.is_rate_limit_error(e):
                    logger.warning(f"{provider.name} rate limited, trying next provider")
                else:
                    logger.error(f"{provider.name} failed: {e}")
        
        logger.error(f"All providers failed for meaning generation. Last error: {last_error}")
        return None


# Global instance
ai_service = None

def get_ai_service() -> MultiProviderAIService:
    """Get or create AI service instance."""
    global ai_service
    if ai_service is None:
        ai_service = MultiProviderAIService()
    return ai_service
