// *THIS ONE** pattern-queries-optimized.js
// CELESTE7 OPTIMIZED PATTERN QUERIES - VERCEL → LOCAL READY
// Built for: 100 beta users → 300 users → local hosting
// Every query <50ms with proper connection management

import pino from 'pino';
import { getPooler } from './vercel-connection-pooler.js';
import pLimit from 'p-limit';

const logger = pino({ name: 'pattern-queries-optimized' });

// ============================================
// BRUTALLY OPTIMIZED QUERY ENGINE
// ============================================

export class BrutalQueryOptimizer {
  constructor(supabase = null) {
    this.pooler = getPooler();
    this.supabase = supabase || this.pooler.getConnection();
    
    // Vercel limits vs Local limits
    this.concurrencyLimit = pLimit(process.env.VERCEL ? 3 : 5);
    this.cacheExpiry = process.env.VERCEL ? 30000 : 5000; // 30s on Vercel, 5s on local
    
    // Financial data cache (static, updates daily)
    this.financialComparisons = this.loadFinancialComparisons();
  }

  // ============================================
  // DETECT ALL PATTERNS WITH PROPER LIMITS
  // ============================================

  async detectAllPatternsBrutally(userId) {
    const start = Date.now();
    
    try {
      // Check cache first (30 second expiry on Vercel)
      const cached = await this.getCachedPatterns(userId);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        logger.debug({ userId, cacheAge: Date.now() - cached.timestamp }, 'Using cached patterns');
        return cached.data;
      }

      // Use connection pool queue
      if (process.env.VERCEL) {
        return await this.pooler.detectPatternsQueued(userId, this);
      }

      // Local hosting: run patterns with concurrency limit
      const patternFunctions = [
        () => this.detectProcrastinationBrutally(userId),
        () => this.detectPricingCowardiceBrutally(userId),
        () => this.detectExecutionParalysisBrutally(userId)
      ];

      // Only run top 3 patterns concurrently
      const patterns = await Promise.allSettled(
        patternFunctions.map(fn => this.concurrencyLimit(fn))
      );

      const totalTime = Date.now() - start;

      // Filter and sort valid patterns
      const detectedPatterns = patterns
        .filter(p => p.status === 'fulfilled' && p.value && p.value.confidence > 0.7)
        .map(p => p.value)
        .sort((a, b) => b.estimated_cost - a.estimated_cost);

      const result = {
        patterns: detectedPatterns,
        total_query_time_ms: totalTime,
        total_estimated_cost: detectedPatterns.reduce((sum, p) => sum + p.estimated_cost, 0),
        cached: false
      };

      // Cache results
      await this.cachePatterns(userId, result);

      // Log performance
      if (totalTime > 200) {
        logger.warn({ userId, totalTime, patternCount: detectedPatterns.length }, 'Slow pattern detection');
      }

      return result;

    } catch (error) {
      logger.error({ error, userId }, 'Pattern detection failed');
      
      // Return cached data on error
      const cached = await this.getCachedPatterns(userId);
      return cached?.data || { patterns: [], error: error.message };
    }
  }

  // ============================================
  // PROCRASTINATION WITH REAL NAMES
  // ============================================

  async detectProcrastinationBrutally(userId) {
    const start = Date.now();
    
    try {
      const { data, error } = await this.supabase.rpc('get_procrastination_metrics', { 
        p_user_id: userId 
      });

      if (error) throw error;

      const metrics = data || {};
      
      // Get anonymized competitor
      const competitor = await this.getAnonymizedCompetitor(userId, 1);
      
      const dailyBurn = await this.getDailyBurnRate(userId);
      const costOfBullshit = (metrics.total_delay_days || 0) * dailyBurn;

      const queryTime = Date.now() - start;

      return {
        pattern_type: 'procrastination',
        confidence: Math.min((metrics.total_delay_days || 0) / 30, 0.95),
        severity: metrics.total_delay_days > 60 ? 'critical' : 'high',
        evidence: {
          total_delay_days: metrics.total_delay_days || 0,
          oldest_task: metrics.oldest_task || 'unknown task',
          oldest_task_age_days: metrics.oldest_task_age || 0,
          daily_burn_rate: Math.round(dailyBurn)
        },
        estimated_cost: Math.round(costOfBullshit),
        query_time_ms: queryTime,
        specific_callout: `"${metrics.oldest_task || 'that task'}" delayed ${metrics.oldest_task_age || 0} days = $${Math.round((metrics.oldest_task_age || 0) * dailyBurn)} burned. ${competitor.name} shipped in ${competitor.days_to_ship || 7} days.`
      };

    } catch (error) {
      logger.error({ error, userId }, 'Procrastination detection failed');
      return null;
    }
  }

  // ============================================
  // PRICING COWARDICE WITH ANONYMIZED COMPETITORS
  // ============================================

  async detectPricingCowardiceBrutally(userId) {
    const start = Date.now();

    try {
      const { data, error } = await this.supabase.rpc('get_pricing_comparison', {
        p_user_id: userId
      });

      if (error) throw error;
      if (!data) return null;

      const gapPercent = ((data.market_average - data.your_price) / data.market_average) * 100;
      const monthlyLoss = (data.market_average - data.your_price) * data.customer_count;

      const queryTime = Date.now() - start;

      return {
        pattern_type: 'pricing_cowardice',
        confidence: Math.min(gapPercent / 50, 0.95),
        severity: gapPercent > 50 ? 'critical' : 'high',
        evidence: {
          your_price: Math.round(data.your_price),
          market_average: Math.round(data.market_average),
          gap_percent: Math.round(gapPercent),
          customer_count: data.customer_count,
          market_percentile: data.percentile_rank
        },
        estimated_cost: Math.round(monthlyLoss),
        query_time_ms: queryTime,
        specific_callout: `${data.top_competitor_name || 'Top competitor'} charges $${Math.round(data.top_competitor_price)}, makes $${Math.round(data.top_competitor_revenue)}/mo. You charge $${Math.round(data.your_price)}, make $${Math.round(data.your_revenue)}/mo.`
      };

    } catch (error) {
      logger.error({ error, userId }, 'Pricing detection failed');
      return null;
    }
  }

  // ============================================
  // EXECUTION PARALYSIS - SIMPLIFIED
  // ============================================

  async detectExecutionParalysisBrutally(userId) {
    const start = Date.now();

    try {
      const { data, error } = await this.supabase.rpc('get_execution_metrics', {
        p_user_id: userId
      });

      if (error) throw error;

      const metrics = data || {};
      const planToShipRatio = metrics.planning_count / (metrics.shipped_count || 1);

      const queryTime = Date.now() - start;

      if (planToShipRatio < 3) return null; // Not paralyzed

      return {
        pattern_type: 'execution_paralysis',
        confidence: Math.min(planToShipRatio / 10, 0.95),
        severity: metrics.days_since_ship > 60 ? 'critical' : 'high',
        evidence: {
          planned_but_not_started: metrics.planning_count || 0,
          projects_shipped: metrics.shipped_count || 0,
          planning_ratio: Math.round(planToShipRatio * 10) / 10,
          days_blocked: metrics.days_since_ship || 0,
          primary_blocker: metrics.most_common_blocker || 'fear'
        },
        estimated_cost: Math.round(metrics.opportunity_cost || 0),
        query_time_ms: queryTime,
        specific_callout: `${metrics.planning_count} plans, ${metrics.shipped_count} shipped. Blocked ${metrics.days_since_ship} days by "${metrics.most_common_blocker}".`
      };

    } catch (error) {
      logger.error({ error, userId }, 'Execution paralysis detection failed');
      return null;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  async getDailyBurnRate(userId) {
    try {
      const { data } = await this.supabase
        .from('user_business_context')
        .select('monthly_recurring_revenue')
        .eq('user_id', userId)
        .single();

      return (data?.monthly_recurring_revenue || 0) / 30 || 100; // Default $100/day
    } catch {
      return 100; // Default fallback
    }
  }

  async getAnonymizedCompetitor(userId, rank = 1) {
    // Use generic names for privacy
    const names = ['A competitor', 'Another founder', 'A peer', 'Someone in your space'];
    const defaultData = {
      name: names[rank - 1] || 'A competitor',
      days_to_ship: 7,
      revenue: 15000
    };

    try {
      const { data } = await this.supabase
        .from('mv_competitor_rankings')
        .select('monthly_recurring_revenue')
        .neq('user_id', userId)
        .order('monthly_recurring_revenue', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        defaultData.revenue = data.monthly_recurring_revenue;
      }
    } catch {
      // Use defaults
    }

    return defaultData;
  }

  async getCachedPatterns(userId) {
    try {
      const { data } = await this.supabase
        .from('pattern_cache')
        .select('cached_patterns, cached_at')
        .eq('user_id', userId)
        .single();

      if (data) {
        return {
          data: data.cached_patterns,
          timestamp: new Date(data.cached_at).getTime()
        };
      }
    } catch {
      // Cache miss is ok
    }
    return null;
  }

  async cachePatterns(userId, patterns) {
    try {
      await this.supabase
        .from('pattern_cache')
        .upsert({
          user_id: userId,
          cached_patterns: patterns,
          cached_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error({ error, userId }, 'Failed to cache patterns');
    }
  }

  loadFinancialComparisons() {
    // Static 2024 values for "what you could have bought"
    return {
      50000: 'Tesla Model 3',
      30000: 'year of private school',
      20000: 'family vacation home down payment',
      10000: '6 months of rent',
      5000: 'family vacation',
      2000: 'new laptop',
      1000: 'month of groceries'
    };
  }

  getWhatYouCouldHaveBought(amount) {
    for (const [threshold, item] of Object.entries(this.financialComparisons).sort((a, b) => b[0] - a[0])) {
      if (amount >= parseInt(threshold)) {
        return item;
      }
    }
    return 'nice dinner';
  }
}

// ============================================
// EXPORT FOR VERCEL AND LOCAL
// ============================================

export default BrutalQueryOptimizer;