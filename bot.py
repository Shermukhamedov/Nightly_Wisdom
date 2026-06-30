import os
import logging
from typing import Optional
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import ChatMemberUpdated, InlineQuery, InlineQueryResultArticle, InputTextMessageContent
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

# Admin user ID from environment
ADMIN_USER_ID = int(os.getenv("ADMIN_USER_ID", "0"))

# States
class UserState(StatesGroup):
    waiting_for_language = State()
    waiting_for_translation_language = State()
    waiting_for_meaning_language = State()
    translating = State()
    waiting_for_contribution = State()
    waiting_for_broadcast = State()

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

def get_meaning_language_keyboard():
    """Create inline keyboard for meaning language selection (all 3 languages)."""
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [types.InlineKeyboardButton(text=get_language_name("uz"), callback_data="meaning_lang_uz")],
            [types.InlineKeyboardButton(text=get_language_name("ru"), callback_data="meaning_lang_ru")],
            [types.InlineKeyboardButton(text=get_language_name("en"), callback_data="meaning_lang_en")]
        ]
    )
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
    await message.answer(help_text, parse_mode="HTML")

@dp.message(Command("support"))
@dp.message(Command("report"))
async def cmd_report(message: types.Message):
    """Handle /report command - show support information."""
    user_id = message.from_user.id
    language = db.get_user_language(user_id) or "en"
    
    support_text = get_text(language, "support_text")
    await message.answer(support_text)

@dp.message(Command("contribution"))
async def cmd_contribution(message: types.Message, state: FSMContext):
    """Handle /contribution command - start contribution process."""
    user_id = message.from_user.id
    language = db.get_user_language(user_id) or "en"
    
    contribution_text = get_text(language, "contribution_text")
    await message.answer(contribution_text)
    await state.set_state(UserState.waiting_for_contribution)

@dp.message(UserState.waiting_for_contribution)
async def process_contribution(message: types.Message, state: FSMContext):
    """Process contribution submissions."""
    user_id = message.from_user.id
    language = db.get_user_language(user_id) or "en"
    
    # Filter out unwanted content types
    if message.voice:
        await message.answer("Voice messages are not accepted. Please send text, photo, or video.")
        return
    
    if message.sticker:
        await message.answer("Stickers are not accepted. Please send text, photo, or video.")
        return
    
    if message.animation:  # GIFs
        await message.answer("GIFs are not accepted. Please send text, photo, or video.")
        return
    
    # Check if ADMIN_USER_ID is set
    if ADMIN_USER_ID == 0:
        await message.answer("Admin ID not configured. Please contact the bot administrator.")
        await state.clear()
        return
    
    # Forward contribution to admin
    try:
        # Determine content type and content
        content_type = None
        content = ""
        
        if message.text:
            content_type = "text"
            content = message.text
        elif message.photo:
            content_type = "photo"
            content = f"[Photo: {message.caption or 'No caption'}]"
        elif message.video:
            content_type = "video"
            content = f"[Video: {message.caption or 'No caption'}]"
        else:
            await message.answer("This content type is not supported. Please send text, photo, or video.")
            await state.clear()
            return
        
        # Save to database
        db.save_contribution(user_id, content_type, content)
        
        # Prepare contribution info
        contribution_info = f"📨 New Contribution\n\nUser: @{message.from_user.username or 'No username'}\nTelegram ID: {user_id}\n"
        
        # Determine content type for display
        if message.text:
            contribution_info += f"Type: Text\n\nContent:\n{message.text}"
            await bot.send_message(ADMIN_USER_ID, contribution_info)
        elif message.photo:
            contribution_info += "Type: Photo"
            await bot.send_message(ADMIN_USER_ID, contribution_info)
            await message.forward(ADMIN_USER_ID)
        elif message.video:
            contribution_info += "Type: Video"
            await bot.send_message(ADMIN_USER_ID, contribution_info)
            await message.forward(ADMIN_USER_ID)
        
        # Send confirmation to user
        await message.answer("Thank you for your contribution! We will review it and get back to you if it's approved.")
        await state.clear()
        
        logger.info(f"Contribution from user {user_id} forwarded to admin {ADMIN_USER_ID}")
        
    except Exception as e:
        logger.error(f"Error forwarding contribution: {e}")
        await message.answer("An error occurred while processing your contribution. Please try again later.")
        await state.clear()

@dp.message(Command("message"))
async def cmd_message(message: types.Message, state: FSMContext):
    """Handle /message command - admin only to broadcast messages to all users."""
    user_id = message.from_user.id
    
    # Check if user is admin (by username)
    if message.from_user.username != "akkkkbar":
        await message.answer("This command is only available to administrators.")
        return
    
    await message.answer("Please send the message you want to broadcast to all users.")
    await state.set_state(UserState.waiting_for_broadcast)

@dp.message(UserState.waiting_for_broadcast)
async def process_broadcast(message: types.Message, state: FSMContext):
    """Process broadcast message from admin."""
    user_id = message.from_user.id
    
    # Verify admin again
    if message.from_user.username != "akkkkbar":
        await message.answer("This command is only available to administrators.")
        await state.clear()
        return
    
    try:
        # Get all users from database
        all_users = db.get_all_users()
        
        if not all_users:
            await message.answer("No users found in database.")
            await state.clear()
            return
        
        success_count = 0
        fail_count = 0
        
        # Broadcast message to all users
        for user_id in all_users:
            try:
                if message.text:
                    await bot.send_message(user_id, message.text)
                elif message.photo:
                    await bot.send_photo(user_id, message.photo[0].file_id, caption=message.caption)
                elif message.video:
                    await bot.send_video(user_id, message.video.file_id, caption=message.caption)
                elif message.document:
                    await bot.send_document(user_id, message.document.file_id, caption=message.caption)
                else:
                    await bot.forward_message(user_id, message.chat.id, message.message_id)
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to send broadcast to user {user_id}: {e}")
                fail_count += 1
        
        await message.answer(f"Broadcast completed!\n✅ Success: {success_count}\n❌ Failed: {fail_count}")
        await state.clear()
        
    except Exception as e:
        logger.error(f"Error broadcasting message: {e}")
        await message.answer("An error occurred while broadcasting the message. Please try again.")
        await state.clear()

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

# Channel post handler for automatic indexing (Stage 8)
@dp.channel_post()
async def handle_channel_post(message: types.Message):
    """Automatically index new channel posts."""
    # Only process posts from the Nightly Wisdom channel
    if message.chat.username != validator.channel_username:
        return
    
    message_id = message.message_id
    content = None
    media_type = "text"
    
    # Extract content based on message type
    if message.text:
        content = message.text
    elif message.caption:
        content = message.caption
        if message.photo:
            media_type = "photo"
        elif message.video:
            media_type = "video"
        elif message.audio:
            media_type = "audio"
        elif message.document:
            media_type = "document"
    else:
        # No text content, just media
        media_type = "unknown"
        content = ""
    
    # Detect language if there's text content
    language = None
    if content:
        try:
            detector = get_language_detector()
            language = detector.detect(content)
        except Exception as e:
            logger.error(f"Error detecting language for message {message_id}: {e}")
            language = "unknown"
    
    # Save to database
    if content or media_type != "text":
        success = db.save_quote(message_id, content or "", language or "unknown", media_type)
        if success:
            logger.info(f"Indexed channel post {message_id}: {media_type}, language: {language}")
        else:
            logger.error(f"Failed to index channel post {message_id}")

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
        # Show language selection for meaning
        select_text = get_text(language, "select_meaning_language")
        await callback.message.answer(
            select_text,
            reply_markup=get_meaning_language_keyboard()
        )
    
    await callback.answer()

@dp.callback_query(lambda c: c.data.startswith("meaning_lang_"))
async def process_meaning_language_callback(callback: types.CallbackQuery, state: FSMContext):
    """Process meaning language selection."""
    user_id = callback.from_user.id
    interface_language = db.get_user_language(user_id) or "en"
    target_language = callback.data.split("_")[2]
    
    # Get stored message ID and content
    message_id = temp_message_storage.get(user_id)
    message_content = temp_message_content.get(user_id)
    
    if not message_id or not message_content:
        await callback.answer("Error: Message content not found. Please try again.")
        return
    
    # Show processing message
    processing_message = await callback.message.answer("Generating meaning... ⏳")
    
    try:
        # First check if custom meaning exists in database
        custom_meaning = db.get_meaning(message_id, target_language)
        
        if custom_meaning:
            # Delete processing message
            await processing_message.delete()
            
            # Send custom meaning with localized label
            meaning_label = get_text(interface_language, "meaning")
            await callback.message.answer(f"{meaning_label}:\n\n{custom_meaning}")
            logger.info(f"Retrieved custom meaning for message {message_id} in {target_language}")
        else:
            # Generate meaning using Gemini
            gemini_service = get_gemini_service()
            generated_meaning = await gemini_service.generate_meaning(message_content, target_language)
            
            if generated_meaning:
                # Delete processing message
                await processing_message.delete()
                
                # Send generated meaning
                await callback.message.answer(generated_meaning)
                logger.info(f"Generated meaning for message {message_id} in {target_language}")
            else:
                await processing_message.delete()
                await callback.message.answer("Failed to generate meaning. Please try again.")
            
    except Exception as e:
        logger.error(f"Meaning generation error: {e}")
        await processing_message.delete()
        await callback.message.answer("An error occurred while generating meaning. Please try again.")
    
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
            
            # Send translation with localized label
            translation_label = get_text(interface_language, "translation")
            await callback.message.answer(f"{translation_label}:\n\n{translated_text}")
            
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

# Inline query handler for Stage 4 (Inline Quote Search)
@dp.inline_query()
async def handle_inline_query(inline_query: InlineQuery):
    """Handle inline search queries from users."""
    query = inline_query.query.strip()
    user_id = inline_query.from_user.id
    
    if not query:
        # Return empty results if query is empty
        await inline_query.answer([])
        return
    
    # Search quotes in database
    results = db.search_quotes(query, limit=5)
    
    inline_results = []
    for message_id, content, language in results:
        # Truncate content for display
        display_content = content[:100] + "..." if len(content) > 100 else content
        
        # Format content with blockquote
        formatted_content = f"<blockquote>{content}</blockquote>"
        
        # Create inline result with the quote content and action buttons
        result = InlineQueryResultArticle(
            id=str(message_id),
            title=display_content,
            description=f"Language: {language.upper()}",
            input_message_content=InputTextMessageContent(
                message_text=formatted_content,
                parse_mode="HTML"
            ),
            reply_markup=get_action_keyboard()
        )
        inline_results.append(result)
        
        # Store message ID and content for the user (for button handling)
        temp_message_storage[user_id] = message_id
        temp_message_content[user_id] = content
    
    await inline_query.answer(inline_results, cache_time=300)

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
