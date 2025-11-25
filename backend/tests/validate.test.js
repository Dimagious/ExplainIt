/**
 * Unit tests for validation middleware
 * Tests request validation logic
 */

const { validateExplainRequest } = require('../middleware/validate');

describe('Validation Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  describe('validateExplainRequest', () => {
    test('should pass valid request', () => {
      req.body = {
        text: 'This is a valid text to explain',
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    test('should reject missing text', () => {
      req.body = {
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('required')
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    test('should reject empty text', () => {
      req.body = {
        text: '',
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should reject text that is too short', () => {
      req.body = {
        text: 'a',
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('short')
        })
      );
    });
    
    test('should reject text that is too long', () => {
      req.body = {
        text: 'a'.repeat(2001),
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('long')
        })
      );
    });
    
    test('should reject invalid tone', () => {
      req.body = {
        text: 'Valid text',
        tone: 'invalid',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('tone')
        })
      );
    });
    
    test('should reject invalid language', () => {
      req.body = {
        text: 'Valid text',
        tone: 'simple',
        language: 'fr'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('language')
        })
      );
    });
    
    test('should use default values for missing tone/language', () => {
      req.body = {
        text: 'Valid text'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(req.body.tone).toBe('simple');
      expect(req.body.language).toBe('en');
      expect(next).toHaveBeenCalledWith();
    });
    
    test('should trim whitespace from text', () => {
      req.body = {
        text: '  Valid text  ',
        tone: 'simple',
        language: 'en'
      };
      
      validateExplainRequest(req, res, next);
      
      expect(req.body.text).toBe('Valid text');
      expect(next).toHaveBeenCalledWith();
    });
  });
});

