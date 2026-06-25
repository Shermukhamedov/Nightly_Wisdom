#!/usr/bin/env python3
"""
Basic setup test to verify all components can be imported and initialized.
"""

import sys
import os

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    try:
        import database
        print("✓ database module imported")
        
        import languages
        print("✓ languages module imported")
        
        import channel_validator
        print("✓ channel_validator module imported")
        
        # Skip bot module import as it requires environment variables
        print("⊘ bot module skipped (requires environment variables)")
        
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_database():
    """Test database initialization."""
    print("\nTesting database...")
    try:
        from database import Database
        # Use a file-based database for testing to ensure persistence
        import tempfile
        import os
        
        # Create temporary database file
        fd, db_path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        
        try:
            db = Database(db_path)
            print("✓ Database initialized")
            
            # Test user language operations
            db.save_user_language(12345, "en")
            lang = db.get_user_language(12345)
            assert lang == "en", f"Expected 'en', got '{lang}'"
            print("✓ User language save/retrieve works")
            
            # Test meaning operations
            db.save_meaning(100, "en", "Test meaning")
            meaning = db.get_meaning(100, "en")
            assert meaning == "Test meaning", f"Expected 'Test meaning', got '{meaning}'"
            print("✓ Meaning save/retrieve works")
            
            # Test admin operations
            db.add_admin(99999)
            assert db.is_admin(99999), "Admin check failed"
            print("✓ Admin operations work")
            
            return True
        finally:
            # Clean up temporary database file
            if os.path.exists(db_path):
                os.remove(db_path)
    except Exception as e:
        print(f"✗ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_channel_validator():
    """Test channel validator."""
    print("\nTesting channel validator...")
    try:
        from channel_validator import ChannelValidator
        validator = ChannelValidator("Nightly_Wisdom")
        print("✓ ChannelValidator initialized")
        
        # Test valid URL
        valid_url = "https://t.me/Nightly_Wisdom/466"
        is_valid, msg_id = validator.validate_and_extract(valid_url)
        assert is_valid, "Valid URL should pass validation"
        assert msg_id == 466, f"Expected message ID 466, got {msg_id}"
        print("✓ Valid URL validation works")
        
        # Test invalid URL
        invalid_url = "https://t.me/OtherChannel/123"
        is_valid, msg_id = validator.validate_and_extract(invalid_url)
        assert not is_valid, "Invalid URL should fail validation"
        assert msg_id is None, "Invalid URL should return None for message ID"
        print("✓ Invalid URL validation works")
        
        return True
    except Exception as e:
        print(f"✗ Channel validator test failed: {e}")
        return False

def test_languages():
    """Test language module."""
    print("\nTesting languages module...")
    try:
        from languages import get_text, get_language_name, LANGUAGES
        
        # Test get_text
        text = get_text("en", "welcome")
        assert "Welcome" in text, f"Expected 'Welcome' in text, got: {text}"
        print("✓ get_text works")
        
        # Test get_language_name
        name = get_language_name("en")
        assert "English" in name, f"Expected 'English' in name, got: {name}"
        print("✓ get_language_name works")
        
        # Test language codes
        assert "en" in LANGUAGES, "English language should exist"
        assert "ru" in LANGUAGES, "Russian language should exist"
        assert "uz" in LANGUAGES, "Uzbek language should exist"
        print("✓ All required languages exist")
        
        return True
    except Exception as e:
        print(f"✗ Languages test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("=" * 50)
    print("Stage 1 Setup Tests")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_database,
        test_channel_validator,
        test_languages
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 50)
    print(f"Tests passed: {sum(results)}/{len(results)}")
    print("=" * 50)
    
    if all(results):
        print("✓ All tests passed! Stage 1 setup is complete.")
        return 0
    else:
        print("✗ Some tests failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
