# Deployment Guide

## Prerequisites

Before deploying the Nightly Wisdom bot, ensure you have:

- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- Telegram API ID and Hash from [my.telegram.org](https://my.telegram.org/)
- Admin Telegram User ID
- Channel username (e.g., Nightly_Wisdom)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
CHANNEL_USERNAME=Nightly_Wisdom
ADMIN_USER_ID=your_admin_telegram_id_here
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
```

**Important:** Never commit the `.env` file to version control. Use `.env.example` as a template.

## Deployment Options

### Option 1: Docker (Recommended)

#### Build and Run with Docker Compose

```bash
# Build the image
docker-compose build

# Start the bot
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the bot
docker-compose down
```

#### Build and Run with Docker

```bash
# Build the image
docker build -t nightly-wisdom-bot .

# Run the container
docker run -d \
  --name nightly_wisdom_bot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  nightly-wisdom-bot

# View logs
docker logs -f nightly_wisdom_bot

# Stop the container
docker stop nightly_wisdom_bot
```

### Option 2: Direct Python Deployment

#### Local/Server Deployment

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the bot
python bot.py
```

#### Using Systemd (Linux)

Create a systemd service file `/etc/systemd/system/nightly-wisdom-bot.service`:

```ini
[Unit]
Description=Nightly Wisdom Telegram Bot
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/Nightly_Wisdom
Environment="PATH=/path/to/Nightly_Wisdom/venv/bin"
ExecStart=/path/to/Nightly_Wisdom/venv/bin/python bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable nightly-wisdom-bot
sudo systemctl start nightly-wisdom-bot
sudo systemctl status nightly-wisdom-bot
```

### Option 3: Cloud Deployment

#### Railway

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Python project
3. Add environment variables in Railway dashboard
4. Deploy

#### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Add environment variables
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `python bot.py`

#### Heroku

1. Create a `Procfile` in the project root:
```
worker: python bot.py
```

2. Deploy using Heroku CLI:
```bash
heroku create your-app-name
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set GEMINI_API_KEY=your_key
heroku config:set CHANNEL_USERNAME=Nightly_Wisdom
heroku config:set ADMIN_USER_ID=your_admin_id
heroku config:set TELEGRAM_API_ID=your_api_id
heroku config:set TELEGRAM_API_HASH=your_api_hash
git push heroku main
```

## Production Considerations

### Database

- The bot uses SQLite (`bot.db`) by default
- For production, consider using PostgreSQL or MySQL for better scalability
- Database file is stored in the project directory or `/app/data` in Docker
- Ensure regular backups are configured

### Monitoring

- Monitor bot logs for errors
- Set up alerts for API failures
- Track Gemini API usage to avoid quota limits

### Security

- Keep API keys secure
- Use environment variables, never hardcode secrets
- Regularly update dependencies
- Enable webhook mode for better performance (instead of polling)

### Scaling

- Current implementation uses in-memory storage for temporary data
- For multiple instances, use Redis or similar for shared state
- Consider load balancing if handling high traffic

## Troubleshooting

### Bot doesn't respond

1. Check logs: `docker-compose logs -f` or `journalctl -u nightly-wisdom-bot`
2. Verify environment variables are set correctly
3. Ensure bot token is valid
4. Check if bot has necessary permissions in the channel

### Gemini API errors

1. Verify API key is valid
2. Check API quota limits
3. Ensure network connectivity to Google services

### Database issues

1. Check file permissions on `bot.db`
2. Ensure disk space is available
3. Consider database backup/restore procedures

## Maintenance

### Update dependencies

```bash
pip install --upgrade -r requirements.txt
```

### Backup database

```bash
cp bot.db bot.db.backup.$(date +%Y%m%d)
```

### View logs

```bash
# Docker
docker-compose logs -f

# Systemd
journalctl -u nightly-wisdom-bot -f

# Direct
tail -f bot.log  # if logging to file
```
