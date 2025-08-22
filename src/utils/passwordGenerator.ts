interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

export class PasswordGenerator {
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '@$!%*?&';
  private static readonly SIMILAR_CHARS = 'il1Lo0O';

  static generate(options: PasswordOptions = {}): string {
    const {
      length = 12,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let charset = '';
    let password = '';

    // Формируем набор символов на основе опций
    if (includeUppercase) charset += this.UPPERCASE;
    if (includeLowercase) charset += this.LOWERCASE;
    if (includeNumbers) charset += this.NUMBERS;
    if (includeSymbols) charset += this.SYMBOLS;

    // Убираем похожие символы если требуется
    if (excludeSimilar) {
      charset = charset.split('').filter(char => !this.SIMILAR_CHARS.includes(char)).join('');
    }

    if (charset.length === 0) {
      throw new Error('Необходимо выбрать хотя бы один тип символов');
    }

    // Генерируем пароль
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    // Проверяем, что пароль соответствует требованиям
    if (!this.validatePassword(password, options)) {
      // Если не соответствует, генерируем заново
      return this.generate(options);
    }

    return password;
  }

  static generateStrong(): string {
    return this.generate({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true
    });
  }

  static generateMemorable(): string {
    const words = [
      'correct', 'horse', 'battery', 'staple', 'blue', 'sky', 'happy', 'day',
      'strong', 'password', 'secure', 'system', 'warehouse', 'management'
    ];
    
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const number = Math.floor(Math.random() * 1000);
    const symbol = this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)];
    
    return `${word1}${word2}${number}${symbol}`;
  }

  private static validatePassword(password: string, options: PasswordOptions): boolean {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true
    } = options;

    if (includeUppercase && !/[A-Z]/.test(password)) return false;
    if (includeLowercase && !/[a-z]/.test(password)) return false;
    if (includeNumbers && !/\d/.test(password)) return false;
    if (includeSymbols && !/[@$!%*?&]/.test(password)) return false;

    return true;
  }

  static getStrengthScore(password: string): number {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[@$!%*?&]/.test(password)) score += 1;
    
    // Бонус за разнообразие символов
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 1;
    
    return Math.min(score, 8);
  }

  static getStrengthLabel(score: number): string {
    if (score <= 2) return 'Очень слабый';
    if (score <= 3) return 'Слабый';
    if (score <= 4) return 'Средний';
    if (score <= 5) return 'Хороший';
    if (score <= 6) return 'Сильный';
    return 'Очень сильный';
  }
}
