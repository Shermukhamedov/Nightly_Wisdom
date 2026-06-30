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
            
            # Quotes table for indexing channel posts
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quotes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id INTEGER NOT NULL UNIQUE,
                    content TEXT,
                    language TEXT,
                    media_type TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Contributions table for tracking user contributions
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS contributions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    content_type TEXT NOT NULL,
                    content TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    def get_all_users(self) -> list:
        """Get all user IDs from the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT user_id FROM users")
                results = cursor.fetchall()
                return [row[0] for row in results]
        except Exception as e:
            logger.error(f"Error getting all users: {e}")
            return []
    
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
    
    def save_quote(self, message_id: int, content: str, language: str, media_type: str) -> bool:
        """Save a quote from the channel to the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO quotes (message_id, content, language, media_type, created_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (message_id, content, language, media_type))
                conn.commit()
                logger.info(f"Saved quote {message_id} with language {language} and media type {media_type}")
                return True
        except Exception as e:
            logger.error(f"Error saving quote: {e}")
            return False
    
    def search_quotes(self, query: str, limit: int = 10) -> list:
        """Search quotes by keywords, partial words, or quote text."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                # Use LIKE for partial matching
                cursor.execute("""
                    SELECT message_id, content, language 
                    FROM quotes 
                    WHERE content LIKE ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                """, (f"%{query}%", limit))
                results = cursor.fetchall()
                logger.info(f"Found {len(results)} quotes matching '{query}'")
                return results
        except Exception as e:
            logger.error(f"Error searching quotes: {e}")
            return []
    
    def get_quote_by_message_id(self, message_id: int) -> Optional[tuple]:
        """Get a quote by its message ID."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT message_id, content, language, media_type FROM quotes WHERE message_id = ?",
                    (message_id,)
                )
                result = cursor.fetchone()
                return result
        except Exception as e:
            logger.error(f"Error getting quote by message ID: {e}")
            return None
    
    def save_contribution(self, user_id: int, content_type: str, content: str) -> bool:
        """Save a user contribution to the database."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO contributions (user_id, content_type, content, status)
                    VALUES (?, ?, ?, 'pending')
                """, (user_id, content_type, content))
                conn.commit()
                logger.info(f"Saved contribution from user {user_id}: {content_type}")
                return True
        except Exception as e:
            logger.error(f"Error saving contribution: {e}")
            return False
    
    def update_contribution_status(self, contribution_id: int, status: str) -> bool:
        """Update contribution status (approved, rejected, already_exists)."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE contributions SET status = ? WHERE id = ?",
                    (status, contribution_id)
                )
                conn.commit()
                logger.info(f"Updated contribution {contribution_id} to status: {status}")
                return True
        except Exception as e:
            logger.error(f"Error updating contribution status: {e}")
            return False
    
    def get_contribution_stats(self) -> dict:
        """Get contribution statistics."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total contributions
                cursor.execute("SELECT COUNT(*) FROM contributions")
                total = cursor.fetchone()[0]
                
                # Approved
                cursor.execute("SELECT COUNT(*) FROM contributions WHERE status = 'approved'")
                approved = cursor.fetchone()[0]
                
                # Rejected
                cursor.execute("SELECT COUNT(*) FROM contributions WHERE status = 'rejected'")
                rejected = cursor.fetchone()[0]
                
                # Already exists
                cursor.execute("SELECT COUNT(*) FROM contributions WHERE status = 'already_exists'")
                already_exists = cursor.fetchone()[0]
                
                # Pending
                cursor.execute("SELECT COUNT(*) FROM contributions WHERE status = 'pending'")
                pending = cursor.fetchone()[0]
                
                return {
                    "total": total,
                    "approved": approved,
                    "rejected": rejected,
                    "already_exists": already_exists,
                    "pending": pending
                }
        except Exception as e:
            logger.error(f"Error getting contribution stats: {e}")
            return {
                "total": 0,
                "approved": 0,
                "rejected": 0,
                "already_exists": 0,
                "pending": 0
            }
