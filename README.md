# Nightly Wisdom Telegram Bot

A Telegram bot for the Nightly Wisdom channel that provides translation and meaning explanations for quotes.

## Stage 1 Implementation

### Features Implemented
- ✅ Core bot structure with aiogram 3.x
- ✅ User language selection (Uzbek, Russian, English)
- ✅ Language persistence in SQLite database
- ✅ Channel URL validation (only accepts Nightly Wisdom channel)
- ✅ Forwarded message validation
- ✅ Inline buttons for Translation and Meaning actions
- ✅ Invalid content handling with clickable channel link
- ✅ /start, /language, /help commands
- ✅ /meaning command skeleton (admin-only)

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
GEMINI_API_KEY=your_gemini_api_key_here
CHANNEL_USERNAME=Nightly_Wisdom
```

### 3. Run the Bot
```bash
python bot.py
```

## Project Structure
```
Nightly_Wisdom/
├── bot.py                  # Main bot application
├── database.py             # SQLite database operations
├── languages.py            # Language configurations and texts
├── channel_validator.py    # Channel URL and message validation
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── todo.md                # Development plan
└── README.md              # This file
```

## Stage 1 Testing Checklist

### Commands
- [ ] `/start` - Shows language selection for new users
- [ ] `/language` - Allows changing language
- [ ] `/help` - Shows usage instructions
- [ ] `/meaning` - Shows admin-only message (skeleton)

### URL Processing
- [ ] Valid Nightly Wisdom URL accepted: `https://t.me/Nightly_Wisdom/466`
- [ ] Invalid channel URL rejected with proper message
- [ ] "our channel" link is clickable and opens correct channel

### Forwarded Messages
- [ ] Forwarded Nightly Wisdom posts accepted
- [ ] Forwarded posts from other channels rejected
- [ ] Proper error message shown for invalid forwards

### Language System
- [ ] Language selection buttons work correctly
- [ ] Language preference saved to database
- [ ] Bot messages use user's selected language
- [ ] Language can be changed using `/language`

### Action Buttons
- [ ] Translation button shown after valid URL/forward
- [ ] Meaning button shown after valid URL/forward
- [ ] Buttons show appropriate Stage 1 placeholder messages

## Database Schema

### users table
- `user_id` (INTEGER PRIMARY KEY)
- `language` (TEXT NOT NULL)
- `created_at` (TIMESTAMP)

### meanings table
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `message_id` (INTEGER NOT NULL)
- `language` (TEXT NOT NULL)
- `meaning` (TEXT NOT NULL)
- `created_at` (TIMESTAMP)
- UNIQUE(message_id, language)

### admins table
- `user_id` (INTEGER PRIMARY KEY)

## Next Steps (Stage 2)
- Implement translation feature with Gemini API
- Add language detection for quotes
- Implement translation language selection logic
- Return translated quotes

## Next Steps (Stage 3)
- Implement meaning/explanation feature
- Check database for custom meanings first
- Use Gemini API for AI-generated meanings
- Implement admin meaning management
