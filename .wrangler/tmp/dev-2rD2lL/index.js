var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-vJg7IJ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-vJg7IJ/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/database.ts
var Database = class {
  constructor(db) {
    this.db = db;
  }
  async saveUserLanguage(userId, language) {
    try {
      await this.db.prepare('INSERT OR REPLACE INTO users (user_id, language, created_at) VALUES (?, ?, datetime("now"))').bind(userId, language).run();
      return true;
    } catch (error) {
      console.error("Error saving user language:", error);
      return false;
    }
  }
  async getUserLanguage(userId) {
    try {
      const result = await this.db.prepare("SELECT language FROM users WHERE user_id = ?").bind(userId).first();
      return result?.language || null;
    } catch (error) {
      console.error("Error getting user language:", error);
      return null;
    }
  }
  async getAllUsers() {
    try {
      const results = await this.db.prepare("SELECT user_id FROM users").all();
      return results.results?.map((r) => r.user_id) || [];
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }
  async saveMeaning(messageId, language, meaning) {
    try {
      await this.db.prepare('INSERT OR REPLACE INTO meanings (message_id, language, meaning, created_at) VALUES (?, ?, ?, datetime("now"))').bind(messageId, language, meaning).run();
      return true;
    } catch (error) {
      console.error("Error saving meaning:", error);
      return false;
    }
  }
  async getMeaning(messageId, language) {
    try {
      const result = await this.db.prepare("SELECT meaning FROM meanings WHERE message_id = ? AND language = ?").bind(messageId, language).first();
      return result?.meaning || null;
    } catch (error) {
      console.error("Error getting meaning:", error);
      return null;
    }
  }
  async addAdmin(userId) {
    try {
      await this.db.prepare("INSERT OR IGNORE INTO admins (user_id) VALUES (?)").bind(userId).run();
      return true;
    } catch (error) {
      console.error("Error adding admin:", error);
      return false;
    }
  }
  async isAdmin(userId) {
    try {
      const result = await this.db.prepare("SELECT user_id FROM admins WHERE user_id = ?").bind(userId).first();
      return !!result;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }
  async saveQuote(messageId, content, language, mediaType) {
    try {
      await this.db.prepare('INSERT OR REPLACE INTO quotes (message_id, content, language, media_type, created_at) VALUES (?, ?, ?, ?, datetime("now"))').bind(messageId, content, language, mediaType).run();
      return true;
    } catch (error) {
      console.error("Error saving quote:", error);
      return false;
    }
  }
  async searchQuotes(query, limit = 10) {
    try {
      const results = await this.db.prepare("SELECT message_id, content, language FROM quotes WHERE content LIKE ? COLLATE NOCASE ORDER BY created_at DESC LIMIT ?").bind(`%${query}%`, limit).all();
      console.log("Search query:", query, "Results:", results.results?.length || 0);
      return results.results || [];
    } catch (error) {
      console.error("Error searching quotes:", error);
      return [];
    }
  }
  async getQuoteByMessageId(messageId) {
    try {
      const result = await this.db.prepare("SELECT message_id, content, language, media_type FROM quotes WHERE message_id = ?").bind(messageId).first();
      return result || null;
    } catch (error) {
      console.error("Error getting quote by message ID:", error);
      return null;
    }
  }
  async saveContribution(userId, contentType, content) {
    try {
      await this.db.prepare('INSERT INTO contributions (user_id, content_type, content, status) VALUES (?, ?, ?, "pending")').bind(userId, contentType, content).run();
      return true;
    } catch (error) {
      console.error("Error saving contribution:", error);
      return false;
    }
  }
  async updateContributionStatus(contributionId, status) {
    try {
      await this.db.prepare("UPDATE contributions SET status = ? WHERE id = ?").bind(status, contributionId).run();
      return true;
    } catch (error) {
      console.error("Error updating contribution status:", error);
      return false;
    }
  }
  async getContributionStats() {
    try {
      const total = await this.db.prepare("SELECT COUNT(*) as count FROM contributions").first();
      const approved = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "approved"').first();
      const rejected = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "rejected"').first();
      const alreadyExists = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "already_exists"').first();
      const pending = await this.db.prepare('SELECT COUNT(*) as count FROM contributions WHERE status = "pending"').first();
      return {
        total: total?.count || 0,
        approved: approved?.count || 0,
        rejected: rejected?.count || 0,
        already_exists: alreadyExists?.count || 0,
        pending: pending?.count || 0
      };
    } catch (error) {
      console.error("Error getting contribution stats:", error);
      return { total: 0, approved: 0, rejected: 0, already_exists: 0, pending: 0 };
    }
  }
};
__name(Database, "Database");

// src/kv-storage.ts
var KVStorage = class {
  constructor(kv) {
    this.kv = kv;
  }
  async set(key, value, ttl) {
    const options = {};
    if (ttl) {
      options.expirationTtl = ttl;
    }
    await this.kv.put(key, value, options);
  }
  async get(key) {
    return await this.kv.get(key);
  }
  async delete(key) {
    await this.kv.delete(key);
  }
  async setMessageStorage(userId, messageId) {
    await this.set(`msg:${userId}`, messageId.toString(), 3600);
  }
  async getMessageStorage(userId) {
    const value = await this.get(`msg:${userId}`);
    return value ? parseInt(value, 10) : null;
  }
  async setContentStorage(userId, content) {
    await this.set(`content:${userId}`, content, 3600);
  }
  async getContentStorage(userId) {
    return await this.get(`content:${userId}`);
  }
  async setDetectedLanguage(userId, language) {
    await this.set(`detected_lang:${userId}`, language, 3600);
  }
  async getDetectedLanguage(userId) {
    return await this.get(`detected_lang:${userId}`);
  }
  async clearUserStorage(userId) {
    await this.delete(`msg:${userId}`);
    await this.delete(`content:${userId}`);
    await this.delete(`detected_lang:${userId}`);
  }
  async setUserState(userId, state) {
    await this.set(`state:${userId}`, state, 3600);
  }
  async getUserState(userId) {
    return await this.get(`state:${userId}`);
  }
  async clearUserState(userId) {
    await this.delete(`state:${userId}`);
  }
};
__name(KVStorage, "KVStorage");

// src/telegram-api.ts
var TelegramAPI = class {
  constructor(token, env) {
    this.token = token;
    this.env = env;
  }
  async apiCall(method, body) {
    const response = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : void 0
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    return data.result;
  }
  async sendMessage(chatId, text, options) {
    return await this.apiCall("sendMessage", {
      chat_id: chatId,
      text,
      ...options
    });
  }
  async editMessageText(chatId, messageId, text, options) {
    return await this.apiCall("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    });
  }
  async answerCallbackQuery(callbackQueryId, text) {
    await this.apiCall("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text
    });
  }
  async answerInlineQuery(inlineQueryId, results, cacheTime) {
    await this.apiCall("answerInlineQuery", {
      inline_query_id: inlineQueryId,
      results,
      cache_time: cacheTime || 300
    });
  }
  async deleteMessage(chatId, messageId) {
    await this.apiCall("deleteMessage", {
      chat_id: chatId,
      message_id: messageId
    });
  }
  async forwardMessage(chatId, fromChatId, messageId) {
    return await this.apiCall("forwardMessage", {
      chat_id: chatId,
      from_chat_id: fromChatId,
      message_id: messageId
    });
  }
  async sendPhoto(chatId, fileId, caption) {
    return await this.apiCall("sendPhoto", {
      chat_id: chatId,
      photo: fileId,
      caption
    });
  }
  async sendVideo(chatId, fileId, caption) {
    return await this.apiCall("sendVideo", {
      chat_id: chatId,
      video: fileId,
      caption
    });
  }
  async sendDocument(chatId, fileId, caption) {
    return await this.apiCall("sendDocument", {
      chat_id: chatId,
      document: fileId,
      caption
    });
  }
  async getMessage(chatId, messageId) {
    return await this.apiCall("getMessage", {
      chat_id: chatId,
      message_id: messageId
    });
  }
  async setWebhook(url) {
    await this.apiCall("setWebhook", { url });
  }
  async deleteWebhook() {
    await this.apiCall("deleteWebhook");
  }
  async getWebhookInfo() {
    return await this.apiCall("getWebhookInfo");
  }
};
__name(TelegramAPI, "TelegramAPI");

// src/channel-validator.ts
var ChannelValidator = class {
  constructor(channelUsername) {
    this.channelUsername = channelUsername;
    this.channelUsername = channelUsername;
  }
  isValidChannelUrl(url) {
    const pattern = new RegExp(`https://t\\.me/${this.channelUsername}/\\d+`);
    return pattern.test(url);
  }
  extractMessageId(url) {
    const pattern = new RegExp(`https://t\\.me/${this.channelUsername}/(\\d+)`);
    const match = url.match(pattern);
    if (match) {
      const messageId = parseInt(match[1], 10);
      return isNaN(messageId) ? null : messageId;
    }
    return null;
  }
  isForwardedFromChannel(message) {
    if (message.forward_from_chat && message.forward_from_chat.username) {
      return message.forward_from_chat.username === this.channelUsername;
    }
    return false;
  }
  getForwardedMessageId(message) {
    if (message.forward_from_message_id) {
      return message.forward_from_message_id;
    }
    return null;
  }
  validateAndExtract(url) {
    if (!this.isValidChannelUrl(url)) {
      return { isValid: false, messageId: null };
    }
    const messageId = this.extractMessageId(url);
    if (messageId === null) {
      return { isValid: false, messageId: null };
    }
    return { isValid: true, messageId };
  }
  validateForwardedMessage(message) {
    if (!this.isForwardedFromChannel(message)) {
      return { isValid: false, messageId: null };
    }
    const messageId = this.getForwardedMessageId(message);
    if (messageId === null) {
      return { isValid: false, messageId: null };
    }
    return { isValid: true, messageId };
  }
};
__name(ChannelValidator, "ChannelValidator");

// src/language-detector.ts
var LanguageDetector = class {
  uzbekWords = /* @__PURE__ */ new Set([
    "bilaman",
    "bilmayman",
    "qilaman",
    "qilmayman",
    "keladi",
    "kelmaydi",
    "bor",
    "yoq",
    "ha",
    "yoq",
    "shunday",
    "bunday",
    "qanday",
    "nimaga",
    "nega",
    "men",
    "sen",
    "u",
    "biz",
    "siz",
    "ular",
    "bu",
    "shu",
    "u",
    "mening",
    "sening",
    "uning",
    "bizning",
    "sizning",
    "ularning",
    "muvaffaqiyat",
    "muvaffaqiyatsizlik",
    "yakuniy",
    "halokatli",
    "dasturlash",
    "organmoqchiman",
    "boshlash",
    "yaxshi",
    "qil",
    "qiling",
    "bormi",
    "yoqmi",
    "qachon",
    "qayer",
    "qaysi",
    "nimada",
    "nima",
    "kim",
    "qandaydir",
    "shuqa",
    "ham",
    "yoki",
    "lekin",
    "chunki",
    "agar",
    "hatto",
    "juda",
    "juda",
    "kop",
    "oz",
    "katta",
    "kichik",
    "yangi",
    "eski",
    "yaxshi",
    "yomon",
    "chiroyli",
    "bevaqt",
    "yo'q",
    "o'rganmoqchiman",
    "ko'p",
    "yo'qmi"
  ]);
  russianWords = /* @__PURE__ */ new Set([
    "\u044F",
    "\u0442\u044B",
    "\u043E\u043D",
    "\u043E\u043D\u0430",
    "\u043E\u043D\u043E",
    "\u043C\u044B",
    "\u0432\u044B",
    "\u043E\u043D\u0438",
    "\u044D\u0442\u043E",
    "\u0442\u043E\u0442",
    "\u044D\u0442\u043E\u0442",
    "\u0442\u0430",
    "\u0442\u043E",
    "\u044D\u0442\u0438",
    "\u0442\u0435",
    "\u0434\u0430",
    "\u043D\u0435\u0442",
    "\u043C\u043E\u0436\u0435\u0442",
    "\u043C\u043E\u0436\u043D\u043E",
    "\u043D\u0443\u0436\u043D\u043E",
    "\u0445\u043E\u0440\u043E\u0448\u043E",
    "\u043F\u043B\u043E\u0445\u043E",
    "\u0431\u043E\u043B\u044C\u0448\u043E\u0439",
    "\u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0439",
    "\u0445\u043E\u0442\u0435\u0442\u044C",
    "\u043C\u043E\u0447\u044C",
    "\u0434\u043E\u043B\u0436\u0435\u043D",
    "\u043D\u0430\u0434\u043E"
  ]);
  englishWords = /* @__PURE__ */ new Set([
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "this",
    "that",
    "these",
    "those",
    "yes",
    "no",
    "maybe",
    "can",
    "could",
    "will",
    "would",
    "should",
    "must",
    "want",
    "need",
    "have",
    "had",
    "has"
  ]);
  detect(text) {
    if (!text || !text.trim()) {
      return null;
    }
    const textLower = text.toLowerCase();
    const cyrillicPattern = /[а-яё]/;
    const latinPattern = /[a-z]/;
    const uzbekSpecific = /[ʻ\'ʼ]/;
    const hasCyrillic = cyrillicPattern.test(textLower);
    const hasLatin = latinPattern.test(textLower);
    const hasUzbekChars = uzbekSpecific.test(textLower);
    const uzbekLatinPatterns = ["sh", "ch", "ng", "'", "\u02BB"];
    const hasUzbekLatinPatterns = uzbekLatinPatterns.some((pattern) => textLower.includes(pattern));
    let uzScore = 0;
    let ruScore = 0;
    let enScore = 0;
    const words = textLower.match(/\b\w+\b/g) || [];
    for (const word of words) {
      if (this.uzbekWords.has(word))
        uzScore++;
      if (this.russianWords.has(word))
        ruScore++;
      if (this.englishWords.has(word))
        enScore++;
    }
    if (hasUzbekChars && hasCyrillic) {
      return "uz";
    }
    if (hasCyrillic && !hasLatin) {
      if (uzScore > ruScore)
        return "uz";
      if (ruScore > uzScore)
        return "ru";
      return "ru";
    }
    if (hasLatin && !hasCyrillic) {
      if (uzScore > enScore)
        return "uz";
      if (hasUzbekLatinPatterns && uzScore > 0)
        return "uz";
      if (enScore > 0)
        return "en";
      if (hasUzbekLatinPatterns)
        return "uz";
      return "en";
    }
    if (hasCyrillic && hasLatin) {
      const scores = { uz: uzScore, ru: ruScore, en: enScore };
      const maxScore = Math.max(uzScore, ruScore, enScore);
      if (maxScore === 0) {
        if (hasUzbekChars)
          return "uz";
        if (hasCyrillic)
          return "ru";
        return "en";
      }
      for (const [lang, score] of Object.entries(scores)) {
        if (score === maxScore)
          return lang;
      }
    }
    return "en";
  }
  getTranslationOptions(sourceLanguage) {
    const allLanguages = ["uz", "ru", "en"];
    return allLanguages.filter((lang) => lang !== sourceLanguage);
  }
};
__name(LanguageDetector, "LanguageDetector");
var languageDetectorInstance = null;
function getLanguageDetector() {
  if (!languageDetectorInstance) {
    languageDetectorInstance = new LanguageDetector();
  }
  return languageDetectorInstance;
}
__name(getLanguageDetector, "getLanguageDetector");

// src/ai-service.ts
var GroqProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiKey = apiKey;
  }
  name = "Groq";
  async translateText(text, targetLanguage) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}.

Requirements:
- Provide accurate translation
- Preserve the original meaning
- Maintain the quote style and tone
- Return ONLY the translation, no explanations
- For Uzbek: Use proper Uzbek Latin script with apostrophes (o', sh, ch, ng, g', etc.)

Text to translate:
${text}`;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      return null;
    } catch (error) {
      console.error("Groq translation error:", error);
      throw error;
    }
  }
  async generateMeaning(quote, language) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const langName = languageNames[language];
    const prompt = `Explain the meaning of the following quote in ${langName}.

Requirements:
- Explain the quote simply and clearly
- Keep the explanation concise (2-3 sentences)
- Focus on practical life lessons
- Use ${langName} language
- Avoid long essays or academic language

Quote:
${quote}

Provide the explanation in this format:
Meaning:
"Your explanation here"`;
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      return null;
    } catch (error) {
      console.error("Groq meaning generation error:", error);
      throw error;
    }
  }
  isRateLimitError(error) {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes("rate limit") || errorStr.includes("429") || errorStr.includes("quota");
  }
};
__name(GroqProvider, "GroqProvider");
var CohereProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiKey = apiKey;
  }
  name = "Cohere";
  async translateText(text, targetLanguage) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;
    try {
      const response = await fetch("https://api.cohere.ai/v1/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "X-Client-Name": "NightlyWisdomBot"
        },
        body: JSON.stringify({
          model: "command",
          prompt,
          max_tokens: 500,
          temperature: 0.3
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.generations && data.generations[0] && data.generations[0].text) {
        return data.generations[0].text.trim();
      }
      return null;
    } catch (error) {
      console.error("Cohere translation error:", error);
      throw error;
    }
  }
  async generateMeaning(quote, language) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;
    try {
      const response = await fetch("https://api.cohere.ai/v1/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "X-Client-Name": "NightlyWisdomBot"
        },
        body: JSON.stringify({
          model: "command",
          prompt,
          max_tokens: 300,
          temperature: 0.7
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.generations && data.generations[0] && data.generations[0].text) {
        return data.generations[0].text.trim();
      }
      return null;
    } catch (error) {
      console.error("Cohere meaning generation error:", error);
      throw error;
    }
  }
  isRateLimitError(error) {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes("rate limit") || errorStr.includes("429") || errorStr.includes("quota");
  }
};
__name(CohereProvider, "CohereProvider");
var OpenAIProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiKey = apiKey;
  }
  name = "OpenAI";
  async translateText(text, targetLanguage) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      return null;
    } catch (error) {
      console.error("OpenAI translation error:", error);
      throw error;
    }
  }
  async generateMeaning(quote, language) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      }
      return null;
    } catch (error) {
      console.error("OpenAI meaning generation error:", error);
      throw error;
    }
  }
  isRateLimitError(error) {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes("rate limit") || errorStr.includes("429") || errorStr.includes("quota");
  }
};
__name(OpenAIProvider, "OpenAIProvider");
var AnthropicProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiKey = apiKey;
  }
  name = "Anthropic";
  async translateText(text, targetLanguage) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const targetLangName = languageNames[targetLanguage];
    const prompt = `Translate the following text to ${targetLangName}. Return only the translation: ${text}`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text.trim();
      }
      return null;
    } catch (error) {
      console.error("Anthropic translation error:", error);
      throw error;
    }
  }
  async generateMeaning(quote, language) {
    const languageNames = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const langName = languageNames[language];
    const prompt = `Explain the meaning of this quote in ${langName} in 2-3 sentences: ${quote}`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${await response.text()}`);
      }
      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }
      const data = await response.json();
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text.trim();
      }
      return null;
    } catch (error) {
      console.error("Anthropic meaning generation error:", error);
      throw error;
    }
  }
  isRateLimitError(error) {
    const errorStr = String(error).toLowerCase();
    return errorStr.includes("rate limit") || errorStr.includes("429") || errorStr.includes("quota");
  }
};
__name(AnthropicProvider, "AnthropicProvider");
var MultiProviderAIService = class {
  providers = [];
  providerIndex = 0;
  constructor(env) {
    this.initializeProviders(env);
  }
  initializeProviders(env) {
    if (env.GROQ_API_KEY) {
      this.providers.push(new GroqProvider(env.GROQ_API_KEY));
      console.log("Groq provider initialized");
    }
    if (env.COHERE_API_KEY) {
      this.providers.push(new CohereProvider(env.COHERE_API_KEY));
      console.log("Cohere provider initialized");
    }
    if (env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(env.OPENAI_API_KEY));
      console.log("OpenAI provider initialized");
    }
    if (env.ANTHROPIC_API_KEY) {
      this.providers.push(new AnthropicProvider(env.ANTHROPIC_API_KEY));
      console.log("Anthropic provider initialized");
    }
    if (this.providers.length === 0) {
      throw new Error("No AI providers configured. Please set at least one API key.");
    }
    console.log(`Initialized ${this.providers.length} AI providers`);
  }
  getNextProvider() {
    const provider = this.providers[this.providerIndex];
    this.providerIndex = (this.providerIndex + 1) % this.providers.length;
    return provider;
  }
  async translateText(text, targetLanguage) {
    let lastError = null;
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.getNextProvider();
      try {
        console.log(`Attempting translation with ${provider.name}`);
        const result = await provider.translateText(text, targetLanguage);
        if (result) {
          console.log(`Translation successful with ${provider.name}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        if (provider.isRateLimitError(error)) {
          console.warn(`${provider.name} rate limited, trying next provider`);
        } else {
          console.error(`${provider.name} failed:`, error);
        }
      }
    }
    console.error(`All providers failed for translation. Last error:`, lastError);
    return null;
  }
  async generateMeaning(quote, language) {
    let lastError = null;
    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const provider = this.getNextProvider();
      try {
        console.log(`Attempting meaning generation with ${provider.name}`);
        const result = await provider.generateMeaning(quote, language);
        if (result) {
          console.log(`Meaning generation successful with ${provider.name}`);
          return result;
        }
      } catch (error) {
        lastError = error;
        if (provider.isRateLimitError(error)) {
          console.warn(`${provider.name} rate limited, trying next provider`);
        } else {
          console.error(`${provider.name} failed:`, error);
        }
      }
    }
    console.error(`All providers failed for meaning generation. Last error:`, lastError);
    return null;
  }
};
__name(MultiProviderAIService, "MultiProviderAIService");
var aiServiceInstance = null;
function getAIService(env) {
  if (!aiServiceInstance) {
    aiServiceInstance = new MultiProviderAIService(env);
  }
  return aiServiceInstance;
}
__name(getAIService, "getAIService");

// src/languages.ts
var LANGUAGES = {
  uz: {
    name: "Uzbek",
    flag: "\u{1F1FA}\u{1F1FF}",
    welcome: "Assalomu alaykum! Nightly Wisdom botiga xush kelibsiz.",
    select_language: "Iltimos, tilni tanlang:",
    language_changed: "Til o'zgartirildi.",
    help_text: `Nightly Wisdom Bot-dan foydalanish qo'llanmasi

1) Kanalimizdagi istalgan iqtibosni ushbu botga yo'llang (forward qiling).
2)  Iqtibos ostidagi "Tarjima" yoki "Ma'no" tugmalaridan birini tanlang.
3) Javobni qaysi tilda olmoqchi bo'lsangiz, o'sha tilni bosing.

Mavjud buyruqlar:
1) /boshlash \u2014 Botni qayta ishga tushirish va sozlash.
2) /til \u2014 Bot interfeysi va javob berish tilini o'zgartirish.
3) /yordam \u2014 Ushbu foydalanish qo'llanmasini ko'rsatish.
4) /shikoyat \u2014 Texnik xatoliklar yoki muammolar haqida xabar berish.
5) /ulashish \u2014 Kanalimizda chiqishini xohlagan iqtiboslaringizni bizga yuborish.

Sarlavhasiz qidiruv (Inline Search):
Istalgan chatda bizning iqtiboslar bazamizdan qidirishingiz mumkin! Shunchaki @Nightly_Wisdom_Bot deb yozing va yonidan kalit so'zni kiriting`,
    invalid_channel: "Iltimos, faqat bizning kanaldan xabar yuboring.",
    select_translation_language: "Tarjima tilini tanlang:",
    select_meaning_language: "Ma'no tilini tanlang:",
    translation: "Tarjima",
    meaning: "Ma'no",
    support_text: "Iltimos, muammoning skrinshotini oling va @akkkkbar ga yuboring.\n\nShuningdek, muammo haqida qisqacha tavsif ham yuborishingiz mumkin.",
    contribution_text: "Iqtibosingiz, rasmingiz yoki videongizni yuboring.\n\nAgar sizning hissangiz tasdiqlansa, u Nightly Wisdom kanalida e'lon qilinishi mumkin.\n\nQabul qilinadigan kontent:\n\u2022 Matn\n\u2022 Rasm\n\u2022 Video\n\nQabul qilinmaydigan:\n\u2022 Ovozli xabarlar\n\u2022 Stickerlar\n\u2022 GIFlar",
    commands: {
      start: "/boshlash",
      language: "/til",
      help: "/yordam",
      report: "/shikoyat",
      contribution: "/ulashish"
    }
  },
  ru: {
    name: "Russian",
    flag: "\u{1F1F7}\u{1F1FA}",
    welcome: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435! \u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0432 Nightly Wisdom \u0431\u043E\u0442.",
    select_language: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A:",
    language_changed: "\u042F\u0437\u044B\u043A \u0438\u0437\u043C\u0435\u043D\u0435\u043D.",
    help_text: `\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F Nightly Wisdom Bot

1) \u041F\u0435\u0440\u0435\u0448\u043B\u0438\u0442\u0435 \u043B\u044E\u0431\u0443\u044E \u0446\u0438\u0442\u0430\u0442\u0443 \u0438\u0437 \u043D\u0430\u0448\u0435\u0433\u043E \u043A\u0430\u043D\u0430\u043B\u0430 \u044D\u0442\u043E\u043C\u0443 \u0431\u043E\u0442\u0443.
2)  \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \xAB\u041F\u0435\u0440\u0435\u0432\u043E\u0434\xBB \u0438\u043B\u0438 \xAB\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435\xBB \u043F\u043E\u0434 \u043F\u0440\u0438\u0441\u043B\u0430\u043D\u043D\u043E\u0439 \u0446\u0438\u0442\u0430\u0442\u043E\u0439.
3)  \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u0445\u043E\u0442\u0438\u0442\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442.

\u0414\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B:
1) /\u0441\u0442\u0430\u0440\u0442 \u2014 \u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0431\u043E\u0442\u0430 \u0438 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438.
2) /\u044F\u0437\u044B\u043A \u2014 \u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u044F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430 \u0438 \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0431\u043E\u0442\u0430.
3) /\u043F\u043E\u043C\u043E\u0449\u044C \u2014 \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u044D\u0442\u043E \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F.
4) /\u0436\u0430\u043B\u043E\u0431\u0430 \u2014 \u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u043E\u0448\u0438\u0431\u043A\u0430\u0445 \u0438\u043B\u0438 \u0431\u0430\u0433\u0430\u0445.
5) /\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u2014 \u041F\u0440\u0438\u0441\u043B\u0430\u0442\u044C \u0441\u0432\u043E\u0438 \u043B\u044E\u0431\u0438\u043C\u044B\u0435 \u0446\u0438\u0442\u0430\u0442\u044B \u0434\u043B\u044F \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438 \u043D\u0430 \u043A\u0430\u043D\u0430\u043B\u0435.

\u0418\u043D\u043B\u0430\u0439\u043D-\u043F\u043E\u0438\u0441\u043A (Inline Search):
\u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0438\u0441\u043A\u0430\u0442\u044C \u0446\u0438\u0442\u0430\u0442\u044B \u0432 \u043B\u044E\u0431\u043E\u043C \u0447\u0430\u0442\u0435! \u041F\u0440\u043E\u0441\u0442\u043E \u0432\u0432\u0435\u0434\u0438\u0442\u0435 @Nightly_Wisdom_Bot \u0438 \u0434\u0430\u043B\u0435\u0435 \u043A\u043B\u044E\u0447\u0435\u0432\u043E\u0435 \u0441\u043B\u043E\u0432\u043E`,
    invalid_channel: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u0437 \u043D\u0430\u0448\u0435\u0433\u043E \u043A\u0430\u043D\u0430\u043B\u0430.",
    select_translation_language: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A \u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0430:",
    select_meaning_language: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A \u0434\u043B\u044F \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F:",
    translation: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434",
    meaning: "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435",
    support_text: "\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0441\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B \u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E @akkkkbar.\n\n\u0412\u044B \u0442\u0430\u043A\u0436\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u044B.",
    contribution_text: "\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0432\u0430\u0448\u0443 \u0446\u0438\u0442\u0430\u0442\u0443, \u0444\u043E\u0442\u043E \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E.\n\n\u0415\u0441\u043B\u0438 \u0432\u0430\u0448 \u0432\u043A\u043B\u0430\u0434 \u0431\u0443\u0434\u0435\u0442 \u043E\u0434\u043E\u0431\u0440\u0435\u043D, \u043E\u043D \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043E\u043F\u0443\u0431\u043B\u0438\u043A\u043E\u0432\u0430\u043D \u0432 \u043A\u0430\u043D\u0430\u043B\u0435 Nightly Wisdom.\n\n\u041F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u043C\u044B\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442:\n\u2022 \u0422\u0435\u043A\u0441\u0442\n\u2022 \u0424\u043E\u0442\u043E\n\u2022 \u0412\u0438\u0434\u0435\u043E\n\n\u041D\u0435 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F:\n\u2022 \u0413\u043E\u043B\u043E\u0441\u043E\u0432\u044B\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F\n\u2022 \u0421\u0442\u0438\u043A\u0435\u0440\u044B\n\u2022 GIF",
    commands: {
      start: "/\u0441\u0442\u0430\u0440\u0442",
      language: "/\u044F\u0437\u044B\u043A",
      help: "/\u043F\u043E\u043C\u043E\u0449\u044C",
      report: "/\u0436\u0430\u043B\u043E\u0431\u0430",
      contribution: "/\u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C"
    }
  },
  en: {
    name: "English",
    flag: "\u{1F1EC}\u{1F1E7}",
    welcome: "Hello! Welcome to Nightly Wisdom bot.",
    select_language: "Please select your language:",
    language_changed: "Language changed.",
    help_text: `How to Use Nightly Wisdom Bot

1) Forward any quote from our channel to this bot.
2) Click "Translation" or "Meaning" from the buttons below the quote.
3) Choose the language you want to read it in.

Available Commands:
1) /start \u2014 Restart the bot and setup initialization.
2) /language \u2014 Change your interface and response language.
3) /help \u2014 Show this user guide.
4) /report \u2014 Report technical issues or bugs.
5) /contribution \u2014 Submit your own favorite quotes to be featured on our channel.

Inline Search:
You can search our quote database in any chat! Just type @Nightly_Wisdom_Bot followed by a keyword`,
    invalid_channel: "Please send messages only from our channel.",
    select_translation_language: "Select translation language:",
    select_meaning_language: "Select meaning language:",
    translation: "Translation",
    meaning: "Meaning",
    support_text: "Please take a screenshot of the problem and send it to @akkkkbar.\n\nYou may also include a short description of the issue.",
    contribution_text: "Send your quote, photo, or video.\n\nIf your contribution is approved, it may be published on the Nightly Wisdom channel.\n\nAccepted Content:\n\u2022 Text\n\u2022 Photo\n\u2022 Video\n\nNot accepted:\n\u2022 Voice messages\n\u2022 Stickers\n\u2022 GIFs",
    commands: {
      start: "/start",
      language: "/language",
      help: "/help",
      report: "/report",
      contribution: "/contribution"
    }
  }
};
function getText(languageCode, key) {
  const lang = LANGUAGES[languageCode] || LANGUAGES.en;
  const value = lang[key];
  if (typeof value === "object") {
    return key;
  }
  return value || key;
}
__name(getText, "getText");
function getLanguageName(languageCode) {
  const lang = LANGUAGES[languageCode] || LANGUAGES.en;
  return `${lang.flag} ${lang.name}`;
}
__name(getLanguageName, "getLanguageName");

// src/bot-handler.ts
var BotHandler = class {
  constructor(env) {
    this.env = env;
    this.db = new Database(env.DB);
    this.kv = new KVStorage(env.KV);
    this.telegram = new TelegramAPI(env.TELEGRAM_BOT_TOKEN, env);
    this.validator = new ChannelValidator(env.CHANNEL_USERNAME);
  }
  db;
  kv;
  telegram;
  validator;
  async handleUpdate(update) {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      } else if (update.inline_query) {
        await this.handleInlineQuery(update.inline_query);
      } else if (update.channel_post) {
        await this.handleChannelPost(update.channel_post);
      }
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Error handling update:", error);
      return new Response("Error", { status: 500 });
    }
  }
  async handleMessage(message) {
    const userId = message.from.id;
    const text = message.text;
    const userState = await this.kv.getUserState(userId);
    if (userState === "waiting_for_contribution") {
      await this.processContribution(message);
      return;
    }
    if (userState === "waiting_for_broadcast") {
      await this.processBroadcast(message);
      return;
    }
    if (text && text.startsWith("/")) {
      await this.handleCommand(message);
      return;
    }
    if (userState === "waiting_for_language") {
      await this.handleLanguageSelection(message);
      return;
    }
    const language = await this.db.getUserLanguage(userId) || "en";
    if (!language) {
      await this.telegram.sendMessage(userId, getText("en", "select_language"));
      return;
    }
    let messageContent = null;
    let messageId = null;
    if (message.forward_from_chat) {
      const { isValid, messageId: extractedId } = this.validator.validateForwardedMessage(message);
      if (isValid && extractedId) {
        messageId = extractedId;
        messageContent = message.text || message.caption || null;
        if (!messageContent) {
          await this.telegram.sendMessage(userId, "This message type is not supported. Please send text messages or messages with text captions.");
          return;
        }
        await this.kv.setMessageStorage(userId, messageId);
        await this.kv.setContentStorage(userId, messageContent);
        await this.telegram.sendMessage(userId, "Please select an action:", {
          reply_markup: this.getActionKeyboard()
        });
      } else {
        await this.telegram.sendMessage(userId, getText(language, "invalid_channel"), {
          reply_markup: this.getInvalidChannelKeyboard()
        });
      }
    } else {
      await this.telegram.sendMessage(userId, "Please forward a message from the Nightly Wisdom channel.");
    }
  }
  async handleCommand(message) {
    const userId = message.from.id;
    const text = message.text;
    const command = text.split(" ")[0];
    switch (command) {
      case "/start":
        await this.cmdStart(message);
        break;
      case "/language":
        await this.cmdLanguage(message);
        break;
      case "/help":
        await this.cmdHelp(message);
        break;
      case "/support":
      case "/report":
        await this.cmdReport(message);
        break;
      case "/contribution":
        await this.cmdContribution(message);
        break;
      case "/message":
        await this.cmdMessage(message);
        break;
      default:
        await this.handleLanguageSelection(message);
    }
  }
  async cmdStart(message) {
    const userId = message.from.id;
    const existingLanguage = await this.db.getUserLanguage(userId);
    if (existingLanguage) {
      const welcomeText = getText(existingLanguage, "welcome");
      await this.telegram.sendMessage(userId, welcomeText);
    } else {
      const selectText = getText("en", "select_language");
      await this.telegram.sendMessage(userId, selectText, {
        reply_markup: this.getLanguageKeyboard()
      });
      await this.kv.setUserState(userId, "waiting_for_language");
    }
  }
  async cmdLanguage(message) {
    const userId = message.from.id;
    const currentLanguage = await this.db.getUserLanguage(userId) || "en";
    const selectText = getText(currentLanguage, "select_language");
    await this.telegram.sendMessage(userId, selectText, {
      reply_markup: this.getLanguageKeyboard()
    });
    await this.kv.setUserState(userId, "waiting_for_language");
  }
  async cmdHelp(message) {
    const userId = message.from.id;
    const language = await this.db.getUserLanguage(userId) || "en";
    const helpText = getText(language, "help_text");
    await this.telegram.sendMessage(userId, helpText, { parse_mode: "HTML" });
  }
  async cmdReport(message) {
    const userId = message.from.id;
    const language = await this.db.getUserLanguage(userId) || "en";
    const supportText = getText(language, "support_text");
    await this.telegram.sendMessage(userId, supportText);
  }
  async cmdContribution(message) {
    const userId = message.from.id;
    const language = await this.db.getUserLanguage(userId) || "en";
    const contributionText = getText(language, "contribution_text");
    await this.telegram.sendMessage(userId, contributionText);
    await this.kv.setUserState(userId, "waiting_for_contribution");
  }
  async processContribution(message) {
    const userId = message.from.id;
    const language = await this.db.getUserLanguage(userId) || "en";
    if (message.voice) {
      await this.telegram.sendMessage(userId, "Voice messages are not accepted. Please send text, photo, or video.");
      await this.kv.clearUserState(userId);
      return;
    }
    if (message.sticker) {
      await this.telegram.sendMessage(userId, "Stickers are not accepted. Please send text, photo, or video.");
      await this.kv.clearUserState(userId);
      return;
    }
    if (message.animation) {
      await this.telegram.sendMessage(userId, "GIFs are not accepted. Please send text, photo, or video.");
      await this.kv.clearUserState(userId);
      return;
    }
    const adminUserId = parseInt(this.env.ADMIN_USER_ID, 10);
    if (!adminUserId || adminUserId === 0) {
      await this.telegram.sendMessage(userId, "Admin ID not configured. Please contact the bot administrator.");
      await this.kv.clearUserState(userId);
      return;
    }
    try {
      let contentType = null;
      let content = "";
      if (message.text) {
        contentType = "text";
        content = message.text;
      } else if (message.photo) {
        contentType = "photo";
        content = `[Photo: ${message.caption || "No caption"}]`;
      } else if (message.video) {
        contentType = "video";
        content = `[Video: ${message.caption || "No caption"}]`;
      } else {
        await this.telegram.sendMessage(userId, "This content type is not supported. Please send text, photo, or video.");
        await this.kv.clearUserState(userId);
        return;
      }
      await this.db.saveContribution(userId, contentType, content);
      const username = message.from.username || "No username";
      let contributionInfo = `\u{1F4E8} New Contribution

User: @${username}
Telegram ID: ${userId}
`;
      if (message.text) {
        contributionInfo += `Type: Text

Content:
${message.text}`;
        await this.telegram.sendMessage(adminUserId, contributionInfo);
      } else if (message.photo) {
        contributionInfo += "Type: Photo";
        await this.telegram.sendMessage(adminUserId, contributionInfo);
        await this.telegram.forwardMessage(adminUserId, message.chat.id, message.message_id);
      } else if (message.video) {
        contributionInfo += "Type: Video";
        await this.telegram.sendMessage(adminUserId, contributionInfo);
        await this.telegram.forwardMessage(adminUserId, message.chat.id, message.message_id);
      }
      await this.telegram.sendMessage(userId, "Thank you for your contribution! We will review it and get back to you if it's approved.");
      await this.kv.clearUserState(userId);
    } catch (error) {
      console.error("Error processing contribution:", error);
      await this.telegram.sendMessage(userId, "An error occurred while processing your contribution. Please try again later.");
      await this.kv.clearUserState(userId);
    }
  }
  async cmdMessage(message) {
    const userId = message.from.id;
    const username = message.from.username;
    if (username !== "akkkkbar") {
      await this.telegram.sendMessage(userId, "This command is only available to administrators.");
      return;
    }
    await this.telegram.sendMessage(userId, "Please send the message you want to broadcast to all users.");
    await this.kv.setUserState(userId, "waiting_for_broadcast");
  }
  async processBroadcast(message) {
    const userId = message.from.id;
    const username = message.from.username;
    if (username !== "akkkkbar") {
      await this.telegram.sendMessage(userId, "This command is only available to administrators.");
      await this.kv.clearUserState(userId);
      return;
    }
    try {
      const allUsers = await this.db.getAllUsers();
      if (!allUsers || allUsers.length === 0) {
        await this.telegram.sendMessage(userId, "No users found in database.");
        await this.kv.clearUserState(userId);
        return;
      }
      let successCount = 0;
      let failCount = 0;
      for (const targetUserId of allUsers) {
        try {
          if (message.text) {
            await this.telegram.sendMessage(targetUserId, message.text);
          } else if (message.photo) {
            await this.telegram.sendPhoto(targetUserId, message.photo[0].file_id, message.caption);
          } else if (message.video) {
            await this.telegram.sendVideo(targetUserId, message.video.file_id, message.caption);
          } else if (message.document) {
            await this.telegram.sendDocument(targetUserId, message.document.file_id, message.caption);
          } else {
            await this.telegram.forwardMessage(targetUserId, message.chat.id, message.message_id);
          }
          successCount++;
        } catch (error) {
          console.error(`Failed to send broadcast to user ${targetUserId}:`, error);
          failCount++;
        }
      }
      await this.telegram.sendMessage(userId, `Broadcast completed!
\u2705 Success: ${successCount}
\u274C Failed: ${failCount}`);
      await this.kv.clearUserState(userId);
    } catch (error) {
      console.error("Error broadcasting message:", error);
      await this.telegram.sendMessage(userId, "An error occurred while broadcasting the message. Please try again.");
      await this.kv.clearUserState(userId);
    }
  }
  async handleLanguageSelection(message) {
    const userId = message.from.id;
    const text = message.text;
    const languageMap = {
      "\u{1F1FA}\u{1F1FF} Uzbek": "uz",
      "\u{1F1F7}\u{1F1FA} Russian": "ru",
      "\u{1F1EC}\u{1F1E7} English": "en"
    };
    const languageCode = languageMap[text];
    if (languageCode) {
      await this.db.saveUserLanguage(userId, languageCode);
      const welcomeText = getText(languageCode, "welcome");
      await this.telegram.sendMessage(userId, welcomeText, {
        reply_markup: {
          remove_keyboard: true
        }
      });
      await this.kv.clearUserState(userId);
    }
  }
  async handleCallbackQuery(callbackQuery) {
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    const language = await this.db.getUserLanguage(userId) || "en";
    if (data.startsWith("action_")) {
      const action = data.split("_")[1];
      const messageId = await this.kv.getMessageStorage(userId);
      const messageContent = await this.kv.getContentStorage(userId);
      if (!messageId || !messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, "Error: Message content not found. Please try again.");
        return;
      }
      if (action === "translation") {
        const detector = getLanguageDetector();
        const detectedLanguage = detector.detect(messageContent) || "en";
        const availableLanguages = detector.getTranslationOptions(detectedLanguage);
        const selectText = getText(language, "select_translation_language");
        await this.telegram.sendMessage(userId, selectText, {
          reply_markup: this.getTranslationLanguageKeyboard(availableLanguages)
        });
        await this.kv.setDetectedLanguage(userId, detectedLanguage);
      } else if (action === "meaning") {
        const selectText = getText(language, "select_meaning_language");
        await this.telegram.sendMessage(userId, selectText, {
          reply_markup: this.getMeaningLanguageKeyboard()
        });
      }
      await this.telegram.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith("trans_lang_")) {
      const targetLanguage = data.split("_")[2];
      const messageContent = await this.kv.getContentStorage(userId);
      const detectedLanguage = await this.kv.getDetectedLanguage(userId) || "en";
      if (!messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, "Error: Message content not found. Please try again.");
        return;
      }
      const processingMessage = await this.telegram.sendMessage(userId, "Translating... \u23F3");
      try {
        const aiService = getAIService(this.env);
        const translatedText = await aiService.translateText(messageContent, targetLanguage);
        if (translatedText) {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          const translationLabel = getText(language, "translation");
          await this.telegram.sendMessage(userId, `${translationLabel}:

${translatedText}`);
        } else {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          await this.telegram.sendMessage(userId, "Translation failed. Please try again.");
        }
      } catch (error) {
        await this.telegram.deleteMessage(userId, processingMessage.message_id);
        await this.telegram.sendMessage(userId, "An error occurred during translation. Please try again.");
      }
      await this.telegram.answerCallbackQuery(callbackQuery.id);
    } else if (data.startsWith("meaning_lang_")) {
      const targetLanguage = data.split("_")[2];
      const messageId = await this.kv.getMessageStorage(userId);
      const messageContent = await this.kv.getContentStorage(userId);
      if (!messageId || !messageContent) {
        await this.telegram.answerCallbackQuery(callbackQuery.id, "Error: Message content not found. Please try again.");
        return;
      }
      const processingMessage = await this.telegram.sendMessage(userId, "Generating meaning... \u23F3");
      try {
        const customMeaning = await this.db.getMeaning(Number(messageId), targetLanguage);
        if (customMeaning) {
          await this.telegram.deleteMessage(userId, processingMessage.message_id);
          const meaningLabel = getText(language, "meaning");
          await this.telegram.sendMessage(userId, `${meaningLabel}:

${customMeaning}`);
        } else {
          const aiService = getAIService(this.env);
          const generatedMeaning = await aiService.generateMeaning(messageContent, targetLanguage);
          if (generatedMeaning) {
            await this.telegram.deleteMessage(userId, processingMessage.message_id);
            await this.telegram.sendMessage(userId, generatedMeaning);
          } else {
            await this.telegram.deleteMessage(userId, processingMessage.message_id);
            await this.telegram.sendMessage(userId, "Failed to generate meaning. Please try again.");
          }
        }
      } catch (error) {
        await this.telegram.deleteMessage(userId, processingMessage.message_id);
        await this.telegram.sendMessage(userId, "An error occurred while generating meaning. Please try again.");
      }
      await this.telegram.answerCallbackQuery(callbackQuery.id);
    }
  }
  async handleInlineQuery(inlineQuery) {
    const query = inlineQuery.query.trim();
    const userId = inlineQuery.from.id;
    if (!query) {
      await this.telegram.answerInlineQuery(inlineQuery.id, []);
      return;
    }
    try {
      const results = await this.db.searchQuotes(query, 5);
      if (results.length === 0) {
        await this.telegram.answerInlineQuery(inlineQuery.id, []);
        return;
      }
      const inlineResults = results.map((result) => {
        const messageId = result.message_id;
        const content = result.content;
        const language = result.language;
        const displayContent = content.length > 64 ? content.substring(0, 64) + "..." : content;
        const formattedContent = `<blockquote>${content}</blockquote>`;
        return {
          type: "article",
          id: messageId.toString(),
          title: displayContent,
          description: language.toUpperCase(),
          input_message_content: {
            message_text: formattedContent,
            parse_mode: "HTML"
          },
          reply_markup: this.getActionKeyboard()
        };
      });
      console.log("Sending inline results:", JSON.stringify(inlineResults));
      await this.telegram.answerInlineQuery(inlineQuery.id, inlineResults);
    } catch (error) {
      console.error("Error in inline query:", error);
      console.error("Error message:", error?.message);
    }
  }
  async handleChannelPost(message) {
    if (message.chat.username !== this.env.CHANNEL_USERNAME) {
      return;
    }
    const messageId = message.message_id;
    let content = null;
    let mediaType = "text";
    if (message.text) {
      content = message.text;
    } else if (message.caption) {
      content = message.caption;
      if (message.photo)
        mediaType = "photo";
      else if (message.video)
        mediaType = "video";
      else if (message.audio)
        mediaType = "audio";
      else if (message.document)
        mediaType = "document";
    } else {
      mediaType = "unknown";
      content = "";
    }
    let language = null;
    if (content) {
      try {
        const detector = getLanguageDetector();
        language = detector.detect(content);
      } catch (error) {
        language = "unknown";
      }
    }
    if (content || mediaType !== "text") {
      await this.db.saveQuote(messageId, content || "", language || "unknown", mediaType);
    }
  }
  getLanguageKeyboard() {
    return {
      keyboard: [
        [{ text: "\u{1F1FA}\u{1F1FF} Uzbek" }],
        [{ text: "\u{1F1F7}\u{1F1FA} Russian" }],
        [{ text: "\u{1F1EC}\u{1F1E7} English" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }
  getActionKeyboard() {
    return {
      inline_keyboard: [
        [
          { text: "Translation", callback_data: "action_translation" },
          { text: "Meaning", callback_data: "action_meaning" }
        ]
      ]
    };
  }
  getTranslationLanguageKeyboard(availableLanguages) {
    return {
      inline_keyboard: availableLanguages.map((lang) => [
        { text: getLanguageName(lang), callback_data: `trans_lang_${lang}` }
      ])
    };
  }
  getMeaningLanguageKeyboard() {
    return {
      inline_keyboard: [
        [{ text: getLanguageName("uz"), callback_data: "meaning_lang_uz" }],
        [{ text: getLanguageName("ru"), callback_data: "meaning_lang_ru" }],
        [{ text: getLanguageName("en"), callback_data: "meaning_lang_en" }]
      ]
    };
  }
  getInvalidChannelKeyboard() {
    return {
      inline_keyboard: [
        [{ text: "our channel", url: `https://t.me/${this.env.CHANNEL_USERNAME}` }]
      ]
    };
  }
};
__name(BotHandler, "BotHandler");

// src/index.ts
var src_default = {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/health") {
        return new Response("OK", { status: 200 });
      }
      return new Response("Nightly Wisdom Bot - Webhook endpoint", { status: 200 });
    }
    if (request.method === "POST") {
      try {
        const update = await request.json();
        const handler = new BotHandler(env);
        return await handler.handleUpdate(update);
      } catch (error) {
        console.error("Error processing webhook:", error);
        return new Response("Error processing webhook", { status: 500 });
      }
    }
    return new Response("Method not allowed", { status: 405 });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-vJg7IJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-vJg7IJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
