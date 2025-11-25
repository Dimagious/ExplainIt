/**
 * Unit tests for prompt builder
 * Tests prompt generation logic
 */

const {
  buildPrompt,
  getToneLabel,
  getLanguageLabel
} = require('../services/promptBuilder');

describe('Prompt Builder', () => {
  describe('getToneLabel', () => {
    test('should return correct label for simple tone', () => {
      expect(getToneLabel('simple')).toBe('Simple');
    });
    
    test('should return correct label for kid tone', () => {
      expect(getToneLabel('kid')).toBe('Kid-friendly');
    });
    
    test('should return correct label for expert tone', () => {
      expect(getToneLabel('expert')).toBe('Expert');
    });
    
    test('should return Simple for unknown tone', () => {
      expect(getToneLabel('unknown')).toBe('Simple');
    });
  });
  
  describe('getLanguageLabel', () => {
    test('should return correct label for English', () => {
      expect(getLanguageLabel('en')).toBe('English');
    });
    
    test('should return correct label for Russian', () => {
      expect(getLanguageLabel('ru')).toBe('Russian');
    });
    
    test('should return English for unknown language', () => {
      expect(getLanguageLabel('fr')).toBe('English');
    });
  });
  
  describe('buildPrompt', () => {
    const testText = 'Quantum entanglement is a physical phenomenon';
    
    test('should build prompt for English simple tone', () => {
      const prompt = buildPrompt(testText, 'simple', 'en');
      
      expect(prompt).toContain(testText);
      expect(prompt).toContain('English');
      expect(prompt.toLowerCase()).toContain('simple');
    });
    
    test('should build prompt for Russian kid tone', () => {
      const prompt = buildPrompt(testText, 'kid', 'ru');
      
      expect(prompt).toContain(testText);
      expect(prompt).toContain('Russian');
      expect(prompt.toLowerCase()).toContain('5');
    });
    
    test('should build prompt for expert tone', () => {
      const prompt = buildPrompt(testText, 'expert', 'en');
      
      expect(prompt).toContain(testText);
      expect(prompt.toLowerCase()).toContain('expert');
    });
    
    test('should handle default values', () => {
      const prompt = buildPrompt(testText, 'unknown', 'unknown');
      
      expect(prompt).toContain(testText);
      expect(prompt).toBeDefined();
    });
    
    test('should include instructions for tone', () => {
      const simplePrompt = buildPrompt(testText, 'simple', 'en');
      const expertPrompt = buildPrompt(testText, 'expert', 'en');
      
      expect(simplePrompt).not.toBe(expertPrompt);
    });
  });
});

