import { Languages, LanguageCode, LanguageConfig } from './types';

export const LANGUAGES: Languages = {
  uz: {
    name: "Uzbek",
    flag: "🇺🇿",
    welcome: "Assalomu alaykum! Nightly Wisdom botiga xush kelibsiz.",
    select_language: "Iltimos, tilni tanlang:",
    select_action: "Iltimos, amalni tanlang:",
    language_changed: "Til o'zgartirildi.",
    help_text: `Nightly Wisdom Bot-dan foydalanish qo'llanmasi

1) Kanalimizdagi istalgan iqtibosni ushbu botga yo'llang (forward qiling).
2)  Iqtibos ostidagi "Tarjima" yoki "Ma'no" tugmalaridan birini tanlang.
3) Javobni qaysi tilda olmoqchi bo'lsangiz, o'sha tilni bosing.

Mavjud buyruqlar:
1) /boshlash — Botni qayta ishga tushirish va sozlash.
2) /til — Bot interfeysi va javob berish tilini o'zgartirish.
3) /yordam — Ushbu foydalanish qo'llanmasini ko'rsatish.
4) /shikoyat — Texnik xatoliklar yoki muammolar haqida xabar berish.
5) /ulashish — Kanalimizda chiqishini xohlagan iqtiboslaringizni bizga yuborish.

Sarlavhasiz qidiruv (Inline Search):
Istalgan chatda bizning iqtiboslar bazamizdan qidirishingiz mumkin! Shunchaki @Nightly_Wisdom_Bot deb yozing va yonidan kalit so'zni kiriting`,
    invalid_channel: "Iltimos, faqat bizning kanaldan xabar yuboring.",
    select_translation_language: "Tarjima tilini tanlang:",
    select_meaning_language: "Ma'no tilini tanlang:",
    translation: "Tarjima",
    meaning: "Ma'no",
    support_text: "Iltimos, muammoning skrinshotini oling va @akkkkbar ga yuboring.\n\nShuningdek, muammo haqida qisqacha tavsif ham yuborishingiz mumkin.",
    contribution_text: "Iqtibosingiz, rasmingiz yoki videongizni yuboring.\n\nAgar sizning hissangiz tasdiqlansa, u Nightly Wisdom kanalida e'lon qilinishi mumkin.\n\nQabul qilinadigan kontent:\n• Matn\n• Rasm\n• Video\n\nQabul qilinmaydigan:\n• Ovozli xabarlar\n• Stickerlar\n• GIFlar",
    commands: {
      start: "/boshlash",
      language: "/til",
      help: "/yordam",
      report: "/shikoyat",
      contribution: "/ulashish"
    }
  },
  ru: {
    name: "Russian",
    flag: "🇷🇺",
    welcome: "Здравствуйте! Добро пожаловать в Nightly Wisdom бот.",
    select_language: "Пожалуйста, выберите язык:",
    select_action: "Пожалуйста, выберите действие:",
    language_changed: "Язык изменен.",
    help_text: `Руководство пользователя Nightly Wisdom Bot

1) Перешлите любую цитату из нашего канала этому боту.
2)  Нажмите кнопку «Перевод» или «Значение» под присланной цитатой.
3)  Выберите язык, на котором хотите получить результат.

Доступные команды:
1) /старт — Перезапустить бота и обновить настройки.
2) /язык — Изменить язык интерфейса и ответов бота.
3) /помощь — Показать это руководство пользователя.
4) /жалоба — Сообщить о технических ошибках или багах.
5) /предложить — Прислать свои любимые цитаты для публикации на канале.

Инлайн-поиск (Inline Search):
Вы можете искать цитаты в любом чате! Просто введите @Nightly_Wisdom_Bot и далее ключевое слово`,
    invalid_channel: "Пожалуйста, отправляйте сообщения только из нашего канала.",
    select_translation_language: "Выберите язык перевода:",
    select_meaning_language: "Выберите язык для значения:",
    translation: "Перевод",
    meaning: "Значение",
    support_text: "Пожалуйста, сделайте скриншот проблемы и отправьте его @akkkkbar.\n\nВы также можете включить краткое описание проблемы.",
    contribution_text: "Отправьте вашу цитату, фото или видео.\n\nЕсли ваш вклад будет одобрен, он может быть опубликован в канале Nightly Wisdom.\n\nПринимаемый контент:\n• Текст\n• Фото\n• Видео\n\nНе принимается:\n• Голосовые сообщения\n• Стикеры\n• GIF",
    commands: {
      start: "/старт",
      language: "/язык",
      help: "/помощь",
      report: "/жалоба",
      contribution: "/предложить"
    }
  },
  en: {
    name: "English",
    flag: "🇬🇧",
    welcome: "Hello! Welcome to Nightly Wisdom bot.",
    select_language: "Please select your language:",
    select_action: "Please select an action:",
    language_changed: "Language changed.",
    help_text: `How to Use Nightly Wisdom Bot

1) Forward any quote from our channel to this bot.
2) Click "Translation" or "Meaning" from the buttons below the quote.
3) Choose the language you want to read it in.

Available Commands:
1) /start — Restart the bot and setup initialization.
2) /language — Change your interface and response language.
3) /help — Show this user guide.
4) /report — Report technical issues or bugs.
5) /contribution — Submit your own favorite quotes to be featured on our channel.

Inline Search:
You can search our quote database in any chat! Just type @Nightly_Wisdom_Bot followed by a keyword`,
    invalid_channel: "Please send messages only from our channel.",
    select_translation_language: "Select translation language:",
    select_meaning_language: "Select meaning language:",
    translation: "Translation",
    meaning: "Meaning",
    support_text: "Please take a screenshot of the problem and send it to @akkkkbar.\n\nYou may also include a short description of the issue.",
    contribution_text: "Send your quote, photo, or video.\n\nIf your contribution is approved, it may be published on the Nightly Wisdom channel.\n\nAccepted Content:\n• Text\n• Photo\n• Video\n\nNot accepted:\n• Voice messages\n• Stickers\n• GIFs",
    commands: {
      start: "/start",
      language: "/language",
      help: "/help",
      report: "/report",
      contribution: "/contribution"
    }
  }
};

export function getText(languageCode: LanguageCode, key: keyof LanguageConfig): string {
  const lang = LANGUAGES[languageCode] || LANGUAGES.en;
  const value = lang[key];
  // Handle the case where key is 'commands' (an object)
  if (typeof value === 'object') {
    return key;
  }
  return value || key;
}

export function getCommand(languageCode: LanguageCode, commandName: keyof LanguageConfig['commands']): string {
  const lang = LANGUAGES[languageCode] || LANGUAGES.en;
  return lang.commands[commandName] || commandName;
}

export function getLanguageName(languageCode: LanguageCode): string {
  const lang = LANGUAGES[languageCode] || LANGUAGES.en;
  return `${lang.flag} ${lang.name}`;
}
