import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LanguageDetector:
    """Detect language of text (Uzbek, Russian, English)."""
    
    def __init__(self):
        # Common words for each language
        self.uzbek_words = {
            'bilaman', 'bilmayman', 'qilaman', 'qilmayman', 
            'keladi', 'kelmaydi', 'bor', 'yoq', 'ha', 'yoq',
            'shunday', 'bunday', 'qanday', 'nimaga', 'nega',
            'men', 'sen', 'u', 'biz', 'siz', 'ular',
            'bu', 'shu', 'u', 'mening', 'sening', 'uning',
            'bizning', 'sizning', 'ularning',
            # More common Uzbek words
            'muvaffaqiyat', 'muvaffaqiyatsizlik', 'yakuniy', 'halokatli',
            'dasturlash', 'organmoqchiman', 'boshlash', 'yaxshi',
            'qil', 'qiling', 'bormi', 'yoqmi', 'qachon',
            'qayer', 'qaysi', 'nimada', 'nima', 'kim',
            'qandaydir', 'shuqa', 'ham', 'yoki', 'lekin',
            'chunki', 'agar', 'hatto', 'juda', 'juda',
            'kop', 'oz', 'katta', 'kichik', 'yangi',
            'eski', 'yaxshi', 'yomon', 'chiroyli', 'bevaqt',
            # Cleaned apostrophe versions
            'yo\'q', 'o\'rganmoqchiman', 'ko\'p', 'yo\'qmi'
        }
        
        self.russian_words = {
            'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
            'это', 'тот', 'этот', 'та', 'то', 'эти', 'те',
            'да', 'нет', 'может', 'можно', 'нужно',
            'хорошо', 'плохо', 'большой', 'маленький',
            'хотеть', 'мочь', 'должен', 'надо'
        }
        
        self.english_words = {
            'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'this', 'that', 'these', 'those',
            'yes', 'no', 'maybe', 'can', 'could',
            'will', 'would', 'should', 'must',
            'want', 'need', 'have', 'had', 'has'
        }
    
    def detect(self, text: str) -> Optional[str]:
        """
        Detect the language of the given text.
        
        Args:
            text: The text to analyze
        
        Returns:
            Language code ('uz', 'ru', 'en') or None if undetectable
        """
        if not text or not text.strip():
            return None
        
        text_lower = text.lower()
        
        # Check for Cyrillic characters (Russian or Uzbek)
        cyrillic_pattern = re.compile(r'[а-яё]')
        latin_pattern = re.compile(r'[a-z]')
        
        has_cyrillic = bool(cyrillic_pattern.search(text_lower))
        has_latin = bool(latin_pattern.search(text_lower))
        
        # Check for specific Uzbek characters
        uzbek_specific = re.compile(r'[ʻ\'ʼ]')
        has_uzbek_chars = bool(uzbek_specific.search(text_lower))
        
        # Check for common Uzbek letter combinations in Latin script
        uzbek_latin_patterns = [
            r'sh', r'ch', r'ng', r'\'', r'ʻ',  # Common Uzbek digraphs and apostrophes
        ]
        has_uzbek_latin_patterns = any(re.search(pattern, text_lower) for pattern in uzbek_latin_patterns)
        
        # Count word matches for each language
        uz_score = 0
        ru_score = 0
        en_score = 0
        
        words = re.findall(r'\b\w+\b', text_lower)
        
        for word in words:
            if word in self.uzbek_words:
                uz_score += 1
            if word in self.russian_words:
                ru_score += 1
            if word in self.english_words:
                en_score += 1
        
        # Language detection logic
        if has_uzbek_chars and has_cyrillic:
            # Text has Uzbek-specific characters in Cyrillic
            return 'uz'
        
        if has_cyrillic and not has_latin:
            # Only Cyrillic - could be Russian or Uzbek
            if uz_score > ru_score:
                return 'uz'
            elif ru_score > uz_score:
                return 'ru'
            else:
                # If scores are equal, default to Russian for Cyrillic-only text
                return 'ru'
        
        if has_latin and not has_cyrillic:
            # Only Latin characters - could be English or Uzbek
            if uz_score > en_score:
                return 'uz'
            elif has_uzbek_latin_patterns and uz_score > 0:
                return 'uz'
            elif en_score > 0:
                return 'en'
            else:
                # Check for Uzbek patterns even without specific words
                if has_uzbek_latin_patterns:
                    return 'uz'
                # Default to English for Latin-only text
                return 'en'
        
        if has_cyrillic and has_latin:
            # Mixed script - use word scores
            scores = {'uz': uz_score, 'ru': ru_score, 'en': en_score}
            max_score = max(scores.values())
            
            if max_score == 0:
                # No common words detected, use character frequency
                if has_uzbek_chars:
                    return 'uz'
                elif has_cyrillic:
                    return 'ru'
                else:
                    return 'en'
            
            # Return language with highest score
            for lang, score in scores.items():
                if score == max_score:
                    return lang
        
        # Default fallback
        logger.warning(f"Could not confidently detect language for text: {text[:50]}...")
        return 'en'  # Default to English
    
    def get_translation_options(self, source_language: str) -> list:
        """
        Get available translation options for a source language.
        
        Args:
            source_language: The detected source language
        
        Returns:
            List of available target language codes
        """
        all_languages = ['uz', 'ru', 'en']
        
        # Remove source language from options
        if source_language in all_languages:
            all_languages.remove(source_language)
        
        return all_languages

# Global instance
language_detector = None

def get_language_detector() -> LanguageDetector:
    """Get or create language detector instance."""
    global language_detector
    if language_detector is None:
        language_detector = LanguageDetector()
    return language_detector
