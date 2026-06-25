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
        "meaning": "Ma'no",
        "support_text": "Iltimos, muammoning skrinshotini oling va @akkkkbar ga yuboring.\n\nShuningdek, muammo haqida qisqacha tavsif ham yuborishingiz mumkin.",
        "contribution_text": "Iqtibosingiz, rasmingiz yoki videongizni yuboring.\n\nAgar sizning hissangiz tasdiqlansa, u Nightly Wisdom kanalida e'lon qilinishi mumkin.\n\nQabul qilinadigan kontent:\n• Matn\n• Rasm\n• Video\n\nQabul qilinmaydigan:\n• Ovozli xabarlar\n• Stickerlar\n• GIFlar"
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
        "meaning": "Значение",
        "support_text": "Пожалуйста, сделайте скриншот проблемы и отправьте его @akkkkbar.\n\nВы также можете включить краткое описание проблемы.",
        "contribution_text": "Отправьте вашу цитату, фото или видео.\n\nЕсли ваш вклад будет одобрен, он может быть опубликован в канале Nightly Wisdom.\n\nПринимаемый контент:\n• Текст\n• Фото\n• Видео\n\nНе принимается:\n• Голосовые сообщения\n• Стикеры\n• GIF"
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
        "meaning": "Meaning",
        "support_text": "Please take a screenshot of the problem and send it to @akkkkbar.\n\nYou may also include a short description of the issue.",
        "contribution_text": "Send your quote, photo, or video.\n\nIf your contribution is approved, it may be published on the Nightly Wisdom channel.\n\nAccepted Content:\n• Text\n• Photo\n• Video\n\nNot accepted:\n• Voice messages\n• Stickers\n• GIFs"
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
