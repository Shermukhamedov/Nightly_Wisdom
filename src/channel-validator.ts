import { TelegramMessage } from './types';

export class ChannelValidator {
  constructor(private channelUsername: string) {
    this.channelUsername = channelUsername;
  }

  isValidChannelUrl(url: string): boolean {
    const pattern = new RegExp(`https://t\\.me/${this.channelUsername}/\\d+`);
    return pattern.test(url);
  }

  extractMessageId(url: string): number | null {
    const pattern = new RegExp(`https://t\\.me/${this.channelUsername}/(\\d+)`);
    const match = url.match(pattern);
    if (match) {
      const messageId = parseInt(match[1], 10);
      return isNaN(messageId) ? null : messageId;
    }
    return null;
  }

  isForwardedFromChannel(message: TelegramMessage): boolean {
    if (message.forward_from_chat && message.forward_from_chat.username) {
      return message.forward_from_chat.username === this.channelUsername;
    }
    return false;
  }

  getForwardedMessageId(message: TelegramMessage): number | null {
    if (message.forward_from_message_id) {
      return message.forward_from_message_id;
    }
    return null;
  }

  validateAndExtract(url: string): { isValid: boolean; messageId: number | null } {
    if (!this.isValidChannelUrl(url)) {
      return { isValid: false, messageId: null };
    }

    const messageId = this.extractMessageId(url);
    if (messageId === null) {
      return { isValid: false, messageId: null };
    }

    return { isValid: true, messageId };
  }

  validateForwardedMessage(message: TelegramMessage): { isValid: boolean; messageId: number | null } {
    if (!this.isForwardedFromChannel(message)) {
      return { isValid: false, messageId: null };
    }

    const messageId = this.getForwardedMessageId(message);
    if (messageId === null) {
      return { isValid: false, messageId: null };
    }

    return { isValid: true, messageId };
  }
}
