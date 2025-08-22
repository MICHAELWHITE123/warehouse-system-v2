import { PasswordGenerator } from '../passwordGenerator';

describe('PasswordGenerator', () => {
  describe('generate', () => {
    it('should generate password with default options', () => {
      const password = PasswordGenerator.generate();
      
      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThanOrEqual(8);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[@$!%*?&]/.test(password)).toBe(true);
    });

    it('should generate password with custom length', () => {
      const password = PasswordGenerator.generate({ length: 20 });
      
      expect(password.length).toBe(20);
    });

    it('should generate password without symbols when disabled', () => {
      const password = PasswordGenerator.generate({ includeSymbols: false });
      
      expect(/[@$!%*?&]/.test(password)).toBe(false);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
    });

    it('should exclude similar characters when enabled', () => {
      const password = PasswordGenerator.generate({ excludeSimilar: true });
      
      expect(/[il1Lo0O]/.test(password)).toBe(false);
    });
  });

  describe('generateStrong', () => {
    it('should generate strong password', () => {
      const password = PasswordGenerator.generateStrong();
      
      expect(password.length).toBe(16);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
      expect(/[@$!%*?&]/.test(password)).toBe(true);
    });
  });

  describe('generateMemorable', () => {
    it('should generate memorable password', () => {
      const password = PasswordGenerator.generateMemorable();
      
      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThan(10);
      expect(/\d/.test(password)).toBe(true);
      expect(/[@$!%*?&]/.test(password)).toBe(true);
    });
  });

  describe('getStrengthScore', () => {
    it('should return correct score for weak password', () => {
      const score = PasswordGenerator.getStrengthScore('weak');
      expect(score).toBeLessThanOrEqual(3);
    });

    it('should return correct score for strong password', () => {
      const score = PasswordGenerator.getStrengthScore('StrongPass123!');
      expect(score).toBeGreaterThan(5);
    });

    it('should return correct score for very strong password', () => {
      const score = PasswordGenerator.getStrengthScore('VeryStrongPassword123!@#');
      expect(score).toBeGreaterThan(6);
    });
  });

  describe('getStrengthLabel', () => {
    it('should return correct label for score', () => {
      expect(PasswordGenerator.getStrengthLabel(1)).toBe('Очень слабый');
      expect(PasswordGenerator.getStrengthLabel(3)).toBe('Слабый');
      expect(PasswordGenerator.getStrengthLabel(5)).toBe('Хороший');
      expect(PasswordGenerator.getStrengthLabel(7)).toBe('Очень сильный');
    });
  });

  describe('validation', () => {
    it('should validate password correctly', () => {
      const validPassword = 'StrongPass123!';
      const invalidPassword = 'weak';
      
      expect(PasswordGenerator.getStrengthScore(validPassword)).toBeGreaterThan(5);
      expect(PasswordGenerator.getStrengthScore(invalidPassword)).toBeLessThan(3);
    });
  });
});
