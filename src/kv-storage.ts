import { KVNamespace } from '@cloudflare/workers-types';

export class KVStorage {
  constructor(private kv: KVNamespace) {}

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const options: { expirationTtl?: number } = {};
    if (ttl) {
      options.expirationTtl = ttl;
    }
    await this.kv.put(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    return await this.kv.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }

  async setMessageStorage(userId: number, messageId: number): Promise<void> {
    await this.set(`msg:${userId}`, messageId.toString(), 3600); // 1 hour TTL
  }

  async getMessageStorage(userId: number): Promise<number | null> {
    const value = await this.get(`msg:${userId}`);
    return value ? parseInt(value, 10) : null;
  }

  async setContentStorage(userId: number, content: string): Promise<void> {
    await this.set(`content:${userId}`, content, 3600); // 1 hour TTL
  }

  async getContentStorage(userId: number): Promise<string | null> {
    return await this.get(`content:${userId}`);
  }

  async setDetectedLanguage(userId: number, language: string): Promise<void> {
    await this.set(`detected_lang:${userId}`, language, 3600);
  }

  async getDetectedLanguage(userId: number): Promise<string | null> {
    return await this.get(`detected_lang:${userId}`);
  }

  async clearUserStorage(userId: number): Promise<void> {
    await this.delete(`msg:${userId}`);
    await this.delete(`content:${userId}`);
    await this.delete(`detected_lang:${userId}`);
  }

  async setUserState(userId: number, state: string): Promise<void> {
    await this.set(`state:${userId}`, state, 3600);
  }

  async getUserState(userId: number): Promise<string | null> {
    return await this.get(`state:${userId}`);
  }

  async clearUserState(userId: number): Promise<void> {
    await this.delete(`state:${userId}`);
  }
}
