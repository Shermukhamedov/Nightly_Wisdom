#!/usr/bin/env python3
"""
Test language detection functionality.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from language_detector import get_language_detector

def test_language_detection():
    """Test language detection for various texts."""
    print("=" * 50)
    print("Language Detection Tests")
    print("=" * 50)
    
    detector = get_language_detector()
    
    test_cases = [
        # English texts
        ("Success is not final, failure is not fatal.", "en"),
        ("The only way to do great work is to love what you do.", "en"),
        ("I want to learn Python programming.", "en"),
        
        # Russian texts
        ("Успех не конечен, неудача не фатальна.", "ru"),
        ("Я хочу учить программирование.", "ru"),
        ("Это хороший день для начала.", "ru"),
        
        # Uzbek texts
        ("Muvaffaqiyat yakuniy emas muvaffaqiyatsizlik ham halokatli emas", "uz"),
        ("Men Python dasturlashini organmoqchiman", "uz"),
        ("Bu kun boshlash uchun yaxshi kun", "uz"),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected_lang in test_cases:
        detected = detector.detect(text)
        status = "✓" if detected == expected_lang else "✗"
        
        if detected == expected_lang:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} Expected: {expected_lang}, Detected: {detected}")
        print(f"   Text: {text[:50]}...")
        print()
    
    # Test translation options
    print("=" * 50)
    print("Translation Options Tests")
    print("=" * 50)
    
    for source_lang in ['en', 'ru', 'uz']:
        options = detector.get_translation_options(source_lang)
        print(f"Source: {source_lang} -> Options: {options}")
        
        # Verify source language is not in options
        if source_lang not in options:
            print("✓ Source language correctly excluded")
        else:
            print("✗ Source language should be excluded")
            failed += 1
        passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{passed + failed}")
    print("=" * 50)
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(test_language_detection())
