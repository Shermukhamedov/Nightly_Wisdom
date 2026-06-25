# Nightly Wisdom Telegram Bot

A Telegram bot for the Nightly Wisdom channel that provides translation and meaning explanations for quotes.

## Stage 2 Implementation

### Features Implemented
- ✅ All Stage 1 features
- ✅ Gemini API integration for translation
- ✅ Automatic language detection (Uzbek, Russian, English)
- ✅ Smart translation language selection (excludes source language)
- ✅ Translation language selection buttons
- ✅ Real-time translation with processing indicators
- ✅ Interface language preservation (user's language preference unchanged)
- ✅ Support for both URLs and forwarded messages
- ✅ Error handling for API quota limits and failures

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
├── gemini_service.py       # Gemini API integration service
├── language_detector.py    # Language detection for quotes
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── test_setup.py          # Setup and functionality tests
├── test_language_detection.py  # Language detection tests
├── test_gemini.py         # Gemini API integration tests
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

## Stage 2 Testing Checklist

### Translation Feature
- [ ] Forward a text message from Nightly Wisdom channel
- [ ] Click "Translation" button
- [ ] Bot shows language selection (excluding source language)
- [ ] Select target language
- [ ] Bot shows "Translating... ⏳" indicator
- [ ] Bot returns translated text
- [ ] Bot interface remains in user's selected language

### Language Detection
- [ ] English quotes detected correctly
- [ ] Russian quotes detected correctly  
- [ ] Uzbek quotes detected correctly (both Cyrillic and Latin script)
- [ ] Translation options exclude source language

### URL Support
- [ ] Valid Nightly Wisdom URLs work
- [ ] Bot fetches message content from channel
- [ ] Translation works with URL-sourced content

### Error Handling
- [ ] API quota limits handled gracefully
- [ ] Network errors handled gracefully
- [ ] Invalid messages rejected with clear error messages

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

## Next Steps (Stage 3)
- Implement meaning/explanation feature
- Check database for custom meanings first
- Use Gemini API for AI-generated meanings
- Implement admin meaning management
- Add language selection for meaning explanations
