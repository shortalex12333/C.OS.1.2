// api/analyze.js
// CELESTE7 ANALYZE API ENDPOINT - BUILT FOR N8N INTEGRATION
// Handles pattern detection with <200ms response times

import { createClient } from '@supabase/supabase-js';
import { HfInference } from '@huggingface/inference';
import { RealTimeBehavioralIntelligence } from '../celeste7-real-engine.js';
import { BrutalInterventionGenerator } from '../brutal-interventions.js';
import { BrutalQueryOptimizer } from '../pattern-queries-optimized.js';
import applyCorsMiddleware from '../middleware/cors.js';
import { createRateLimitMiddleware } from '../rate-limiter.js';

// Rate limiters
const rateLimiters = {
  global: createRateLimitMiddleware('global'),
  perUser: createRateLimitMiddleware('perUser')
};

// ============================================
// INITIALIZATION WITH CIRCUIT BREAKERS
// ============================================

const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    retries: 3,
    timeout: 5000
  },
  huggingface: {
    key: process.env.HUGGINGFACE_API_KEY,
    timeout: 3000
  },
  cache: {
    ttl: 30,
    maxSize: 1000
  }
};

// Circuit breaker state
const circuitBreakers = {
  supabase: { failures: 0, lastFailure: null, isOpen: false },
  huggingface: { failures: 0, lastFailure: null, isOpen: false }
};

// Initialize services with fallbacks
let supabase, hf, intelligence, queryOptimizer, interventionGenerator;

try {
  supabase = createClient(config.supabase.url, config.supabase.key, {
    auth: { persistSession: false },
    realtime: { enabled: false }
  });
  
  hf = new HfInference(config.huggingface.key);
  intelligence = new RealTimeBehavioralIntelligence();
  queryOptimizer = new BrutalQueryOptimizer(supabase);
  interventionGenerator = new BrutalInterventionGenerator();
  
} catch (error) {
  console.error('Service initialization failed:', error);
}

// ============================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================

async function withCircuitBreaker(service, operation, fallback) {
  const breaker = circuitBreakers[service];
  
  // Check if circuit is open
  if (breaker.isOpen) {
    const timeSinceFailure = Date.now() - breaker.lastFailure;
    if (timeSinceFailure < 30000) { // 30 second cooldown
      console.warn(`Circuit breaker OPEN for ${service}`);
      return fallback ? fallback() : null;
    }
    // Try to close circuit
    breaker.isOpen = false;
  }
  
  try {
    const result = await operation();
    breaker.failures = 0; // Reset on success
    return result;
  } catch (error) {
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= 3) {
      breaker.isOpen = true;
      console.error(`Circuit breaker OPENED for ${service} after ${breaker.failures} failures`);
    }
    
    if (fallback) {
      return fallback();
    }
    throw error;
  }
}

// ============================================
// MAIN ANALYSIS WITH BRUTAL INTERVENTIONS
// ============================================

async function handleAnalyze(req, res) {
  const startTime = Date.now();
  
  try {
    const { userId, message, sessionId } = req.body;
    
    // Validate input
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, message'
      });
    }
    
    // **BRUTAL INTERVENTIONS INTEGRATION**
    // 1. Detect patterns using optimized queries
    const patterns = await queryOptimizer.detectAllPatternsBrutally(userId);
    
    let intervention = null;
    if (patterns.patterns && patterns.patterns.length > 0) {
      const criticalPattern = patterns.patterns.find(p => p.severity === 'critical');
      
      if (criticalPattern) {
        // 2. Get user's resistance level for escalation
        const resistanceLevel = await getUserResistanceLevel(userId);
        
        // 3. Generate brutal intervention using THE CROWN JEWEL
        intervention = await interventionGenerator.generateIntervention(
          criticalPattern,           // Pattern detected
          criticalPattern.evidence,  // Real financial data
          { userId, currentMessage: message }, // User context
          resistanceLevel           // Escalation level
        );
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    // Log slow requests
    if (processingTime > 500) {
      console.warn(`Slow request: ${processingTime}ms for user ${userId}`);
    }
    
    return res.status(200).json({
      success: true,
      patterns: patterns.patterns || [],
      intervention,
      confidence: patterns.patterns?.[0]?.confidence || 0,
      should_intervene: !!intervention,
      processing_time_ms: processingTime,
      cached: patterns.cached || false
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: 'The oracle is temporarily overwhelmed. Try again.',
      processing_time_ms: processingTime
    });
  }
}

async function getUserResistanceLevel(userId) {
  try {
    // Simple in-memory resistance tracking for API endpoint
    const { data } = await supabase
      .from('user_patterns')
      .select('pattern_data')
      .eq('user_id', userId)
      .eq('pattern_type', 'intervention_resistance')
      .single();
    
    return data?.pattern_data?.level || 0;
  } catch {
    return 0; // Default to gentle start
  }
}

async function handleTrackOutcome(req, res) {
  try {
    const { tracking_id, outcome } = req.body;
    
    if (!tracking_id || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tracking_id, outcome'
      });
    }
    
    // Store outcome
    await withCircuitBreaker('supabase',
      async () => {
        await supabase.from('intervention_effectiveness').insert({
          tracking_id,
          ...outcome,
          analyzed_at: new Date().toISOString()
        });
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Outcome tracked successfully'
    });
    
  } catch (error) {
    console.error('Tracking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track outcome'
    });
  }
}

async function handleGetPatterns(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing userId parameter'
      });
    }
    
    const patterns = await withCircuitBreaker('supabase',
      async () => {
        const { data } = await supabase
          .from('user_patterns')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        return data;
      },
      () => []
    );
    
    return res.status(200).json({
      success: true,
      patterns,
      count: patterns.length
    });
    
  } catch (error) {
    console.error('Get patterns error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns'
    });
  }
}

// ============================================
// MAIN HANDLER WITH ROUTING
// ============================================

export default async function handler(req, res) {
  // Apply CORS
  await applyCorsMiddleware(req, res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apply rate limiting
  try {
    await rateLimiters.global(req, res, () => {});
    if (req.body?.userId) {
      await rateLimiters.perUser(req, res, () => {});
    }
  } catch (err) {
    return; // Rate limiter already sent response
  }
  
  // Route based on path and method
  const path = req.url.split('?')[0];
  
  if (path === '/api/analyze' && req.method === 'POST') {
    return handleAnalyze(req, res);
  }
  
  if (path === '/api/track-outcome' && req.method === 'POST') {
    return handleTrackOutcome(req, res);
  }
  
  if (path.startsWith('/api/patterns/') && req.method === 'GET') {
    return handleGetPatterns(req, res);
  }
  
  // 404 for unmatched routes
  return res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
}

// ============================================
// HEALTH CHECK EXPORT
// ============================================

export function getServiceHealth() {
  return {
    supabase: !circuitBreakers.supabase.isOpen,
    huggingface: !circuitBreakers.huggingface.isOpen,
    brutal_interventions: !!interventionGenerator,
    query_optimizer: !!queryOptimizer,
    memory: process.memoryUsage().heapUsed / 1024 / 1024 < 400
  };
}