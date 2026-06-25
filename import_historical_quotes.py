#!/usr/bin/env python3
"""
Historical Quote Import Script

This script imports all historical posts from the Nightly Wisdom channel
into the quotes table. It runs once to populate the database with existing
quotes before the bot started auto-indexing.
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from telethon import TelegramClient
from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument, MessageMediaGeo
from database import Database
from language_detector import get_language_detector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Telethon configuration
API_ID = int(os.getenv("TELEGRAM_API_ID", "0"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", "Nightly_Wisdom")

# Session file for Telethon
SESSION_FILE = "import_session"


async def import_historical_quotes():
    """Import all historical quotes from the channel."""
    
    # Check if API credentials are set
    if API_ID == 0 or not API_HASH:
        logger.error("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env file")
        logger.error("Get these from https://my.telegram.org")
        return
    
    # Initialize database
    db = Database()
    detector = get_language_detector()
    
    # Initialize Telethon client
    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    
    try:
        await client.start()
        logger.info(f"Connected to Telegram as {await client.get_me()}")
        
        # Get channel entity
        channel = await client.get_entity(CHANNEL_USERNAME)
        logger.info(f"Found channel: {channel.title} (@{channel.username})")
        
        # Fetch all messages from the channel
        logger.info("Fetching channel history...")
        messages = []
        async for message in client.iter_messages(channel, reverse=True):
            messages.append(message)
        
        logger.info(f"Total messages fetched: {len(messages)}")
        
        # Process each message
        imported_count = 0
        skipped_count = 0
        error_count = 0
        
        for msg in messages:
            try:
                message_id = msg.id
                
                # Check if already exists in database
                existing = db.get_quote_by_message_id(message_id)
                if existing:
                    logger.debug(f"Skipping duplicate message {message_id}")
                    skipped_count += 1
                    continue
                
                # Extract content
                content = None
                media_type = "text"
                
                if msg.text:
                    content = msg.text
                elif msg.media:
                    content = msg.message or ""
                    
                    # Determine media type
                    if isinstance(msg.media, MessageMediaPhoto):
                        media_type = "photo"
                    elif isinstance(msg.media, MessageMediaDocument):
                        # Check if it's a video
                        if msg.media.document:
                            if msg.media.document.mime_type == "video/mp4":
                                media_type = "video"
                            elif msg.media.document.mime_type == "audio/mpeg":
                                media_type = "audio"
                            else:
                                media_type = "document"
                    elif isinstance(msg.media, MessageMediaGeo):
                        media_type = "geo"
                    else:
                        media_type = "unknown"
                else:
                    # No text or media, skip
                    logger.debug(f"Skipping message {message_id} (no content)")
                    skipped_count += 1
                    continue
                
                # Detect language if there's text content
                language = None
                if content and content.strip():
                    try:
                        language = detector.detect(content)
                    except Exception as e:
                        logger.warning(f"Error detecting language for message {message_id}: {e}")
                        language = "unknown"
                else:
                    language = "unknown"
                
                # Get created_at date
                created_at = datetime.fromtimestamp(msg.date.timestamp()).isoformat()
                
                # Save to database
                success = db.save_quote(message_id, content or "", language or "unknown", media_type)
                
                if success:
                    imported_count += 1
                    logger.info(f"Imported message {message_id}: {media_type}, language: {language}")
                else:
                    error_count += 1
                    logger.error(f"Failed to import message {message_id}")
                
            except Exception as e:
                error_count += 1
                logger.error(f"Error processing message {msg.id}: {e}")
        
        # Summary
        logger.info("=" * 50)
        logger.info("Import Summary")
        logger.info("=" * 50)
        logger.info(f"Total messages fetched: {len(messages)}")
        logger.info(f"Successfully imported: {imported_count}")
        logger.info(f"Skipped (duplicates/no content): {skipped_count}")
        logger.info(f"Errors: {error_count}")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Error during import: {e}")
    finally:
        await client.disconnect()
        logger.info("Disconnected from Telegram")


if __name__ == "__main__":
    import asyncio
    asyncio.run(import_historical_quotes())
