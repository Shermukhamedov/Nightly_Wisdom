import { D1Database } from '@cloudflare/workers-types';

export class Database {
  constructor(private db: D1Database) {}

  async saveUserLanguage(userId: number, language: string): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT OR REPLACE INTO users (user_id, language, created_at) VALUES (?, ?, datetime("now"))')
        .bind(userId, language)
        .run();
      return true;
    } catch (error) {
      console.error('Error saving user language:', error);
      return false;
    }
  }

  async getUserLanguage(userId: number): Promise<string | null> {
    try {
      const result = await this.db
        .prepare('SELECT language FROM users WHERE user_id = ?')
        .bind(userId)
        .first<{ language: string }>();
      return result?.language || null;
    } catch (error) {
      console.error('Error getting user language:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<number[]> {
    try {
      const results = await this.db
        .prepare('SELECT user_id FROM users')
        .all<{ user_id: number }>();
      return results.results?.map(r => r.user_id) || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async saveMeaning(messageId: number, language: string, meaning: string): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT OR REPLACE INTO meanings (message_id, language, meaning, created_at) VALUES (?, ?, ?, datetime("now"))')
        .bind(messageId, language, meaning)
        .run();
      return true;
    } catch (error) {
      console.error('Error saving meaning:', error);
      return false;
    }
  }

  async getMeaning(messageId: number, language: string): Promise<string | null> {
    try {
      const result = await this.db
        .prepare('SELECT meaning FROM meanings WHERE message_id = ? AND language = ?')
        .bind(messageId, language)
        .first<{ meaning: string }>();
      return result?.meaning || null;
    } catch (error) {
      console.error('Error getting meaning:', error);
      return null;
    }
  }

  async addAdmin(userId: number): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT OR IGNORE INTO admins (user_id) VALUES (?)')
        .bind(userId)
        .run();
      return true;
    } catch (error) {
      console.error('Error adding admin:', error);
      return false;
    }
  }

  async isAdmin(userId: number): Promise<boolean> {
    try {
      const result = await this.db
        .prepare('SELECT user_id FROM admins WHERE user_id = ?')
        .bind(userId)
        .first<{ user_id: number }>();
      return !!result;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async saveQuote(messageId: number, content: string, language: string, mediaType: string): Promise<boolean> {
    try {
      await this.db
        .prepare('INSERT OR REPLACE INTO quotes (message_id, content, language, media_type, created_at) VALUES (?, ?, ?, ?, datetime("now"))')
        .bind(messageId, content, language, mediaType)
        .run();
      return true;
    } catch (error) {
      console.error('Error saving quote:', error);
      return false;
    }
  }

  async searchQuotes(query: string, limit: number = 10): Promise<Array<{ message_id: number; content: string; language: string }>> {
    try {
      const results = await this.db
        .prepare('SELECT message_id, content, language FROM quotes WHERE content LIKE ? COLLATE NOCASE ORDER BY created_at DESC LIMIT ?')
        .bind(`%${query}%`, limit)
        .all<{ message_id: number; content: string; language: string }>();
      console.log('Search query:', query, 'Results:', results.results?.length || 0);
      return results.results || [];
    } catch (error) {
      console.error('Error searching quotes:', error);
      return [];
    }
  }

  async getQuoteByMessageId(messageId: number): Promise<{ message_id: number; content: string; language: string; media_type: string } | null> {
    try {
      const result = await this.db
        .prepare('SELECT message_id, content, language, media_type FROM quotes WHERE message_id = ?')
        .bind(messageId)
        .first<{ message_id: number; content: string; language: string; media_type: string }>();
      return result || null;
    } catch (error) {
      console.error('Error getting quote by message ID:', error);
      return null;
    }
  }

  async saveContribution(userId: number, contentType: string, content: string): Promise<number | null> {
    try {
      const result = await this.db
        .prepare('INSERT INTO contributions (user_id, content_type, content, status) VALUES (?, ?, ?, "pending")')
        .bind(userId, contentType, content)
        .run();
      return result.meta.last_row_id || null;
    } catch (error) {
      console.error('Error saving contribution:', error);
      return null;
    }
  }

  async updateContributionStatus(contributionId: number, status: string): Promise<boolean> {
    try {
      await this.db
        .prepare('UPDATE contributions SET status = ? WHERE id = ?')
        .bind(status, contributionId)
        .run();
      return true;
    } catch (error) {
      console.error('Error updating contribution status:', error);
      return false;
    }
  }

  async getContributionStats(): Promise<{ total: number; approved: number; rejected: number; already_exists: number; pending: number }> {
    try {
      const total = await this.db.prepare('SELECT COUNT(*) as count FROM contributions').first<{ count: number }>();
      const approved = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "approved"').first<{ count: number }>();
      const rejected = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "rejected"').first<{ count: number }>();
      const alreadyExists = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "already_exists"').first<{ count: number }>();
      const pending = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "pending"').first<{ count: number }>();

      return {
        total: total?.count || 0,
        approved: approved?.count || 0,
        rejected: rejected?.count || 0,
        already_exists: alreadyExists?.count || 0,
        pending: pending?.count || 0
      };
    } catch (error) {
      console.error('Error getting contribution stats:', error);
      return { total: 0, approved: 0, rejected: 0, already_exists: 0, pending: 0 };
    }
  }
}
