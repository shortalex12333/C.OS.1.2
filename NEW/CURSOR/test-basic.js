// FILE: test-basic.js
// MVP TESTS FOR 3 PATTERNS
// Run: npm test

import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { performance } from 'perf_hooks';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const MAX_RESPONSE_TIME = 200; // ms - HARD LIMIT

// ============================================
// PATTERN-SPECIFIC TESTS
// ============================================

describe('Pattern Detection - MVP', () => {
  
  // PROCRASTINATION PATTERN
  it('should detect PROCRASTINATION pattern', async () => {
    const start = performance.now();
    
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_proc_001',
        message: 'I will launch tomorrow when everything is perfect',
        sessionId: 'test_session_001'
      })
      .expect(200);

    const responseTime = performance.now() - start;
    
    // Response time check
    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    
    // Pattern detection
    expect(response.body.success).toBe(true);
    expect(response.body.patterns).toBeDefined();
    expect(response.body.patterns.length).toBeGreaterThan(0);
    
    const procPattern = response.body.patterns.find(p => p.type === 'procrastination');
    expect(procPattern).toBeDefined();
    expect(procPattern.confidence).toBeGreaterThan(0.8);
    
    console.log(`✅ Procrastination: ${Math.round(responseTime)}ms, confidence: ${procPattern.confidence}`);
  });

  // PRICING PATTERN  
  it('should detect PRICING pattern', async () => {
    const start = performance.now();
    
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_price_001',
        message: 'Who am I to charge $99 when others charge $9',
        sessionId: 'test_session_002'
      })
      .expect(200);

    const responseTime = performance.now() - start;
    
    // Response time check
    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    
    // Pattern detection
    const pricingPattern = response.body.patterns.find(p => p.type === 'pricing');
    expect(pricingPattern).toBeDefined();
    expect(pricingPattern.confidence).toBeGreaterThan(0.75);
    
    console.log(`✅ Pricing: ${Math.round(responseTime)}ms, confidence: ${pricingPattern.confidence}`);
  });

  // EXECUTION PATTERN
  it('should detect EXECUTION pattern', async () => {
    const start = performance.now();
    
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_exec_001',
        message: 'I have been researching competitors for 3 months now',
        sessionId: 'test_session_003'
      })
      .expect(200);

    const responseTime = performance.now() - start;
    
    // Response time check
    expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    
    // Pattern detection
    const execPattern = response.body.patterns.find(p => p.type === 'execution');
    expect(execPattern).toBeDefined();
    expect(execPattern.confidence).toBeGreaterThan(0.72);
    
    console.log(`✅ Execution: ${Math.round(responseTime)}ms, confidence: ${execPattern.confidence}`);
  });
});

// ============================================
// INTERVENTION QUALITY VALIDATION
// ============================================

describe('Intervention Quality', () => {
  
  it('should generate interventions with REAL NUMBERS', async () => {
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_numbers_001',
        message: 'I keep procrastinating on my launch',
        sessionId: 'test_session_004'
      })
      .expect(200);

    if (response.body.intervention) {
      const intervention = response.body.intervention.intervention;
      
      // Must contain numbers
      const hasNumbers = /\d+/.test(intervention);
      expect(hasNumbers).toBe(true);
      
      // Must contain currency OR time OR percentage
      const hasContext = /\$|days?|months?|years?|%|hours?|minutes?/.test(intervention);
      expect(hasContext).toBe(true);
      
      console.log(`✅ Numbers found: ${intervention.match(/\d+/g)?.join(', ')}`);
    }
  });

  it('should NOT contain generic phrases', async () => {
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_generic_001',
        message: 'Maybe I should lower my prices',
        sessionId: 'test_session_005'
      })
      .expect(200);

    if (response.body.intervention) {
      const intervention = response.body.intervention.intervention.toLowerCase();
      
      const genericPhrases = ['you should', 'try to', 'consider', 'maybe', 'perhaps'];
      const foundGeneric = genericPhrases.filter(phrase => intervention.includes(phrase));
      
      expect(foundGeneric.length).toBe(0);
      
      console.log(`✅ No generic phrases found`);
    }
  });

  it('should include competitor/comparison data', async () => {
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: 'test_competitor_001',
        message: 'I have been analyzing the market for too long',
        sessionId: 'test_session_006'
      })
      .expect(200);

    if (response.body.intervention) {
      const intervention = response.body.intervention.intervention.toLowerCase();
      
      const hasComparison = /competitor|others|peers|they|everyone|ahead|behind|vs|while you/.test(intervention);
      expect(hasComparison).toBe(true);
      
      console.log(`✅ Competitor comparison included`);
    }
  });
});

// ============================================
// N8N INTEGRATION TEST
// ============================================

describe('N8N Integration', () => {
  
  it('should handle N8N webhook format', async () => {
    const start = performance.now();
    
    const response = await request(API_URL)
      .post('/api/analyze')
      .set('User-Agent', 'n8n-webhook')
      .send({
        userId: 'n8n_test_001',
        message: 'I will do it tomorrow for sure',
        sessionId: 'n8n_session_001'
      })
      .expect(200);

    const responseTime = performance.now() - start;
    
    // Must respond under 5s for n8n timeout
    expect(responseTime).toBeLessThan(5000);
    
    // Must have n8n-compatible format
    expect(response.body.success).toBe(true);
    expect(response.body.patterns).toBeDefined();
    expect(response.body.processing_time_ms).toBeDefined();
    
    if (response.body.intervention) {
      expect(response.body.should_intervene).toBe(true);
      expect(response.body.intervention.tracking_id).toBeDefined();
    }
    
    console.log(`✅ N8N webhook: ${Math.round(responseTime)}ms`);
  });
});

// ============================================
// LOAD TEST - 100 CONCURRENT USERS
// ============================================

describe('Performance - 100 Users', () => {
  
  it('should handle 100 concurrent requests under 200ms avg', async () => {
    const userCount = 100;
    const startTime = performance.now();
    
    console.log(`🔥 Testing ${userCount} concurrent users...`);
    
    const requests = Array.from({ length: userCount }, (_, i) =>
      request(API_URL)
        .post('/api/analyze')
        .send({
          userId: `load_test_${i}`,
          message: `I have been procrastinating for ${i + 1} days`,
          sessionId: `load_session_${i}`
        })
    );

    const results = await Promise.all(requests);
    const totalTime = performance.now() - startTime;
    
    const successful = results.filter(r => r.status === 200);
    const avgResponseTime = totalTime / userCount;
    
    // Performance requirements
    expect(successful.length).toBeGreaterThan(userCount * 0.99); // >99% success
    expect(avgResponseTime).toBeLessThan(MAX_RESPONSE_TIME);
    
    console.log(`✅ ${successful.length}/${userCount} successful (${Math.round(avgResponseTime)}ms avg)`);
  }, 30000); // 30s timeout for load test
});

// ============================================
// HEALTH & ERROR HANDLING
// ============================================

describe('System Health', () => {
  
  it('should respond to health check', async () => {
    const response = await request(API_URL)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.health_score).toBeGreaterThan(90);
  });

  it('should handle malformed requests', async () => {
    const response = await request(API_URL)
      .post('/api/analyze')
      .send({
        userId: null,
        message: null
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});

// ============================================
// OUTCOME TRACKING
// ============================================

describe('Tracking', () => {
  
  it('should track intervention outcomes', async () => {
    const response = await request(API_URL)
      .post('/api/track-outcome')
      .send({
        tracking_id: 'test_tracking_123',
        outcome: {
          action_taken: true,
          revenue_impact: 500,
          sentiment: 'positive'
        }
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});