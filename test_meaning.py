#!/usr/bin/env python3
"""
Test Gemini API meaning generation functionality.
"""

import os
import sys
import asyncio

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from gemini_service import get_gemini_service

# Load environment variables
load_dotenv()

async def test_gemini_meaning():
    """Test Gemini meaning generation functionality."""
    print("=" * 50)
    print("Gemini API Meaning Generation Tests")
    print("=" * 50)
    
    try:
        gemini_service = get_gemini_service()
        print("✓ Gemini service initialized\n")
        
        # Test meaning generation
        test_cases = [
            ("Success is not final, failure is not fatal.", "en"),
            ("Success is not final, failure is not fatal.", "uz"),
            ("Success is not final, failure is not fatal.", "ru"),
            ("The only way to do great work is to love what you do.", "en"),
        ]
        
        for quote, target_lang in test_cases:
            print(f"Testing meaning generation in {target_lang}:")
            print(f"Quote: {quote[:60]}...")
            meaning = await gemini_service.generate_meaning(quote, target_lang)
            
            if meaning:
                print(f"✓ Meaning generation successful:")
                print(f"  {meaning[:200]}...")
                print()
            else:
                print(f"✗ Meaning generation failed")
                print()
                return 1
        
        print("=" * 50)
        print("All meaning generation tests passed!")
        print("=" * 50)
        return 0
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(test_gemini_meaning()))
