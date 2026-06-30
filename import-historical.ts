/**
 * Import Historical Quotes to D1
 * 
 * This script fetches historical posts from the Nightly Wisdom channel
 * and imports them into the D1 database.
 */

interface Env {
  TELEGRAM_BOT_TOKEN: string;
  CHANNEL_USERNAME: string;
  DB: D1Database;
}

async function fetchChannelMessages(botToken: string, channelUsername: string, limit: number = 100): Promise<any[]> {
  const messages: any[] = [];
  let offset = 0;
  
  while (messages.length < limit) {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=0`
    );
    const data = await response.json();
    
    if (!data.ok || !data.result || data.result.length === 0) {
      break;
    }
    
    // Filter channel posts from our channel
    const channelPosts = data.result.filter((update: any) => 
      update.channel_post && 
      update.channel_post.chat.username === channelUsername
    );
    
    messages.push(...channelPosts);
    offset = data.result[data.result.length - 1].update_id + 1;
  }
  
  return messages;
}

async function importToD1(db: D1Database, messages: any[]) {
  let imported = 0;
  let skipped = 0;
  
  for (const update of messages) {
    const post = update.channel_post;
    const messageId = post.message_id;
    
    // Check if already exists
    const existing = await db
      .prepare('SELECT message_id FROM quotes WHERE message_id = ?')
      .bind(messageId)
      .first();
    
    if (existing) {
      skipped++;
      continue;
    }
    
    // Extract content
    let content = post.text || post.caption || '';
    let mediaType = 'text';
    
    if (post.photo) mediaType = 'photo';
    else if (post.video) mediaType = 'video';
    else if (post.audio) mediaType = 'audio';
    else if (post.document) mediaType = 'document';
    
    // Simple language detection (basic implementation)
    let language = 'en';
    if (content) {
      // Basic detection based on character sets
      if (/[\u0400-\u04FF]/.test(content)) language = 'ru';
      else if (/[\u0400-\u04FF\u0531-\u058F]/.test(content)) language = 'uz';
    }
    
    // Insert into D1
    await db
      .prepare('INSERT OR REPLACE INTO quotes (message_id, content, language, media_type, created_at) VALUES (?, ?, ?, ?, datetime("now"))')
      .bind(messageId, content, language, mediaType)
      .run();
    
    imported++;
    console.log(`Imported message ${messageId}: ${mediaType}, language: ${language}`);
  }
  
  return { imported, skipped };
}

// Main execution
async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelUsername = process.env.CHANNEL_USERNAME || 'Nightly_Wisdom';
  
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN environment variable is required');
    process.exit(1);
  }
  
  console.log('Fetching historical messages from channel...');
  const messages = await fetchChannelMessages(botToken, channelUsername, 100);
  console.log(`Found ${messages.length} channel posts`);
  
  // Note: This script would need to be run with wrangler to access D1
  // For now, we'll create a simpler approach using the bot API directly
  console.log('To import to D1, use: wrangler d1 execute nightly-wisdom-db --remote --command="..."');
  console.log('Or create a dedicated worker endpoint for importing.');
}

main().catch(console.error);
