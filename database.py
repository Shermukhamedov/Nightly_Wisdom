import sqlite3
from typing import Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path: str = "bot.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database tables."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    language TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Meanings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS meanings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id INTEGER NOT NULL,
                    language TEXT NOT NULL,
                    meaning TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(message_id, language)
                )
            """)
            
            # Admins table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    user_id INTEGER PRIMARY KEY
                )
            """)
            
            conn.commit()
            logger.info("Database initialized successfully")
    
    def save_user_language(self, user_id: int, language: str) -> bool:
        """Save or update user language preference."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO users (user_id, language, created_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (user_id, language))
                conn.commit()
                logger.info(f"Saved language {language} for user {user_id}")
                return True
        except Exception as e:
            logger.error(f"Error saving user language: {e}")
            return False
    
    def get_user_language(self, user_id: int) -> Optional[str]:
        """Get user's preferred language."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT language FROM users WHERE user_id = ?", (user_id,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting user language: {e}")
            return None
    
    def save_meaning(self, message_id: int, language: str, meaning: str) -> bool:
        """Save custom meaning for a message."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO meanings (message_id, language, meaning, created_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """, (message_id, language, meaning))
                conn.commit()
                logger.info(f"Saved meaning for message {message_id} in {language}")
                return True
        except Exception as e:
            logger.error(f"Error saving meaning: {e}")
            return False
    
    def get_meaning(self, message_id: int, language: str) -> Optional[str]:
        """Get custom meaning for a message."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT meaning FROM meanings WHERE message_id = ? AND language = ?",
                    (message_id, language)
                )
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception as e:
            logger.error(f"Error getting meaning: {e}")
            return None
    
    def add_admin(self, user_id: int) -> bool:
        """Add user to admins table."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("INSERT OR IGNORE INTO admins (user_id) VALUES (?)", (user_id,))
                conn.commit()
                logger.info(f"Added admin {user_id}")
                return True
        except Exception as e:
            logger.error(f"Error adding admin: {e}")
            return False
    
    def is_admin(self, user_id: int) -> bool:
        """Check if user is admin."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT user_id FROM admins WHERE user_id = ?", (user_id,))
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"Error checking admin status: {e}")
            return False
