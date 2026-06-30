#!/usr/bin/env python3
"""
Fetch Historical Quotes using Bot API

This script fetches historical posts from the Nightly Wisdom channel
using the Bot API and exports them as SQL for D1 import.
"""

import os
import sys
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "Nightly_Wisdom")
OUTPUT_SQL = "historical_quotes_import.sql"


def get_channel_id(bot_token: str, channel_username: str) -> int:
    """Get channel ID from username."""
    url = f"https://api.telegram.org/bot{bot_token}/getChat"
    params = {"chat_id": f"@{channel_username}"}
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if not data.get("ok"):
        logger.error(f"Failed to get channel info: {data}")
        sys.exit(1)
    
    return data["result"]["id"]


def fetch_channel_posts(bot_token: str, channel_id: int, limit: int = 100):
    """Fetch posts from channel using Bot API."""
    url = f"https://api.telegram.org/bot{bot_token}/getChatHistory"
    
    posts = []
    offset = 0
    
    while len(posts) < limit:
        params = {
            "chat_id": channel_id,
            "limit": min(100, limit - len(posts)),
            "offset": offset
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if not data.get("ok"):
            logger.error(f"Failed to fetch messages: {data}")
            break
        
        messages = data.get("result", [])
        if not messages:
            break
        
        posts.extend(messages)
        offset += len(messages)
        
        logger.info(f"Fetched {len(posts)} messages so far...")
        
        # Rate limiting
        import time
        time.sleep(0.5)
    
    return posts


def detect_language(text: str) -> str:
    """Simple language detection based on character sets."""
    if not text:
        return "unknown"
    
    # Check for Cyrillic (Russian)
    if any('\u0400' <= char <= '\u04FF' for char in text):
        return "ru"
    
    # Check for Latin script (English)
    if any('a' <= char.lower() <= 'z' for char in text):
        return "en"
    
    # Default to Uzbek (uses both Latin and Cyrillic)
    return "uz"


def generate_sql(posts: list) -> list:
    """Generate SQL INSERT statements from posts."""
    sql_statements = []
    
    for post in posts:
        message_id = post.get("message_id")
        
        # Extract content
        content = post.get("text") or post.get("caption") or ""
        
        # Determine media type
        media_type = "text"
        if post.get("photo"):
            media_type = "photo"
        elif post.get("video"):
            media_type = "video"
        elif post.get("audio"):
            media_type = "audio"
        elif post.get("document"):
            media_type = "document"
        
        # Skip if no content
        if not content and media_type == "text":
            continue
        
        # Detect language
        language = detect_language(content) if content else "unknown"
        
        # Get created_at date
        created_at = datetime.fromtimestamp(post.get("date", 0)).isoformat()
        
        # Escape content for SQL
        escaped_content = content.replace("'", "''") if content else ''
        
        # Generate INSERT statement
        sql = f"INSERT OR REPLACE INTO quotes (message_id, content, language, media_type, created_at) VALUES ({message_id}, '{escaped_content}', '{language}', '{media_type}', '{created_at}');"
        sql_statements.append(sql)
        
        logger.info(f"Generated SQL for message {message_id}: {media_type}, language: {language}")
    
    return sql_statements


def main():
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN environment variable is required")
        sys.exit(1)
    
    logger.info(f"Fetching channel info for @{CHANNEL_USERNAME}...")
    channel_id = get_channel_id(BOT_TOKEN, CHANNEL_USERNAME)
    logger.info(f"Channel ID: {channel_id}")
    
    logger.info("Fetching historical posts...")
    posts = fetch_channel_posts(BOT_TOKEN, channel_id, limit=200)
    logger.info(f"Total posts fetched: {len(posts)}")
    
    logger.info("Generating SQL statements...")
    sql_statements = generate_sql(posts)
    
    # Write to SQL file
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        f.write("-- Historical Quotes Import for D1\n")
        f.write(f"-- Generated: {datetime.now().isoformat()}\n")
        f.write(f"-- Channel: {CHANNEL_USERNAME}\n")
        f.write(f"-- Total quotes: {len(sql_statements)}\n\n")
        f.write("\n".join(sql_statements))
    
    logger.info("=" * 50)
    logger.info("Import Summary")
    logger.info("=" * 50)
    logger.info(f"Total posts fetched: {len(posts)}")
    logger.info(f"SQL statements generated: {len(sql_statements)}")
    logger.info(f"SQL file saved to: {OUTPUT_SQL}")
    logger.info("=" * 50)
    logger.info(f"To import to D1, run:")
    logger.info(f"wrangler d1 execute nightly-wisdom-db --remote --file={OUTPUT_SQL}")


if __name__ == "__main__":
    main()
