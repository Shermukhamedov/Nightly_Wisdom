import re
import logging
from typing import Optional, Tuple
from aiogram.types import Message

logger = logging.getLogger(__name__)

class ChannelValidator:
    def __init__(self, channel_username: str):
        self.channel_username = channel_username
        self.channel_url = f"https://t.me/{channel_username}"
    
    def is_valid_channel_url(self, url: str) -> bool:
        """Check if URL belongs to the Nightly Wisdom channel."""
        pattern = rf"https://t\.me/{self.channel_username}/\d+"
        return bool(re.match(pattern, url))
    
    def extract_message_id(self, url: str) -> Optional[int]:
        """Extract message ID from channel URL."""
        pattern = rf"https://t\.me/{self.channel_username}/(\d+)"
        match = re.match(pattern, url)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                logger.error(f"Invalid message ID in URL: {url}")
                return None
        return None
    
    def is_forwarded_from_channel(self, message: Message) -> bool:
        """Check if message is forwarded from Nightly Wisdom channel."""
        if message.forward_from_chat:
            chat_username = message.forward_from_chat.username
            return chat_username == self.channel_username
        return False
    
    def get_forwarded_message_id(self, message: Message) -> Optional[int]:
        """Get original message ID from forwarded message."""
        if message.forward_from_message_id:
            return message.forward_from_message_id
        return None
    
    def validate_and_extract(self, url: str) -> Tuple[bool, Optional[int]]:
        """Validate URL and extract message ID."""
        if not self.is_valid_channel_url(url):
            return False, None
        
        message_id = self.extract_message_id(url)
        if message_id is None:
            return False, None
        
        return True, message_id
    
    def validate_forwarded_message(self, message: Message) -> Tuple[bool, Optional[int]]:
        """Validate forwarded message and extract message ID."""
        if not self.is_forwarded_from_channel(message):
            return False, None
        
        message_id = self.get_forwarded_message_id(message)
        if message_id is None:
            return False, None
        
        return True, message_id
