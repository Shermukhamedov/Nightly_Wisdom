import { LanguageCode } from './types';

export class LanguageDetector {
  private uzbekWords = new Set([
    'bilaman', 'bilmayman', 'qilaman', 'qilmayman',
    'keladi', 'kelmaydi', 'bor', 'yoq', 'ha', 'yoq',
    'shunday', 'bunday', 'qanday', 'nimaga', 'nega',
    'men', 'sen', 'u', 'biz', 'siz', 'ular',
    'bu', 'shu', 'u', 'mening', 'sening', 'uning',
    'bizning', 'sizning', 'ularning',
    'muvaffaqiyat', 'muvaffaqiyatsizlik', 'yakuniy', 'halokatli',
    'dasturlash', 'organmoqchiman', 'boshlash', 'yaxshi',
    'qil', 'qiling', 'bormi', 'yoqmi', 'qachon',
    'qayer', 'qaysi', 'nimada', 'nima', 'kim',
    'qandaydir', 'shuqa', 'ham', 'yoki', 'lekin',
    'chunki', 'agar', 'hatto', 'juda', 'juda',
    'kop', 'oz', 'katta', 'kichik', 'yangi',
    'eski', 'yaxshi', 'yomon', 'chiroyli', 'bevaqt',
    'yo\'q', 'o\'rganmoqchiman', 'ko\'p', 'yo\'qmi'
  ]);

  private russianWords = new Set([
    'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
    'это', 'тот', 'этот', 'та', 'то', 'эти', 'те',
    'да', 'нет', 'может', 'можно', 'нужно',
    'хорошо', 'плохо', 'большой', 'маленький',
    'хотеть', 'мочь', 'должен', 'надо'
  ]);

  private englishWords = new Set([
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those',
    'yes', 'no', 'maybe', 'can', 'could',
    'will', 'would', 'should', 'must',
    'want', 'need', 'have', 'had', 'has'
  ]);

  detect(text: string): LanguageCode | null {
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

    const uzbekLatinPatterns = ['sh', 'ch', 'ng', '\'', 'ʻ'];
    const hasUzbekLatinPatterns = uzbekLatinPatterns.some(pattern => textLower.includes(pattern));

    let uzScore = 0;
    let ruScore = 0;
    let enScore = 0;

    const words = textLower.match(/\b\w+\b/g) || [];

    for (const word of words) {
      if (this.uzbekWords.has(word)) uzScore++;
      if (this.russianWords.has(word)) ruScore++;
      if (this.englishWords.has(word)) enScore++;
    }

    if (hasUzbekChars && hasCyrillic) {
      return 'uz';
    }

    if (hasCyrillic && !hasLatin) {
      if (uzScore > ruScore) return 'uz';
      if (ruScore > uzScore) return 'ru';
      return 'ru';
    }

    if (hasLatin && !hasCyrillic) {
      if (uzScore > enScore) return 'uz';
      if (hasUzbekLatinPatterns && uzScore > 0) return 'uz';
      if (enScore > 0) return 'en';
      if (hasUzbekLatinPatterns) return 'uz';
      return 'en';
    }

    if (hasCyrillic && hasLatin) {
      const scores = { uz: uzScore, ru: ruScore, en: enScore };
      const maxScore = Math.max(uzScore, ruScore, enScore);

      if (maxScore === 0) {
        if (hasUzbekChars) return 'uz';
        if (hasCyrillic) return 'ru';
        return 'en';
      }

      for (const [lang, score] of Object.entries(scores)) {
        if (score === maxScore) return lang as LanguageCode;
      }
    }

    return 'en';
  }

  getTranslationOptions(sourceLanguage: LanguageCode): LanguageCode[] {
    const allLanguages: LanguageCode[] = ['uz', 'ru', 'en'];
    return allLanguages.filter(lang => lang !== sourceLanguage);
  }
}

let languageDetectorInstance: LanguageDetector | null = null;

export function getLanguageDetector(): LanguageDetector {
  if (!languageDetectorInstance) {
    languageDetectorInstance = new LanguageDetector();
  }
  return languageDetectorInstance;
}
