/**
 * Unit tests for OpenAI service
 * Tests cost calculation (API calls are mocked)
 */

// Mock OpenAI before requiring the module
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }));
});

// Set mock API key before requiring the module
process.env.OPENAI_API_KEY = 'test-api-key';

const { calculateCost } = require('../services/openai');

describe('OpenAI Service', () => {
  describe('calculateCost', () => {
    test('should calculate cost correctly for small request', () => {
      const cost = calculateCost(100, 50);
      
      // 100 prompt tokens * $0.150/1M = $0.000015
      // 50 completion tokens * $0.600/1M = $0.000030
      // Total = $0.000045
      
      expect(cost).toBeCloseTo(0.000045, 6);
    });
    
    test('should calculate cost for larger request', () => {
      const cost = calculateCost(1000, 500);
      
      expect(cost).toBeCloseTo(0.00045, 6);
    });
    
    test('should handle zero tokens', () => {
      const cost = calculateCost(0, 0);
      
      expect(cost).toBe(0);
    });
    
    test('should calculate cost for typical explanation request', () => {
      // Typical request: ~200 prompt tokens, ~300 completion tokens
      const cost = calculateCost(200, 300);
      
      // Should be less than $0.001 (affordable)
      expect(cost).toBeLessThan(0.001);
      expect(cost).toBeGreaterThan(0);
    });
  });
});
