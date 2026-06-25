# Nightly Wisdom Telegram Bot - Development Plan

## Project Overview

Build a Telegram bot for the Telegram channel "Nightly Wisdom".

Channel URL:

https://t.me/Nightly_Wisdom

The bot must only work with content originating from this channel.

Users can:

* Send a post URL from the channel.
* Forward a post from the channel.

The bot then provides:

* Translation of the quote.
* Meaning/Explanation of the quote.

The project must be built incrementally using the stages below.

---

# Technical Requirements

## Tech Stack

* Python
* aiogram 3.x
* SQLite database
* Telegram Bot API
* Gemini API (free tier) for AI features
* Cloudflare Workers or another free hosting solution

---

# General Rules

## Channel Validation

The bot must only accept content from:

https://t.me/Nightly_Wisdom

Valid URL example:

https://t.me/Nightly_Wisdom/466

If the URL belongs to another channel:

Bot response:

"Please send messages only from our channel."

The text "our channel" must be clickable and open:

https://t.me/Nightly_Wisdom

---

## Supported Input Types

### 1. Channel URL

Example:

https://t.me/Nightly_Wisdom/466

### 2. Forwarded Channel Post

Users can forward a post directly from Nightly Wisdom.

The bot must verify that the forwarded message originated from Nightly Wisdom.

---

# Language System

When a user opens the bot for the first time:

Command:

/start

Bot:

"Please select your language"

Buttons:

* Uzbek
* Russian
* English

Store selected language in database.

All future bot messages must be shown in the user's selected language.

Users can change language anytime using:

/language

Bot must show language selection again.

---

# STAGE 1

# Core Bot Structure

Goal:
Verify that the bot can process commands, save user language, validate channel URLs, validate forwarded posts, and display action buttons.

---

## Commands

### /start

Show language selection.

Save chosen language.

Send welcome message.

---

### /language

Allow changing language.

---

### /help

Show basic usage instructions.

---

### /meaning

Admin-only command.

Only the channel owner can use this command.

For now just create the command skeleton.

Implementation comes later.

---

## URL Processing

When a user sends:

https://t.me/Nightly_Wisdom/466

Bot must:

1. Validate URL.
2. Extract message ID.
3. Save message ID temporarily.
4. Display inline buttons.

Buttons:

* Translation
* Meaning

---

## Forwarded Message Processing

When a user forwards a message from Nightly Wisdom:

Bot must:

1. Verify source channel.
2. Extract original message ID.
3. Save message ID temporarily.
4. Display inline buttons.

Buttons:

* Translation
* Meaning

---

## Invalid Content Handling

If URL belongs to another channel:

Show:

"Please send messages only from our channel."

If forwarded post is from another channel:

Show:

"Please send messages only from our channel."

---

## Stage 1 Success Criteria

The bot successfully:

* Responds to /start
* Responds to /language
* Saves language preference
* Accepts Nightly Wisdom URLs
* Accepts forwarded Nightly Wisdom posts
* Rejects other channels
* Shows Translation and Meaning buttons

No AI integration yet.

---

# STAGE 2

# Translation Feature

Goal:
Allow users to translate quotes.

---

## Translation Button Flow

User:

Sends channel URL or forwards post.

Bot:

Shows:

* Translation
* Meaning

User clicks:

Translation

---

## Detect Original Language

The bot must automatically detect:

* Uzbek
* Russian
* English

---

## Language Selection Logic

If quote is English:

Show:

* Uzbek
* Russian

If quote is Russian:

Show:

* Uzbek
* English

If quote is Uzbek:

Show:

* Russian
* English

Do NOT show the source language.

---

## Translation Process

Use Gemini API.

Prompt should request:

* Accurate translation
* Preserve meaning
* Preserve quote style

---

## Response

Return only the translated quote.

No explanations.

---

## User Language Rule

Even if the user's interface language is English:

If quote is English and user selects Translation:

Bot must still ask which target language they want.

After translation is completed:

Bot returns to the user's normal interface language.

Example:

Interface Language = English

Quote Language = English

User clicks Translation

Bot:

Select translation language:

* Uzbek
* Russian

User selects Uzbek

Bot returns Uzbek translation

Future menus remain English.

---

## Stage 2 Success Criteria

The bot successfully:

* Detects quote language
* Shows valid translation options
* Uses Gemini API
* Returns translated quote
* Keeps interface language unchanged

---

# STAGE 3

# Meaning / Explanation Feature

Goal:
Allow users to understand the meaning of quotes.

---

## Meaning Button Flow

User:

Clicks Meaning.

Bot:

Shows language selection.

* Uzbek
* Russian
* English

User selects language.

---

## Custom Meaning Priority

Before calling AI:

Check database.

If custom meaning exists:

Return custom meaning.

Do NOT call Gemini.

---

## AI Meaning Generation

If custom meaning does not exist:

Use Gemini API.

Prompt requirements:

* Explain quote simply.
* Keep explanation concise.
* Use selected language.
* Explain practical life lesson.
* Avoid long essays.

---

## Meaning Response Format

Example:

Quote:
"Success is not final, failure is not fatal."

Meaning:
"This quote teaches that neither success nor failure lasts forever. We should continue improving and moving forward regardless of temporary outcomes."

---

## Stage 3 Success Criteria

The bot successfully:

* Shows language options
* Checks custom meanings first
* Uses Gemini only if needed
* Returns explanation in selected language

---

# FUTURE STAGE (NOT IMPLEMENT NOW)

# Manual Meaning Management

Admin-only feature.

Command:

/meaning

Flow:

1. Admin sends /meaning
2. Bot asks for post URL
3. Admin sends URL
4. Bot asks for meaning
5. Admin sends meaning
6. Meaning is saved in database

Database example:

message_id
language
meaning

When users request Meaning:

Bot checks database first.

If found:

Return saved meaning.

If not found:

Generate using Gemini.

This future feature must support:

* Text posts
* Photos
* Videos

Voice messages are excluded.

---

# Database Structure

## users

* user_id
* language
* created_at

## meanings

* message_id
* language
* meaning
* created_at

## admins

* user_id

---

# Code Requirements

* Modular architecture
* Separate handlers
* Separate services
* Separate database layer
* Separate Gemini integration layer
* Environment variables for secrets
* Logging enabled
* Error handling implemented
* Easy to extend with future features
