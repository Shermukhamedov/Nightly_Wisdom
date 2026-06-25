#!/usr/bin/env python3
"""
Test Gemini API integration.
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

async def test_gemini_translation():
    """Test Gemini translation functionality."""
    print("=" * 50)
    print("Gemini API Translation Tests")
    print("=" * 50)
    
    try:
        # First, let's list available models
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        
        print("Available models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"  - {model.name}")
        print()
        
        gemini_service = get_gemini_service()
        print("✓ Gemini service initialized\n")
        
        # Test translations
        test_cases = [
            ("Success is not final, failure is not fatal.", "uz"),
            ("The only way to do great work is to love what you do.", "ru"),
            ("I want to learn Python programming.", "uz"),
        ]
        
        for text, target_lang in test_cases:
            print(f"Testing: {text[:40]}... -> {target_lang}")
            translation = await gemini_service.translate_text(text, target_lang)
            
            if translation:
                print(f"✓ Translation successful:")
                print(f"  {translation[:100]}...")
                print()
            else:
                print(f"✗ Translation failed")
                print()
                return 1
        
        print("=" * 50)
        print("All translation tests passed!")
        print("=" * 50)
        return 0
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(test_gemini_translation()))
