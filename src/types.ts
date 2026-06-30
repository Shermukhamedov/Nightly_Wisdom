export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  GEMINI_API_KEY: string;
  ADMIN_USER_ID: string;
  TELEGRAM_API_ID: string;
  TELEGRAM_API_HASH: string;
  CHANNEL_USERNAME: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
  channel_post?: TelegramMessage;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  caption?: string;
  photo?: any[];
  video?: any;
  voice?: any;
  sticker?: any;
  animation?: any;
  audio?: any;
  document?: any;
  forward_from_chat?: TelegramChat;
  forward_from_message_id?: number;
  reply_markup?: TelegramInlineKeyboardMarkup;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  title?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data: string;
}

export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][];
}

export interface TelegramInlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramReplyKeyboardMarkup {
  keyboard: TelegramKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
}

export interface TelegramKeyboardButton {
  text: string;
}

export interface InlineQueryResultArticle {
  type: 'article';
  id: string;
  title: string;
  description?: string;
  input_message_content: InputTextMessageContent;
  reply_markup?: TelegramInlineKeyboardMarkup;
}

export interface InputTextMessageContent {
  message_text: string;
  parse_mode?: string;
}

export interface User {
  user_id: number;
  language: string;
  created_at: string;
}

export interface Meaning {
  id: number;
  message_id: number;
  language: string;
  meaning: string;
  created_at: string;
}

export interface Quote {
  id: number;
  message_id: number;
  content: string;
  language: string;
  media_type: string;
  created_at: string;
}

export interface Contribution {
  id: number;
  user_id: number;
  content_type: string;
  content: string;
  status: string;
  created_at: string;
}

export type LanguageCode = 'uz' | 'ru' | 'en';

export interface LanguageConfig {
  name: string;
  flag: string;
  welcome: string;
  select_language: string;
  language_changed: string;
  help_text: string;
  invalid_channel: string;
  select_translation_language: string;
  select_meaning_language: string;
  translation: string;
  meaning: string;
  support_text: string;
  contribution_text: string;
}

export interface Languages {
  uz: LanguageConfig;
  ru: LanguageConfig;
  en: LanguageConfig;
}
