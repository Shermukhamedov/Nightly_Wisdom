#!/usr/bin/env python3
"""
Test multi-provider AI service with fallback.
"""

import os
import sys
import asyncio

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
from ai_service import get_ai_service

# Load environment variables
load_dotenv()

async def test_ai_service():
    """Test multi-provider AI service."""
    print("=" * 50)
    print("Multi-Provider AI Service Tests")
    print("=" * 50)
    
    try:
        ai_service = get_ai_service()
        print("✓ AI service initialized\n")
        
        # Test translations
        test_cases = [
            ("Success is not final, failure is not fatal.", "uz"),
            ("The only way to do great work is to love what you do.", "ru"),
        ]
        
        for text, target_lang in test_cases:
            print(f"Testing translation: {text[:40]}... -> {target_lang}")
            translation = await ai_service.translate_text(text, target_lang)
            
            if translation:
                print(f"✓ Translation successful:")
                print(f"  {translation[:100]}...")
                print()
            else:
                print(f"✗ Translation failed")
                print()
        
        # Test meaning generation
        print("Testing meaning generation...")
        meaning = await ai_service.generate_meaning("Success is not final, failure is not fatal.", "en")
        
        if meaning:
            print(f"✓ Meaning generation successful:")
            print(f"  {meaning[:200]}...")
            print()
        else:
            print(f"✗ Meaning generation failed")
            print()
        
        print("=" * 50)
        print("Tests completed!")
        print("=" * 50)
        return 0
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(test_ai_service()))
