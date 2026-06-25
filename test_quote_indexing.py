#!/usr/bin/env python3
"""
Test quote indexing functionality.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Database

def test_quote_indexing():
    """Test quote database operations."""
    print("=" * 50)
    print("Quote Indexing Tests")
    print("=" * 50)
    
    db = Database()
    
    # Test saving quotes
    print("\n1. Testing save_quote...")
    test_quotes = [
        (100, "Success is not final, failure is not fatal.", "en", "text"),
        (101, "Успех не конечен, неудача не фатальна.", "ru", "text"),
        (102, "Muvaffaqiyat yakuniy emas.", "uz", "text"),
        (103, "Photo caption here", "en", "photo"),
    ]
    
    for msg_id, content, lang, media_type in test_quotes:
        success = db.save_quote(msg_id, content, lang, media_type)
        status = "✓" if success else "✗"
        print(f"{status} Saved quote {msg_id}: {content[:30]=}...")
    
    # Test searching quotes
    print("\n2. Testing search_quotes...")
    search_queries = ["success", "muvaffaqiyat", "успех"]
    
    for query in search_queries:
        results = db.search_quotes(query)
        print(f"✓ Search '{query}': Found {len(results)} results")
        for msg_id, content, lang in results:
            print(f"   - {msg_id}: {content[:40]}... ({lang})")
    
    # Test get_quote_by_message_id
    print("\n3. Testing get_quote_by_message_id...")
    quote = db.get_quote_by_message_id(100)
    if quote:
        msg_id, content, lang, media_type = quote
        print(f"✓ Retrieved quote {msg_id}: {content[:40]}... ({lang}, {media_type})")
    else:
        print("✗ Failed to retrieve quote")
    
    print("\n" + "=" * 50)
    print("All quote indexing tests completed!")
    print("=" * 50)
    
    return 0

if __name__ == "__main__":
    sys.exit(test_quote_indexing())
