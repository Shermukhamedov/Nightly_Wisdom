import { Env } from './types';
import { TelegramMessage, TelegramInlineKeyboardMarkup, TelegramReplyKeyboardMarkup, InlineQueryResultArticle } from './types';

export class TelegramAPI {
  constructor(
    private token: string,
    private env: Env
  ) {}

  private async apiCall(method: string, body?: any): Promise<any> {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }

  async sendMessage(chatId: number, text: string, options?: {
    reply_markup?: TelegramInlineKeyboardMarkup | TelegramReplyKeyboardMarkup;
    parse_mode?: string;
  }): Promise<TelegramMessage> {
    return await this.apiCall('sendMessage', {
      chat_id: chatId,
      text,
      ...options,
    });
  }

  async editMessageText(chatId: number, messageId: number, text: string, options?: {
    reply_markup?: TelegramInlineKeyboardMarkup;
    parse_mode?: string;
  }): Promise<TelegramMessage> {
    return await this.apiCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options,
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await this.apiCall('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  async answerInlineQuery(inlineQueryId: string, results: any[], cacheTime?: number): Promise<void> {
    await this.apiCall('answerInlineQuery', {
      inline_query_id: inlineQueryId,
      results,
      cache_time: cacheTime || 300,
    });
  }

  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    await this.apiCall('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async forwardMessage(chatId: number, fromChatId: number, messageId: number): Promise<TelegramMessage> {
    return await this.apiCall('forwardMessage', {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId,
    });
  }

  async sendPhoto(chatId: number, fileId: string, caption?: string): Promise<TelegramMessage> {
    return await this.apiCall('sendPhoto', {
      chat_id: chatId,
      photo: fileId,
      caption,
    });
  }

  async sendVideo(chatId: number, fileId: string, caption?: string): Promise<TelegramMessage> {
    return await this.apiCall('sendVideo', {
      chat_id: chatId,
      video: fileId,
      caption,
    });
  }

  async sendDocument(chatId: number, fileId: string, caption?: string): Promise<TelegramMessage> {
    return await this.apiCall('sendDocument', {
      chat_id: chatId,
      document: fileId,
      caption,
    });
  }

  async getMessage(chatId: string | number, messageId: number): Promise<TelegramMessage> {
    return await this.apiCall('getMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async setWebhook(url: string): Promise<void> {
    await this.apiCall('setWebhook', { url });
  }

  async deleteWebhook(): Promise<void> {
    await this.apiCall('deleteWebhook');
  }

  async getWebhookInfo(): Promise<any> {
    return await this.apiCall('getWebhookInfo');
  }
}
