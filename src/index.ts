import { Env, TelegramUpdate } from './types';
import { BotHandler } from './bot-handler';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle webhook verification
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/health') {
        // Initialize bot commands on health check
        try {
          const handler = new BotHandler(env);
          await handler.setBotCommands();
        } catch (error) {
          console.error('Error setting bot commands:', error);
        }
        return new Response('OK', { status: 200 });
      }
      if (url.pathname === '/init') {
        // Manual initialization endpoint
        const handler = new BotHandler(env);
        await handler.setBotCommands();
        return new Response('Bot commands initialized', { status: 200 });
      }
      return new Response('Nightly Wisdom Bot - Webhook endpoint', { status: 200 });
    }

    // Handle POST requests from Telegram webhook
    if (request.method === 'POST') {
      try {
        const update: TelegramUpdate = await request.json();
        const handler = new BotHandler(env);
        return await handler.handleUpdate(update);
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error processing webhook', { status: 500 });
      }
    }

    return new Response('Method not allowed', { status: 405 });
  }
};
