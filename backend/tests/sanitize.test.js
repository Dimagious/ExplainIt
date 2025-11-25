/**
 * Unit tests for sanitization utilities
 * SECURITY: Test data sanitization for logs
 */

const {
  hashText,
  maskText,
  sanitizeRequestBody,
  sanitizeResponse
} = require('../utils/sanitize');

describe('Sanitization utilities', () => {
  describe('hashText', () => {
    test('should hash text consistently', () => {
      const text = 'Hello, world!';
      const hash1 = hashText(text);
      const hash2 = hashText(text);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });
    
    test('should return different hashes for different texts', () => {
      const hash1 = hashText('Hello');
      const hash2 = hashText('World');
      
      expect(hash1).not.toBe(hash2);
    });
    
    test('should handle empty string', () => {
      const hash = hashText('');
      expect(hash).toBeDefined();
    });
  });
  
  describe('maskText', () => {
    test('should mask long text', () => {
      const text = 'This is a very long text that should be masked in the middle';
      const masked = maskText(text, 10);
      
      expect(masked).toContain('...');
      expect(masked).toContain('[');
      expect(masked).toContain('chars]');
      expect(masked.length).toBeLessThan(text.length);
    });
    
    test('should show full length for short text', () => {
      const text = 'Short';
      const masked = maskText(text, 10);
      
      expect(masked).toBe('[5 chars]');
    });
    
    test('should handle empty string', () => {
      const masked = maskText('');
      expect(masked).toBe('[empty]');
    });
  });
  
  describe('sanitizeRequestBody', () => {
    const testBody = {
      text: 'This is sensitive user text that should not be logged in full',
      language: 'en',
      tone: 'simple'
    };
    
    test('should sanitize with minimal level', () => {
      const sanitized = sanitizeRequestBody(testBody, 'minimal');
      
      expect(sanitized.language).toBe('en');
      expect(sanitized.tone).toBe('simple');
      expect(sanitized.textLength).toBe(testBody.text.length);
      expect(sanitized.textHash).toBeDefined();
      expect(sanitized.text).toBeUndefined();
      expect(sanitized.textPreview).toBeUndefined();
    });
    
    test('should sanitize with metadata level', () => {
      const sanitized = sanitizeRequestBody(testBody, 'metadata');
      
      expect(sanitized.language).toBe('en');
      expect(sanitized.tone).toBe('simple');
      expect(sanitized.textLength).toBe(testBody.text.length);
      expect(sanitized.textHash).toBeDefined();
      expect(sanitized.textPreview).toBeDefined();
      expect(sanitized.text).toBeUndefined();
    });
    
    test('should handle full level in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const sanitized = sanitizeRequestBody(testBody, 'full');
      
      expect(sanitized.text).toBe(testBody.text);
      
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should not expose full text in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const sanitized = sanitizeRequestBody(testBody, 'full');
      
      expect(sanitized.text).toBeUndefined();
      expect(sanitized.textHash).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
  
  describe('sanitizeResponse', () => {
    const testResponse = {
      result: 'This is the explanation result that should be sanitized',
      model: 'gpt-4o-mini',
      usage: { 
        prompt_tokens: 100, 
        completion_tokens: 50,
        total_tokens: 150
      },
      cost: 0.00001
    };
    
    test('should sanitize response with minimal level', () => {
      const sanitized = sanitizeResponse(testResponse, 'minimal');
      
      expect(sanitized.model).toBe('gpt-4o-mini');
      expect(sanitized.usage).toBeDefined();
      expect(sanitized.cost).toBe(0.00001);
      expect(sanitized.resultLength).toBe(testResponse.result.length);
      expect(sanitized.resultHash).toBeDefined();
      expect(sanitized.result).toBeUndefined();
    });
    
    test('should sanitize response with metadata level', () => {
      const sanitized = sanitizeResponse(testResponse, 'metadata');
      
      expect(sanitized.resultLength).toBe(testResponse.result.length);
      expect(sanitized.resultHash).toBeDefined();
      expect(sanitized.resultPreview).toBeDefined();
      expect(sanitized.result).toBeUndefined();
    });
  });
});

