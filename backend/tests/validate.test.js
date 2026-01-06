/**
 * Unit tests for validation middleware
 * Tests request validation logic
 * 
 * NOTE: Requires express-validator to be installed:
 *   npm install express-validator
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
    test('should pass valid request', async () => {
      req.body = {
        text: 'This is a valid text to explain',
        tone: 'simple',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      
      // Wait for async validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(next).toHaveBeenCalled();
    });
    
    test('should reject missing text', async () => {
      req.body = {
        tone: 'simple',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      );
    });
    
    test('should reject text that is too short', async () => {
      req.body = {
        text: 'a',
        tone: 'simple',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should reject text that is too long', async () => {
      req.body = {
        text: 'a'.repeat(2001),
        tone: 'simple',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should reject invalid tone', async () => {
      req.body = {
        text: 'Valid text for testing',
        tone: 'invalid',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      );
    });
    
    test('should reject invalid language', async () => {
      req.body = {
        text: 'Valid text for testing',
        tone: 'simple',
        language: 'fr'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR'
        })
      );
    });
    
    test('should reject missing tone', async () => {
      req.body = {
        text: 'Valid text for testing',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should reject missing language', async () => {
      req.body = {
        text: 'Valid text for testing',
        tone: 'simple'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.status).toHaveBeenCalledWith(400);
    });
    
    test('should sanitize HTML from text', async () => {
      req.body = {
        text: '<script>alert("xss")</script>Valid text here',
        tone: 'simple',
        language: 'en'
      };
      
      await validateExplainRequest(req, res, next);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should pass validation but with HTML stripped
      expect(next).toHaveBeenCalled();
      expect(req.body.text).not.toContain('<script>');
    });
  });
});
