# Language configuration for the bot

LANGUAGES = {
    "uz": {
        "name": "Uzbek",
        "flag": "🇺🇿",
        "welcome": "Assalomu alaykum! Nightly Wisdom botiga xush kelibsiz.",
        "select_language": "Iltimos, tilni tanlang:",
        "language_changed": "Til o'zgartirildi.",
        "help_text": """
Yordam:

1. Kanaldan xabar havolasini yuboring
2. Yoki kanaldan xabarni forward qiling

Men sizga tarjima va ma'no beraman.
        """,
        "invalid_channel": "Iltimos, faqat bizning kanaldan xabar yuboring.",
        "select_translation_language": "Tarjima tilini tanlang:",
        "select_meaning_language": "Ma'no tilini tanlang:",
        "translation": "Tarjima",
        "meaning": "Ma'no"
    },
    "ru": {
        "name": "Russian",
        "flag": "🇷🇺",
        "welcome": "Здравствуйте! Добро пожаловать в Nightly Wisdom бот.",
        "select_language": "Пожалуйста, выберите язык:",
        "language_changed": "Язык изменен.",
        "help_text": """
Помощь:

1. Отправьте ссылку на сообщение из канала
2. Или перешлите сообщение из канала

Я предоставлю вам перевод и значение.
        """,
        "invalid_channel": "Пожалуйста, отправляйте сообщения только из нашего канала.",
        "select_translation_language": "Выберите язык перевода:",
        "select_meaning_language": "Выберите язык для значения:",
        "translation": "Перевод",
        "meaning": "Значение"
    },
    "en": {
        "name": "English",
        "flag": "🇬🇧",
        "welcome": "Hello! Welcome to Nightly Wisdom bot.",
        "select_language": "Please select your language:",
        "language_changed": "Language changed.",
        "help_text": """
Help:

1. Send a post URL from the channel
2. Or forward a post from the channel

I will provide you with translation and meaning.
        """,
        "invalid_channel": "Please send messages only from our channel.",
        "select_translation_language": "Select translation language:",
        "select_meaning_language": "Select meaning language:",
        "translation": "Translation",
        "meaning": "Meaning"
    }
}

LANGUAGE_CODES = {
    "uz": "uz",
    "ru": "ru", 
    "en": "en"
}

def get_text(language_code: str, key: str) -> str:
    """Get text in specified language."""
    if language_code not in LANGUAGES:
        language_code = "en"  # Default to English
    return LANGUAGES[language_code].get(key, key)

def get_language_name(language_code: str) -> str:
    """Get language name with flag."""
    if language_code not in LANGUAGES:
        language_code = "en"
    lang = LANGUAGES[language_code]
    return f"{lang['flag']} {lang['name']}"
