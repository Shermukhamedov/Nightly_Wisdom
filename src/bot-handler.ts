import { Env, TelegramUpdate, LanguageCode } from './types';
import { Database } from './database';
import { KVStorage } from './kv-storage';
import { TelegramAPI } from './telegram-api';
import { ChannelValidator } from './channel-validator';
import { getLanguageDetector } from './language-detector';
import { getGeminiService } from './gemini-service';
import { getText, getLanguageName } from './languages';

export class BotHandler {
  private db: Database;
  private kv: KVStorage;
  private telegram: TelegramAPI;
  private validator: ChannelValidator;

  constructor(private env: Env) {
    this.db = new Database(env.DB);
    this.kv = new KVStorage(env.KV);
    this.telegram = new TelegramAPI(env.TELEGRAM_BOT_TOKEN, env);
    this.validator = new ChannelValidator(env.CHANNEL_USERNAME);
  }

  async handleUpdate(update: TelegramUpdate): Promise<Response> {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else if (update.inline_query) {
        await this.handleInlineQuery(update.inline_query);
      } else if (update.channel_post) {
        await this.handleChannelPost(update.channel_post);
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error handling update:', error);
      return new Response('Error', { status: 500 });
    }
  }

  private async handleMessage(message: any): Promise<void> {
    const userId = message.from.id;
    const text = message.text;

    // Check if user is in a state (e.g., waiting for contribution)
    const userState = await this.kv.getUserState(userId);
    if (userState === 'waiting_for_contribution') {
      await this.processContribution(message);
      return;
    }

    // Handle commands
    if (text && text.startsWith('/')) {
      await this.handleCommand(message);
      return;
    }

    // Handle language selection (non-command text)
    if (userState === 'waiting_for_language') {
      await this.handleLanguageSelection(message);
      return;
    }

    // Handle URL or forwarded message
    const language = (await this.db.getUserLanguage(userId)) || 'en';
    if (!language) {
      await this.telegram.sendMessage(userId, getText('en' as LanguageCode, 'select_language'));
      return;
    }

    let messageContent: string | null = null;
    let messageId: number | null = null;

    // Check if it's a forwarded message
    if (message.forward_from_chat) {
      const { isValid, messageId: extractedId } = this.validator.validateForwardedMessage(message);
      
      if (isValid && extractedId) {
        messageId = extractedId;
        messageContent = message.text || message.caption || null;
        
        if (!messageContent) {
          await this.telegram.sendMessage(userId, 'This message type is not supported. Please send text messages or messages with text captions.');
          return;
        }

        await this.kv.setMessageStorage(userId, messageId);
        await this.kv.setContentStorage(userId, messageContent);
        await this.telegram.sendMessage(userId, 'Please select an action:', {
          reply_markup: this.getActionKeyboard()
        });
      } else {
        await this.telegram.sendMessage(userId, getText(language as LanguageCode, 'invalid_channel'), {
          reply_markup: this.getInvalidChannelKeyboard()
        });
      }
    } else {
      await this.telegram.sendMessage(userId, 'Please forward a message from the Nightly Wisdom channel.');
    }
  }

  private async handleCommand(message: any): Promise<void> {
    const userId = message.from.id;
    const text = message.text;
    const command = text.split(' ')[0];

    switch (command) {
      case '/start':
        await this.cmdStart(message);
        break;
      case '/language':
        await this.cmdLanguage(message);
        break;
      case '/help':
        await this.cmdHelp(message);
        break;
      case '/support':
        await this.cmdSupport(message);
        break;
      case '/contribution':
        await this.cmdContribution(message);
        break;
      default:
        // Handle language selection from keyboard
        await this.handleLanguageSelection(message);
    }
  }

  private async cmdStart(message: any): Promise<void> {
    const userId = message.from.id;
    const existingLanguage = await this.db.getUserLanguage(userId);

    if (existingLanguage) {
      const welcomeText = getText(existingLanguage as LanguageCode, 'welcome');
      await this.telegram.sendMessage(userId, welcomeText);
    } else {
      const selectText = getText('en' as LanguageCode, 'select_language');
      await this.telegram.sendMessage(userId, selectText, {
        reply_markup: this.getLanguageKeyboard()
      });
      await this.kv.setUserState(userId, 'waiting_for_language');
    }
  }

  private async cmdLanguage(message: any): Promise<void> {
    const userId = message.from.id;
    const currentLanguage = (await this.db.getUserLanguage(userId)) || 'en';
    const selectText = getText(currentLanguage as LanguageCode, 'select_language');
    await this.telegram.sendMessage(userId, selectText, {
      reply_markup: this.getLanguageKeyboard()
    });
    await this.kv.setUserState(userId, 'waiting_for_language');
  }

  private async cmdHelp(message: any): Promise<void> {
    const userId = message.from.id;
    const language = (await this.db.getUserLanguage(userId)) || 'en';
    const helpText = getText(language as LanguageCode, 'help_text');
    await this.telegram.sendMessage(userId, helpText);
  }

  private async cmdSupport(message: any): Promise<void> {
    const userId = message.from.id;
    const language = (await this.db.getUserLanguage(userId)) || 'en';
    const supportText = getText(language as LanguageCode, 'support_text');
    await this.telegram.sendMessage(userId, supportText);
  }

  private async cmdContribution(message: any): Promise<void> {
    const userId = message.from.id;
    const language = (await this.db.getUserLanguage(userId)) || 'en';
    const contributionText = getText(language as LanguageCode, 'contribution_text');
    await this.telegram.sendMessage(userId, contributionText);
    await this.kv.setUserState(userId, 'waiting_for_contribution');
  }

  private async processContribution(message: any): Promise<void> {
    const userId = message.from.id;
    const language = (await this.db.getUserLanguage(userId)) || 'en';

    // Filter out unwanted content types
    if (message.voice) {
      await this.telegram.sendMessage(userId, 'Voice messages are not accepted. Please send text, photo, or video.');
      await this.kv.clearUserState(userId);
      return;
    }

    if (message.sticker) {
      await this.telegram.sendMessage(userId, 'Stickers are not accepted. Please send text, photo, or video.');
      await this.kv.clearUserState(userId);
      return;
    }

    if (message.animation) {
      await this.telegram.sendMessage(userId, 'GIFs are not accepted. Please send text, photo, or video.');
      await this.kv.clearUserState(userId);
      return;
    }

    // Check if ADMIN_USER_ID is set
    const adminUserId = parseInt(this.env.ADMIN_USER_ID, 10);
    if (!adminUserId || adminUserId === 0) {
      await this.telegram.sendMessage(userId, 'Admin ID not configured. Please contact the bot administrator.');
      await this.kv.clearUserState(userId);
      return;
    }

    // Process contribution
    try {
      let contentType: string | null = null;
      let content: string = '';

      if (message.text) {
        contentType = 'text';
        content = message.text;
      } else if (message.photo) {
        contentType = 'photo';
        content = `[Photo: ${message.caption || 'No caption'}]`;
      } else if (message.video) {
        contentType = 'video';
        content = `[Video: ${message.caption || 'No caption'}]`;
      } else {
        await this.telegram.sendMessage(userId, 'This content type is not supported. Please send text, photo, or video.');
        await this.kv.clearUserState(userId);
        return;
      }

      // Save to database
      await this.db.saveContribution(userId, contentType, content);

      // Prepare contribution info
      const username = message.from.username || 'No username';
      let contributionInfo = `📨 New Contribution\n\nUser: @${username}\nTelegram ID: ${userId}\n`;

      // Determine content type for display
      if (message.text) {
        contributionInfo += `Type: Text\n\nContent:\n${message.text}`;
        await this.telegram.sendMessage(adminUserId, contributionInfo);
      } else if (message.photo) {
        contributionInfo += 'Type: Photo';
        await this.telegram.sendMessage(adminUserId, contributionInfo);
        await this.telegram.forwardMessage(adminUserId, message.chat.id, message.message_id);
      } else if (message.video) {
        contributionInfo += 'Type: Video';
        await this.telegram.sendMessage(adminUserId, contributionInfo);
        await this.telegram.forwardMessage(adminUserId, message.chat.id, message.message_id);
      }

      // Send confirmation to user
      await this.telegram.sendMessage(userId, 'Thank you for your contribution! We will review it and get back to you if it\'s approved.');
      await this.kv.clearUserState(userId);
    } catch (error) {
      console.error('Error processing contribution:', error);
      await this.telegram.sendMessage(userId, 'An error occurred while processing your contribution. Please try again later.');
      await this.kv.clearUserState(userId);
    }
  }

  private async handleLanguageSelection(message: any): Promise<void> {
    const userId = message.from.id;
    const text = message.text;

    const languageMap: Record<string, LanguageCode> = {
      '🇺🇿 Uzbek': 'uz',
      '🇷🇺 Russian': 'ru',
      '🇬🇧 English': 'en'
    };

    const languageCode = languageMap[text];

    if (languageCode) {
      await this.db.saveUserLanguage(userId, languageCode);
      const welcomeText = getText(languageCode, 'welcome');
      await this.telegram.sendMessage(userId, welcomeText, {
        reply_markup: {
          remove_keyboard: true
        } as any
      });
      await this.kv.clearUserState(userId);
    }
  }

  private async handleCallbackQuery(callbackQuery: any): Promise<void> {
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const language = (await this.db.getUserLanguage(userId)) || 'en';

    if (data.startsWith('action_')) {
      const action = data.split('_')[1];
      const messageId = await this.kv.getMessageStorage(userId);
      const messageContent = await this.kv.getContentStorage(userId);

      if (!messageId || !messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, 'Error: Message content not found. Please try again.');
        return;
      }

      if (action === 'translation') {
        const detector = getLanguageDetector();
        const detectedLanguage = detector.detect(messageContent) || 'en';
        const availableLanguages = detector.getTranslationOptions(detectedLanguage);

        const selectText = getText(language as LanguageCode, 'select_translation_language');
        await this.telegram.sendMessage(userId, selectText, {
          reply_markup: this.getTranslationLanguageKeyboard(availableLanguages)
        });

        await this.kv.setDetectedLanguage(userId, detectedLanguage);
      } else if (action === 'meaning') {
        const selectText = getText(language as LanguageCode, 'select_meaning_language');
        await this.telegram.sendMessage(userId, selectText, {
          reply_markup: this.getMeaningLanguageKeyboard()
        });
      }

      await this.telegram.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('trans_lang_')) {
      const targetLanguage = data.split('_')[2] as LanguageCode;
      const messageContent = await this.kv.getContentStorage(userId);
      const detectedLanguage = await this.kv.getDetectedLanguage(userId) || 'en';

      if (!messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, 'Error: Message content not found. Please try again.');
        return;
      }

      const processingMessage = await this.telegram.sendMessage(userId, 'Translating... ⏳');

      try {
        const geminiService = getGeminiService(this.env.GEMINI_API_KEY);
        const translatedText = await geminiService.translateText(messageContent, targetLanguage);

        if (translatedText) {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          const translationLabel = getText(language as LanguageCode, 'translation');
          await this.telegram.sendMessage(userId, `${translationLabel}:\n\n${translatedText}`);
        } else {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          await this.telegram.sendMessage(userId, 'Translation failed. Please try again.');
        }
      } catch (error) {
        await this.telegram.deleteMessage(userId, processingMessage.message_id);
        await this.telegram.sendMessage(userId, 'An error occurred during translation. Please try again.');
      }

      await this.telegram.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith('meaning_lang_')) {
      const targetLanguage = data.split('_')[2] as LanguageCode;
      const messageId = await this.kv.getMessageStorage(userId);
      const messageContent = await this.kv.getContentStorage(userId);

      if (!messageId || !messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, 'Error: Message content not found. Please try again.');
        return;
      }

      const processingMessage = await this.telegram.sendMessage(userId, 'Generating meaning... ⏳');

      try {
        const customMeaning = await this.db.getMeaning(Number(messageId), targetLanguage);

        if (customMeaning) {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          const meaningLabel = getText(language as LanguageCode, 'meaning');
          await this.telegram.sendMessage(userId, `${meaningLabel}:\n\n${customMeaning}`);
        } else {
          const geminiService = getGeminiService(this.env.GEMINI_API_KEY);
          const generatedMeaning = await geminiService.generateMeaning(messageContent, targetLanguage);

          if (generatedMeaning) {
            await this.telegram.deleteMessage(userId, processingMessage.message_id);
            await this.telegram.sendMessage(userId, generatedMeaning);
          } else {
            await this.telegram.deleteMessage(userId, processingMessage.message_id);
            await this.telegram.sendMessage(userId, 'Failed to generate meaning. Please try again.');
          }
        }
      } catch (error) {
        await this.telegram.deleteMessage(userId, processingMessage.message_id);
        await this.telegram.sendMessage(userId, 'An error occurred while generating meaning. Please try again.');
      }

      await this.telegram.answerCallbackQuery(callbackQuery.id);
    }
  }

  private async handleInlineQuery(inlineQuery: any): Promise<void> {
    const query = inlineQuery.query.trim();
    const userId = inlineQuery.from.id;

    if (!query) {
      await this.telegram.answerInlineQuery(inlineQuery.id, []);
      return;
    }

    try {
      const results = await this.db.searchQuotes(query, 5);
      
      if (results.length === 0) {
        await this.telegram.answerInlineQuery(inlineQuery.id, []);
        return;
      }

      const inlineResults = results.map((result) => {
        const messageId = result.message_id;
        const content = result.content;
        const language = result.language;
        const displayContent = content.length > 64 ? content.substring(0, 64) + '...' : content;

        return {
          type: 'article',
          id: messageId.toString(),
          title: displayContent,
          description: language.toUpperCase(),
          input_message_content: {
            message_text: content
          }
        };
      });

      console.log('Sending inline results:', JSON.stringify(inlineResults));
      
      // Answer inline query
      await this.telegram.answerInlineQuery(inlineQuery.id, inlineResults);
    } catch (error: any) {
      console.error('Error in inline query:', error);
      console.error('Error message:', error?.message);
    }
  }

  private async handleChannelPost(message: any): Promise<void> {
    if (message.chat.username !== this.env.CHANNEL_USERNAME) {
      return;
    }

    const messageId = message.message_id;
    let content: string | null = null;
    let mediaType = 'text';

    if (message.text) {
      content = message.text;
    } else if (message.caption) {
      content = message.caption;
      if (message.photo) mediaType = 'photo';
      else if (message.video) mediaType = 'video';
      else if (message.audio) mediaType = 'audio';
      else if (message.document) mediaType = 'document';
    } else {
      mediaType = 'unknown';
      content = '';
    }

    let language: string | null = null;
    if (content) {
      try {
        const detector = getLanguageDetector();
        language = detector.detect(content);
      } catch (error) {
        language = 'unknown';
      }
    }

    if (content || mediaType !== 'text') {
      await this.db.saveQuote(messageId, content || '', language || 'unknown', mediaType);
    }
  }

  private getLanguageKeyboard(): any {
    return {
      keyboard: [
        [{ text: '🇺🇿 Uzbek' }],
        [{ text: '🇷🇺 Russian' }],
        [{ text: '🇬🇧 English' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }

  private getActionKeyboard(): any {
    return {
      inline_keyboard: [
        [
          { text: 'Translation', callback_data: 'action_translation' },
          { text: 'Meaning', callback_data: 'action_meaning' }
        ]
      ]
    };
  }

  private getTranslationLanguageKeyboard(availableLanguages: LanguageCode[]): any {
    return {
      inline_keyboard: availableLanguages.map(lang => [
        { text: getLanguageName(lang), callback_data: `trans_lang_${lang}` }
      ])
    };
  }

  private getMeaningLanguageKeyboard(): any {
    return {
      inline_keyboard: [
        [{ text: getLanguageName('uz'), callback_data: 'meaning_lang_uz' }],
        [{ text: getLanguageName('ru'), callback_data: 'meaning_lang_ru' }],
        [{ text: getLanguageName('en'), callback_data: 'meaning_lang_en' }]
      ]
    };
  }

  private getInvalidChannelKeyboard(): any {
    return {
      inline_keyboard: [
        [{ text: 'our channel', url: `https://t.me/${this.env.CHANNEL_USERNAME}` }]
      ]
    };
  }
}
