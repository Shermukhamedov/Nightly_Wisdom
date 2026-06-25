import os
import logging
from typing import Optional
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from dotenv import load_dotenv

from database import Database
from languages import LANGUAGES, get_text, get_language_name, LANGUAGE_CODES
from channel_validator import ChannelValidator
from gemini_service import get_gemini_service
from language_detector import get_language_detector

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize bot and dispatcher
bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
dp = Dispatcher(storage=MemoryStorage())

# Initialize database and validator
db = Database()
validator = ChannelValidator(os.getenv("CHANNEL_USERNAME", "Nightly_Wisdom"))

# States
class UserState(StatesGroup):
    waiting_for_language = State()
    waiting_for_translation_language = State()
    waiting_for_meaning_language = State()
    translating = State()

# Temporary storage for message IDs (in production, use Redis or similar)
temp_message_storage = {}
temp_message_content = {}  # Store message content for translation

def get_language_keyboard():
    """Create language selection keyboard."""
    keyboard = types.ReplyKeyboardMarkup(
        keyboard=[
            [types.KeyboardButton(text=f"{LANGUAGES['uz']['flag']} Uzbek")],
            [types.KeyboardButton(text=f"{LANGUAGES['ru']['flag']} Russian")],
            [types.KeyboardButton(text=f"{LANGUAGES['en']['flag']} English")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    return keyboard

def get_action_keyboard():
    """Create inline keyboard with Translation and Meaning buttons."""
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(text="Translation", callback_data="action_translation"),
                types.InlineKeyboardButton(text="Meaning", callback_data="action_meaning")
            ]
        ]
    )
    return keyboard

def get_translation_language_keyboard(available_languages: list):
    """Create inline keyboard for translation language selection."""
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[]
    )
    
    for lang_code in available_languages:
        lang_name = get_language_name(lang_code)
        button = types.InlineKeyboardButton(
            text=lang_name,
            callback_data=f"trans_lang_{lang_code}"
        )
        keyboard.inline_keyboard.append([button])
    
    return keyboard

def get_invalid_channel_keyboard():
    """Create keyboard with clickable channel link."""
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [types.InlineKeyboardButton(text="our channel", url=f"https://t.me/{validator.channel_username}")]
        ]
    )
    return keyboard

# Command handlers
@dp.message(Command("start"))
async def cmd_start(message: types.Message, state: FSMContext):
    """Handle /start command - show language selection."""
    user_id = message.from_user.id
    existing_language = db.get_user_language(user_id)
    
    if existing_language:
        welcome_text = get_text(existing_language, "welcome")
        await message.answer(welcome_text)
    else:
        select_text = get_text("en", "select_language")  # Default to English for selection
        await message.answer(select_text, reply_markup=get_language_keyboard())
        await state.set_state(UserState.waiting_for_language)

@dp.message(UserState.waiting_for_language)
async def process_language_selection(message: types.Message, state: FSMContext):
    """Process language selection."""
    user_id = message.from_user.id
    text = message.text
    
    # Map button text to language code
    language_map = {
        f"{LANGUAGES['uz']['flag']} Uzbek": "uz",
        f"{LANGUAGES['ru']['flag']} Russian": "ru",
        f"{LANGUAGES['en']['flag']} English": "en"
    }
    
    language_code = language_map.get(text)
    
    if language_code:
        db.save_user_language(user_id, language_code)
        welcome_text = get_text(language_code, "welcome")
        await message.answer(welcome_text, reply_markup=types.ReplyKeyboardRemove())
        await state.clear()
    else:
        await message.answer("Please select a valid language option.")

@dp.message(Command("language"))
async def cmd_language(message: types.Message, state: FSMContext):
    """Handle /language command - allow changing language."""
    user_id = message.from_user.id
    current_language = db.get_user_language(user_id) or "en"
    
    select_text = get_text(current_language, "select_language")
    await message.answer(select_text, reply_markup=get_language_keyboard())
    await state.set_state(UserState.waiting_for_language)

@dp.message(Command("help"))
async def cmd_help(message: types.Message):
    """Handle /help command - show usage instructions."""
    user_id = message.from_user.id
    language = db.get_user_language(user_id) or "en"
    
    help_text = get_text(language, "help_text")
    await message.answer(help_text)

@dp.message(Command("meaning"))
async def cmd_meaning(message: types.Message):
    """Handle /meaning command - admin only (skeleton for now)."""
    user_id = message.from_user.id
    
    # Check if user is admin
    if not db.is_admin(user_id):
        await message.answer("This command is only available to administrators.")
        return
    
    # Skeleton implementation - will be expanded in future stages
    await message.answer("Meaning management feature will be implemented in future stages.")

# URL and forwarded message handlers
@dp.message()
async def process_message(message: types.Message, state: FSMContext):
    """Process incoming messages - URLs or forwarded posts."""
    user_id = message.from_user.id
    language = db.get_user_language(user_id)
    
    if not language:
        await message.answer("Please select a language first using /start")
        return
    
    message_content = None
    message_id = None
    
    # Check if it's a URL
    if message.text and message.text.startswith("https://t.me/"):
        is_valid, extracted_message_id = validator.validate_and_extract(message.text)
        
        if is_valid and extracted_message_id:
            message_id = extracted_message_id
            # For URLs, we need to fetch the message content from Telegram
            try:
                # Try to fetch the message from the channel
                channel_message = await bot.get_message(
                    chat_id=validator.channel_username,
                    message_id=message_id
                )
                
                # Get message content
                if channel_message.text:
                    message_content = channel_message.text
                elif channel_message.caption:
                    message_content = channel_message.caption
                else:
                    await message.answer("This message type is not supported. Please send text messages or messages with text captions.")
                    return
                
                # Store message ID and content temporarily
                temp_message_storage[user_id] = message_id
                temp_message_content[user_id] = message_content
                await message.answer("Please select an action:", reply_markup=get_action_keyboard())
                
            except Exception as e:
                logger.error(f"Error fetching channel message: {e}")
                await message.answer(
                    "Couldn't fetch the message from the channel. Please forward the message instead."
                )
                return
        else:
            invalid_text = get_text(language, "invalid_channel")
            await message.answer(invalid_text, reply_markup=get_invalid_channel_keyboard())
    
    # Check if it's a forwarded message
    elif message.forward_from_chat:
        is_valid, extracted_message_id = validator.validate_forwarded_message(message)
        
        if is_valid and extracted_message_id:
            message_id = extracted_message_id
            # Get the actual message content
            if message.text:
                message_content = message.text
            elif message.caption:
                message_content = message.caption
            else:
                await message.answer("This message type is not supported. Please send text messages or messages with text captions.")
                return
            
            # Store message ID and content temporarily
            temp_message_storage[user_id] = message_id
            temp_message_content[user_id] = message_content
            await message.answer("Please select an action:", reply_markup=get_action_keyboard())
        else:
            invalid_text = get_text(language, "invalid_channel")
            await message.answer(invalid_text, reply_markup=get_invalid_channel_keyboard())
    
    else:
        # Unknown message type
        await message.answer("Please send a valid channel URL or forward a message from the channel.")

# Callback query handlers
@dp.callback_query(lambda c: c.data.startswith("action_"))
async def process_action_callback(callback: types.CallbackQuery, state: FSMContext):
    """Process action button clicks (Translation/Meaning)."""
    user_id = callback.from_user.id
    language = db.get_user_language(user_id) or "en"
    action = callback.data.split("_")[1]
    
    # Get stored message ID and content
    message_id = temp_message_storage.get(user_id)
    message_content = temp_message_content.get(user_id)
    
    if not message_id or not message_content:
        await callback.answer("Error: Message content not found. Please try again.")
        return
    
    if action == "translation":
        # Detect language of the quote
        detector = get_language_detector()
        detected_language = detector.detect(message_content)
        
        # Get available translation options (exclude source language)
        available_languages = detector.get_translation_options(detected_language)
        
        # Show translation language selection
        select_text = get_text(language, "select_translation_language")
        await callback.message.answer(
            select_text,
            reply_markup=get_translation_language_keyboard(available_languages)
        )
        
        # Store the detected language for later use
        await state.update_data(detected_language=detected_language)
        
    elif action == "meaning":
        # Stage 2: Just acknowledge the action (Stage 3 will implement this)
        await callback.message.answer(f"Meaning feature will be implemented in Stage 3. (Message ID: {message_id})")
    
    await callback.answer()

@dp.callback_query(lambda c: c.data.startswith("trans_lang_"))
async def process_translation_language_callback(callback: types.CallbackQuery, state: FSMContext):
    """Process translation language selection."""
    user_id = callback.from_user.id
    interface_language = db.get_user_language(user_id) or "en"
    target_language = callback.data.split("_")[2]
    
    # Get stored data
    message_content = temp_message_content.get(user_id)
    state_data = await state.get_data()
    detected_language = state_data.get("detected_language", "en")
    
    if not message_content:
        await callback.answer("Error: Message content not found. Please try again.")
        return
    
    # Show processing message
    processing_message = await callback.message.answer("Translating... ⏳")
    
    try:
        # Get Gemini service and translate
        gemini_service = get_gemini_service()
        translated_text = await gemini_service.translate_text(message_content, target_language)
        
        if translated_text:
            # Delete processing message
            await processing_message.delete()
            
            # Send translation
            await callback.message.answer(f"Translation:\n\n{translated_text}")
            
            # Note: Interface language remains unchanged as per requirements
            logger.info(f"Translation successful for user {user_id}: {detected_language} -> {target_language}")
        else:
            await processing_message.delete()
            await callback.message.answer("Translation failed. Please try again.")
            
    except Exception as e:
        logger.error(f"Translation error: {e}")
        await processing_message.delete()
        await callback.message.answer("An error occurred during translation. Please try again.")
    
    await callback.answer()

async def main():
    """Start the bot."""
    logger.info("Starting bot...")
    
    # Delete any existing webhook to avoid conflicts
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("Webhook deleted")
    
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
