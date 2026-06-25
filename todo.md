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


Stage 4 — Inline Quote Search
Goal

Allow users to search Nightly Wisdom quotes directly from any Telegram chat.

User Flow

User types:

@Nightly_Wisdom_Bot success

Bot shows matching quotes from the Nightly Wisdom database.

Example:

Success is not final, failure is not fatal...

When clicked:

Success is not final, failure is not fatal.
— Winston Churchill

[Translate]
[Meaning]
Requirements
Enable Telegram Inline Mode.
Store all channel quotes in the database.
Search by:
Keywords
Partial words
Quote text
Return top matching results.
Database Addition
quotes
-------
message_id
content
language
created_at
Success Criteria
User can search from any chat.
Results appear instantly.
No need to open the bot first.
Stage 5 — Support System
New Command
/support
User Flow

User:

/ support

Bot:

Please take a screenshot of the problem and send it to @akkkkbar.
You may also include a short description of the issue.
Future Upgrade

Instead of sending users to your username:

/support

Bot asks:

Please describe your problem or send a screenshot.

Everything gets forwarded to you automatically.

This is more professional.

Stage 6 — Community Contributions
New Command
/contribution
User Flow

User:

/contribution

Bot:

Send your quote, photo, or video.

If your contribution is approved, it may be published on the Nightly Wisdom channel.
Accepted Content
Text
Photo
Video

Not accepted:

Voice messages
Stickers
GIFs
Admin Notification

When user submits:

Bot forwards content to admin.

Example:

📨 New ContributionStage 4 — Inline Quote Search
Goal

Allow users to search Nightly Wisdom quotes directly from any Telegram chat.

User Flow

User types:

@Nightly_Wisdom_Bot success

Bot shows matching quotes from the Nightly Wisdom database.

Example:

Success is not final, failure is not fatal...

When clicked:

Success is not final, failure is not fatal.
— Winston Churchill

[Translate]
[Meaning]
Requirements
Enable Telegram Inline Mode.
Store all channel quotes in the database.
Search by:
Keywords
Partial words
Quote text
Return top matching results.
Database Addition
quotes
-------
message_id
content
language
created_at
Success Criteria
User can search from any chat.
Results appear instantly.
No need to open the bot first.
Stage 5 — Support System
New Command
/support
User Flow

User:

/ support

Bot:

Please take a screenshot of the problem and send it to @akkkkbar.
You may also include a short description of the issue.
Future Upgrade

Instead of sending users to your username:

/support

Bot asks:

Please describe your problem or send a screenshot.

Everything gets forwarded to you automatically.

This is more professional.

Stage 6 — Community Contributions
New Command
/contribution
User Flow

User:

/contribution

Bot:

Send your quote, photo, or video.

If your contribution is approved, it may be published on the Nightly Wisdom channel.
Accepted Content
Text
Photo
Video

Not accepted:

Voice messages
Stickers
GIFs
Admin Notification

When user submits:

Bot forwards content to admin.

Example:

📨 New Contribution

User:
@username

Telegram ID:
123456789

Type:
Text

Content:
Success is not final...

For photos/videos:

Forward the original media.

Admin Buttons

Under each submission:

[✅ Approve]
[❌ Reject]
[📚 Already Exists]
Approve Flow

Admin clicks:

Approve

User receives:

Thank you for your contribution.

We reviewed it and loved it. It may appear on our channel soon.
Reject Flow

Admin clicks:

Reject

User receives:

Thank you for your contribution.

Unfortunately, we found it unsuitable for our channel.
Already Exists Flow

Admin clicks:

Already Exists

User receives:

Thank you for your contribution.

The quote already exists in our collection.
Stage 7 — Contribution Dashboard
New Admin Command
/admin

Statistics:

Total Contributions: 352

Approved: 201
Rejected: 94
Already Exists: 57

Pending: 0

Useful once your channel grows.

Stage 8 — Automatic Quote Indexing

Since the bot is already an admin of the channel:

Every new post should automatically be saved:

Channel Post
      ↓
Bot receives update
      ↓
Database

Store:

Message ID
Quote text
Language
Media type
Date

This stage is important because it powers the inline search feature from Stage 4.

Recommended Order
Finish Stage 3 (Meaning)
Stage 8 (Automatic Quote Indexing)
Stage 4 (Inline Search)
Stage 5 (Support)
Stage 6 (Contributions)
Stage 7 (Admin Dashboard)

The automatic indexing stage should come before the search engine, otherwise the bot won't have a quote database to search through.

User:
@username

Telegram ID:
123456789

Type:
Text

Content:
Success is not final...

For photos/videos:

Forward the original media.

Admin Buttons

Under each submission:

[✅ Approve]
[❌ Reject]
[📚 Already Exists]
Approve Flow

Admin clicks:

Approve

User receives:

Thank you for your contribution.

We reviewed it and loved it. It may appear on our channel soon.
Reject Flow

Admin clicks:Stage 4 — Inline Quote Search
Goal

Allow users to search Nightly Wisdom quotes directly from any Telegram chat.

User Flow

User types:

@Nightly_Wisdom_Bot success

Bot shows matching quotes from the Nightly Wisdom database.

Example:

Success is not final, failure is not fatal...

When clicked:

Success is not final, failure is not fatal.
— Winston Churchill

[Translate]
[Meaning]
Requirements
Enable Telegram Inline Mode.
Store all channel quotes in the database.
Search by:
Keywords
Partial words
Quote text
Return top matching results.
Database Addition
quotes
-------
message_id
content
language
created_at
Success Criteria
User can search from any chat.
Results appear instantly.
No need to open the bot first.
Stage 5 — Support System
New Command
/support
User Flow

User:

/ support

Bot:

Please take a screenshot of the problem and send it to @akkkkbar.
You may also include a short description of the issue.


Stage 6 — Community Contributions
New Command
/contribution
User Flow

User:

/contribution

Bot:

Send your quote, photo, or video.

If your contribution is approved, it may be published on the Nightly Wisdom channel.
Accepted Content
Text
Photo
Video

Not accepted:

Voice messages
Stickers
GIFs
Admin Notification

When user submits:

Bot forwards content to admin.

Example:

📨 New Contribution

User:
@username

Telegram ID:
123456789

Type:
Text

Content:
Success is not final...

For photos/videos:

Forward the original media.

Admin Buttons

Under each submission:

[✅ Approve]
[❌ Reject]
[📚 Already Exists]
Approve Flow

Admin clicks:

Approve

User receives:

Thank you for your contribution.

We reviewed it and loved it. It may appear on our channel soon.
Reject Flow

Admin clicks:

Reject

User receives:

Thank you for your contribution.

Unfortunately, we found it unsuitable for our channel.
Already Exists Flow

Admin clicks:

Already Exists

User receives:

Thank you for your contribution.

The quote already exists in our collection.

Stage 7 — Automatic Quote Indexing

Since the bot is already an admin of the channel:

Every new post should automatically be saved:

Channel Post
      ↓
Bot receives update
      ↓
Database

Store:

Message ID
Quote text
Language
Media type
Date

This stage is important because it powers the inline search feature from Stage 4.

Recommended Order
Finish Stage 3 (Meaning)
Stage 7 (Automatic Quote Indexing)
Stage 4 (Inline Search)
Stage 5 (Support)
Stage 6 (Contributions)

The automatic indexing stage should come before the search engine, otherwise the bot won't have a quote database to search through.
