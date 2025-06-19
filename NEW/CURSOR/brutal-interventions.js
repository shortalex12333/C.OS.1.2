// CELESTE7 BRUTAL INTERVENTION TEMPLATES
// These aren't suggestions. They're mirrors showing your failures.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ============================================
// ESCALATING DISCOMFORT ENGINE
// ============================================

export class BrutalInterventionGenerator {
  constructor() {
    this.resistanceLevels = {
      0: 'first_contact',
      1: 'gentle_nudge',
      2: 'uncomfortable_truth',
      3: 'brutal_reality',
      4: 'scorched_earth',
      5: 'existential_crisis'
    };
  }

  // Generate intervention based on resistance level
  async generateIntervention(pattern, evidence, userData, resistanceLevel = 0) {
    // Defensive check for required arguments
    if (!pattern || !evidence || !userData) {
      console.error('Missing required data in generateIntervention:', { pattern, evidence, userData });
      return {
        message: 'Insufficient data for intervention.',
        directive: 'Try again later or contact support.',
        severity: 'error'
      };
    }
    const level = this.resistanceLevels[Math.min(resistanceLevel, 5)];
    const generator = this.interventionGenerators[pattern.type]?.[level];
    
    if (!generator) {
      return this.defaultBrutalIntervention(pattern, evidence);
    }
    
    // Get comparison data for maximum pain
    const comparisonData = await this.getComparisonData(userData.userId, pattern.type);
    
    return generator(evidence, comparisonData, userData);
  }

  // Get data that will hurt the most
  async getComparisonData(userId, patternType) {
    // Get user's peers who broke through
    const { data: breakthroughs } = await supabase
      .from('user_breakthroughs')
      .select('user_id, revenue_after_breakthrough, time_to_breakthrough')
      .eq('pattern_broken', patternType)
      .order('revenue_after_breakthrough', { ascending: false })
      .limit(5);

    // Get user's historical excuses
    const { data: excuses } = await supabase
      .from('pattern_occurrences')
      .select('context')
      .eq('user_id', userId)
      .eq('pattern_type', 'excuse')
      .order('detected_at', { ascending: false })
      .limit(20);

    // Get competitors in same stage
    const { data: userContext } = await supabase
      .from('user_business_context')
      .select('business_type, business_stage')
      .eq('user_id', userId)
      .single();

    const { data: competitors } = await supabase
      .from('user_business_context')
      .select('user_id, monthly_recurring_revenue, created_at')
      .eq('business_type', userContext?.business_type)
      .eq('business_stage', userContext?.business_stage)
      .neq('user_id', userId)
      .gt('monthly_recurring_revenue', 0)
      .order('monthly_recurring_revenue', { ascending: false })
      .limit(10);

    return {
      breakthroughs,
      excuses: excuses?.map(e => e.context?.excuse_text).filter(Boolean),
      competitors,
      userContext
    };
  }

  // ============================================
  // PROCRASTINATION INTERVENTIONS
  // ============================================
  
  interventionGenerators = {
    procrastination: {
      first_contact: (evidence, comparison) => ({
        message: `Interesting. You've delayed ${evidence.oldest_task} for ${evidence.total_delay_days} days. That's $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)} in lost revenue.`,
        directive: `Ship something today. Anything. Even if it's shit.`,
        severity: 'warning'
      }),

      gentle_nudge: (evidence, comparison) => ({
        message: `${evidence.total_delay_days} days of "planning" = $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)} burned. Meanwhile, ${comparison.competitors?.[0]?.user_id || 'your competitor'} launched and made $${comparison.competitors?.[0]?.monthly_recurring_revenue || '10,000'}.`,
        directive: `Ship ${evidence.oldest_task} in next 2 hours or delete it forever.`,
        severity: 'warning'
      }),

      uncomfortable_truth: (evidence, comparison) => ({
        message: `You've said "${evidence.repeated_excuse}" ${evidence.excuse_count} times since ${evidence.first_excuse_date}. Total cost of your bullshit: $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)}. Your peers who stopped making excuses now average $${Math.round(comparison.breakthroughs?.[0]?.revenue_after_breakthrough || 25000)}/month.`,
        directive: `No more excuses. Ship TODAY or admit you're not an entrepreneur.`,
        severity: 'critical'
      }),

      brutal_reality: (evidence, comparison, userData) => ({
        message: `${evidence.total_delay_days} days wasted. $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)} lost. "${evidence.repeated_excuse}" used ${evidence.excuse_count} times. ${comparison.competitors?.length || 5} competitors passed you. You're still at $${userData.businessMetrics.current_mrr}/month after ${evidence.months_in_business} months. This isn't procrastination. It's fear of finding out you're mediocre.`,
        directive: `Ship in 60 minutes or quit. No middle ground.`,
        severity: 'critical'
      }),

      scorched_earth: (evidence, comparison, userData) => ({
        message: `FACT: ${evidence.total_delay_days} days of hiding. FACT: $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)} evaporated. FACT: "${evidence.repeated_excuse}" is your favorite lie (said ${evidence.excuse_count} times). FACT: Sarah started after you and makes $${comparison.competitors?.[0]?.monthly_recurring_revenue || 50000}/month. FACT: You're at $${userData.businessMetrics.current_mrr}. You're not procrastinating. You're dying slowly.`,
        directive: `Ship NOW or delete everything and get a job.`,
        severity: 'emergency'
      }),

      existential_crisis: (evidence, comparison, userData) => ({
        message: `${evidence.months_in_business} months. ${evidence.total_delay_days} days delayed. $${Math.round(evidence.total_delay_days * evidence.daily_burn_rate)} destroyed. ${evidence.excuse_count} excuses. ${comparison.competitors?.filter(c => c.monthly_recurring_revenue > userData.businessMetrics.current_mrr).length} people who started after you make more. You're not building a business. You're playing entrepreneur. Your children will inherit your excuses, not wealth.`,
        directive: `This is your last chance. Ship or surrender.`,
        severity: 'emergency'
      })
    },

    // ============================================
    // PRICING COWARDICE INTERVENTIONS  
    // ============================================

    pricing_cowardice: {
      first_contact: (evidence, comparison) => ({
        message: `You charge $${evidence.your_price}. Market average: $${evidence.market_average}. You're leaving $${Math.round(evidence.monthly_loss)} on the table every month.`,
        directive: `Raise prices 20% today. See who actually values your work.`,
        severity: 'warning'
      }),

      gentle_nudge: (evidence, comparison) => ({
        message: `Your $${evidence.your_price} vs market $${evidence.market_average}. Gap: ${evidence.gap_percent}%. Monthly loss: $${Math.round(evidence.monthly_loss)}. Annual loss: $${Math.round(evidence.monthly_loss * 12)}. That's a Tesla you're not driving.`,
        directive: `New price: $${Math.round(evidence.market_average * 1.1)}. Implement before midnight.`,
        severity: 'warning'
      }),

      uncomfortable_truth: (evidence, comparison) => ({
        message: `You've been undercharging for ${evidence.months_underpriced} months. Total revenue lost: $${Math.round(evidence.monthly_loss * evidence.months_underpriced)}. ${comparison.competitors?.[0]?.user_id || 'Your competitor'} charges ${evidence.competitor_multiple}x more for the SAME thing. Your customers think you're cheap because you act cheap.`,
        directive: `Double your prices NOW. Lose the cheap clients. Win.`,
        severity: 'critical'
      }),

      brutal_reality: (evidence, comparison, userData) => ({
        message: `MATH: You charge $${evidence.your_price}. They charge $${evidence.market_average}. You lost $${Math.round(evidence.monthly_loss * evidence.months_underpriced)} being a coward. With market pricing, you'd have $${Math.round((userData.businessMetrics.current_mrr + evidence.monthly_loss) * evidence.months_underpriced)}. Instead you have $${userData.businessMetrics.current_mrr}. Poverty is a choice. You chose it.`,
        directive: `3x your prices or admit you don't believe in your value.`,
        severity: 'critical'
      }),

      scorched_earth: (evidence, comparison, userData) => ({
        message: `${evidence.months_underpriced} months of cowardice = $${Math.round(evidence.monthly_loss * evidence.months_underpriced)} in the trash. You charge $${evidence.your_price} because you're scared. They charge $${evidence.market_average} because they're not. Your bank account: $${userData.businessMetrics.current_mrr}/month. Theirs: $${comparison.competitors?.[0]?.monthly_recurring_revenue || 75000}/month. You're not "building trust" or "gaining experience." You're teaching the market you're worthless.`,
        directive: `5x your prices TODAY. Fire anyone who complains.`,
        severity: 'emergency'
      }),

      existential_crisis: (evidence, comparison, userData) => ({
        message: `Lifetime underpricing loss: $${Math.round(evidence.monthly_loss * evidence.months_underpriced)}. That's ${Math.round((evidence.monthly_loss * evidence.months_underpriced) / evidence.your_price)} sales you did FOR FREE. Your competitors buy houses. You explain why you're "affordable." Your fear of rejection cost more than college tuition. Your children will learn that daddy was too scared to ask for money. This is your legacy: Cheap.`,
        directive: `10x prices or close the business. No negotiation.`,
        severity: 'emergency'
      })
    },

    // ============================================
    // EXECUTION PARALYSIS INTERVENTIONS
    // ============================================

    execution_paralysis: {
      first_contact: (evidence, comparison) => ({
        message: `${evidence.planned_but_not_started} projects planned. ${evidence.projects_shipped} shipped. Planning-to-execution ratio: ${evidence.planning_ratio}:1. You're a professional planner.`,
        directive: `Cancel all planning. Ship one thing today.`,
        severity: 'warning'
      }),

      gentle_nudge: (evidence, comparison) => ({
        message: `You've been "researching" for ${evidence.days_blocked} days. ${comparison.competitors?.length || 3} competitors launched while you theorized. They have customers. You have Notion docs.`,
        directive: `Stop planning. Start shipping. 4 hour deadline.`,
        severity: 'warning'
      }),

      uncomfortable_truth: (evidence, comparison) => ({
        message: `${evidence.planned_but_not_started} plans. Zero execution. ${evidence.days_blocked} days paralyzed by "${evidence.primary_blocker}". Meanwhile, ${comparison.breakthroughs?.length || 5} people with your exact blocker broke through and now average $${Math.round(comparison.breakthroughs?.[0]?.revenue_after_breakthrough || 30000)}/month. Your paralysis is a choice.`,
        directive: `Ship ANYTHING in next hour or admit you're addicted to planning.`,
        severity: 'critical'
      }),

      brutal_reality: (evidence, comparison, userData) => ({
        message: `SCOREBOARD: You: ${evidence.projects_shipped} shipped, ${evidence.planned_but_not_started} planned. Them: ${evidence.competitor_shipped_count} shipped. You've been "blocked" by "${evidence.primary_blocker}" for ${evidence.days_blocked} days. Cost: $${Math.round(evidence.days_blocked * userData.businessMetrics.daily_burn_rate)}. You don't have execution paralysis. You have success phobia.`,
        directive: `Delete all plans. Ship raw. Now.`,
        severity: 'critical'
      }),

      scorched_earth: (evidence, comparison, userData) => ({
        message: `${evidence.months_planning} months of "strategy." ${evidence.planned_but_not_started} beautiful plans. ${evidence.projects_shipped} shipped (aka ZERO). Total masturbation time: ${evidence.total_planning_hours} hours. Competitors shipped ${evidence.competitor_shipped_count} products and made $${comparison.competitors?.[0]?.monthly_recurring_revenue || 100000} while you perfected your roadmap. You're not a perfectionist. You're a coward with a planning addiction.`,
        directive: `Ship trash in 30 minutes or quit forever.`,
        severity: 'emergency'
      }),

      existential_crisis: (evidence, comparison, userData) => ({
        message: `You've planned ${evidence.planned_but_not_started} projects over ${evidence.months_planning} months. Shipped: ${evidence.projects_shipped}. Hours wasted: ${evidence.total_planning_hours}. Money lost: $${Math.round(evidence.total_opportunity_cost)}. Your peers shipped ${evidence.competitor_shipped_count} products. They drive Teslas. You drive a 2012 Honda and tell people you're "pre-launch." Your gravestone will read: "Had great ideas."`,
        directive: `Ship NOW or accept you'll die with potential.`,
        severity: 'emergency'
      })
    },

    // ============================================
    // COMPETITIVE DELUSION INTERVENTIONS
    // ============================================

    competitive_delusion: {
      first_contact: (evidence, comparison) => ({
        message: `Reality check: You're #${evidence.your_rank} of ${evidence.total_competitors} in your market. Bottom ${evidence.percentile}%.`,
        directive: `Study #1. Copy exactly. No creativity allowed.`,
        severity: 'warning'
      }),

      gentle_nudge: (evidence, comparison) => ({
        message: `You: $${evidence.your_revenue}/month, Rank #${evidence.your_rank}. Top performer: $${evidence.top_performer_revenue}/month. Gap: $${evidence.revenue_gap}. You're not "different." You're losing.`,
        directive: `Copy top 3 competitors' exact model TODAY.`,
        severity: 'warning'
      }),

      uncomfortable_truth: (evidence, comparison) => ({
        message: `Ranked #${evidence.your_rank} of ${evidence.total_competitors}. Bottom ${evidence.percentile}%. Revenue gap to average: $${evidence.revenue_gap}. While you "innovate," ${comparison.competitors?.slice(0,3).length || 3} competitors using basic strategies make ${evidence.multiple}x more. Your uniqueness is why you're poor.`,
        directive: `Delete your "innovative" approach. Copy winners verbatim.`,
        severity: 'critical'
      }),

      brutal_reality: (evidence, comparison, userData) => ({
        message: `THE LEAGUE TABLE: You're #${evidence.your_rank} of ${evidence.total_competitors}. Dead last ${evidence.percentile}%. You make $${userData.businessMetrics.current_mrr}. #1 makes $${evidence.top_performer_revenue}. That's ${Math.round(evidence.top_performer_revenue / (userData.businessMetrics.current_mrr || 1))}x more. They work 40 hours/week. You work 80 and earn less than minimum wage. You're not an entrepreneur. You're an expensive hobby.`,
        directive: `Steal everything from #1 or get a job.`,
        severity: 'critical'
      }),

      scorched_earth: (evidence, comparison, userData) => ({
        message: `BRUTAL FACTS: Rank #${evidence.your_rank}/${evidence.total_competitors}. Income: $${userData.businessMetrics.current_mrr}. Industry average: $${evidence.industry_average}. You're ${evidence.percentile_below_average}% below average. The janitor at your competitor makes more than you. Your "vision" is why you're broke. Your "different approach" is why you'll stay broke. Even MLMs would reject you.`,
        directive: `Copy #1 exactly or admit defeat. 24 hours.`,
        severity: 'emergency'
      }),

      existential_crisis: (evidence, comparison, userData) => ({
        message: `${evidence.years_in_business} years. Rank: #${evidence.your_rank} of ${evidence.total_competitors}. Still bottom ${evidence.percentile}%. Total earned: $${evidence.lifetime_revenue}. McDonald's workers earned $${evidence.minimum_wage_equivalent} in same period. Your parents lie about what you do. Your spouse secretly wants you to quit. Your kids think you're unemployed. This isn't entrepreneurship. It's elaborate unemployment.`,
        directive: `Copy #1 or update LinkedIn to "seeking opportunities."`,
        severity: 'emergency'
      })
    },

    // ============================================
    // REVENUE STAGNATION INTERVENTIONS
    // ============================================

    revenue_stagnation: {
      first_contact: (evidence, comparison) => ({
        message: `Revenue flat for ${evidence.months_stagnant} months at $${evidence.current_revenue}. In a growing market, flat is dying.`,
        directive: `Launch new offer at 2x price this week.`,
        severity: 'warning'
      }),

      gentle_nudge: (evidence, comparison) => ({
        message: `${evidence.months_stagnant} months at $${evidence.current_revenue}. Should be $${evidence.expected_revenue} with normal 10% growth. Missing: $${evidence.growth_gap}. You're slowly drowning.`,
        directive: `New product. New price. 48 hours.`,
        severity: 'warning'
      }),

      uncomfortable_truth: (evidence, comparison) => ({
        message: `Stagnant ${evidence.months_stagnant} months. Stuck at $${evidence.current_revenue}. Peak was $${evidence.peak_revenue} (${evidence.months_since_peak} months ago). You're not "stable." You're dying in slow motion. ${comparison.competitors?.filter(c => c.monthly_recurring_revenue > evidence.current_revenue).length || 5} competitors passed you while you "maintained."`,
        directive: `Triple prices or launch new product in 24 hours.`,
        severity: 'critical'
      }),

      brutal_reality: (evidence, comparison, userData) => ({
        message: `${evidence.months_stagnant} months flatlined at $${evidence.current_revenue}. With 10% monthly growth, you'd have $${evidence.potential_revenue}. You lost $${evidence.total_opportunity_cost} to laziness. Your competitors grew ${evidence.competitor_growth_rate}% while you celebrated "consistency." Inflation ate 15% of your revenue. You're not stable. You're decomposing.`,
        directive: `5x price increase or new $10k offer TODAY.`,
        severity: 'critical'
      }),

      scorched_earth: (evidence, comparison, userData) => ({
        message: `DEATH SPIRAL: ${evidence.months_stagnant} months at $${evidence.current_revenue}. That's ${evidence.years_stagnant} YEARS of zero growth. Opportunity cost: $${evidence.total_opportunity_cost}. Current trajectory: Bankrupt in ${evidence.months_to_bankruptcy} months. Your business has cancer. You're managing decline, not growth. Your tombstone: "Maintained $${evidence.current_revenue}/month until death."`,
        directive: `Burn it down and rebuild or shut down with dignity.`,
        severity: 'emergency'
      }),

      existential_crisis: (evidence, comparison, userData) => ({
        message: `${evidence.years_stagnant} years stagnant. Same $${evidence.current_revenue}/month since ${evidence.stagnation_start_date}. Total growth: 0%. Inflation-adjusted revenue: $${evidence.inflation_adjusted_revenue} (you're 30% poorer). Peers who started after you: $${evidence.peer_average_revenue}/month. You didn't build a business. You built a life-support system for your ego. Your legacy: Mediocrity with good excuses.`,
        directive: `10x everything or pull the plug. This is mercy.`,
        severity: 'emergency'
      })
    }
  };

  // Default brutal intervention for unknown patterns
  defaultBrutalIntervention(pattern, evidence) {
    return {
      message: `Unrecognized pattern but the data is clear: You're failing. ${JSON.stringify(evidence)}. Stop hiding behind complexity.`,
      directive: `Fix this TODAY or quit.`,
      severity: 'critical'
    };
  }

  // Track user resistance and escalate accordingly
  async trackResistance(userId, interventionId, userResponse) {
    const resistanceMarkers = [
      'but', 'however', 'yes but', "can't", 'impossible',
      'maybe later', 'not ready', 'need to think',
      'too aggressive', 'too harsh', 'unfair'
    ];

    const resistanceScore = resistanceMarkers.reduce((score, marker) => {
      return score + (userResponse.toLowerCase().includes(marker) ? 1 : 0);
    }, 0);

    // Get current resistance level
    const { data: currentLevel } = await supabase
      .from('user_patterns')
      .select('pattern_data')
      .eq('user_id', userId)
      .eq('pattern_type', 'intervention_resistance')
      .single();

    const newLevel = (currentLevel?.pattern_data?.level || 0) + (resistanceScore > 2 ? 1 : 0);

    // Update resistance level
    await supabase
      .from('user_patterns')
      .upsert({
        user_id: userId,
        pattern_type: 'intervention_resistance',
        pattern_data: {
          level: Math.min(newLevel, 5),
          last_escalation: new Date().toISOString(),
          intervention_id: interventionId
        },
        confidence: 0.9,
        last_observed: new Date().toISOString()
      });

    return newLevel;
  }
}

// ============================================
// A/B TESTING FOR INTERVENTION STYLES
// ============================================

export class InterventionABTester {
  constructor() {
    this.styles = [
      'brutal_numbers',    // Pure data, no emotion
      'personal_attack',   // Attack their identity
      'peer_comparison',   // Compare to specific people
      'future_projection', // Show where they'll end up
      'legacy_destroyer',  // What they'll leave behind
      'public_shame'      // How others see them
    ];
  }

  async selectInterventionStyle(userId, pattern) {
    // Get historical effectiveness
    const { data: history } = await supabase
      .from('intervention_effectiveness')
      .select('delivery_style, effectiveness_score, led_to_breakthrough')
      .eq('user_id', userId)
      .eq('intervention_type', pattern.type)
      .order('effectiveness_score', { ascending: false });

    if (history && history.length > 0) {
      // Use most effective style 70% of the time
      if (Math.random() < 0.7) {
        return history[0].delivery_style;
      }
    }

    // Otherwise, random selection for testing
    return this.styles[Math.floor(Math.random() * this.styles.length)];
  }

  async generateStyledIntervention(style, pattern, evidence, comparison) {
    const generators = {
      brutal_numbers: () => ({
        message: `Numbers: ${Object.entries(evidence).map(([k,v]) => `${k}: ${v}`).join('. ')}. Math doesn't lie. You do.`,
        directive: `Fix the numbers or face bankruptcy.`
      }),

      personal_attack: () => ({
        message: `This isn't about business. It's about you being too weak to succeed. ${evidence.primary_failure} proves it.`,
        directive: `Prove me wrong in 24 hours or prove me right forever.`
      }),

      peer_comparison: () => ({
        message: `Sarah: $${comparison.competitors?.[0]?.monthly_recurring_revenue || 50000}/mo. Tom: $${comparison.competitors?.[1]?.monthly_recurring_revenue || 45000}/mo. You: $${evidence.your_revenue}/mo. They started after you. The difference? They ship. You hide.`,
        directive: `Match Sarah's revenue or admit inferiority.`
      }),

      future_projection: () => ({
        message: `Current trajectory: Broke in ${evidence.months_to_failure || 12} months. Age 65: Still working, no retirement. Your kids: "Dad tried but failed." Worth it?`,
        directive: `Change trajectory TODAY or accept this future.`
      }),

      legacy_destroyer: () => ({
        message: `Your legacy: "${evidence.repeated_excuse}" said ${evidence.excuse_count} times. Revenue: $${evidence.total_earned}. Impact: Zero. Remembered by: Nobody. This is what ${evidence.years_wasted} years built.`,
        directive: `Build something real or delete everything.`
      }),

      public_shame: () => ({
        message: `Your network knows you're failing. They see $${evidence.your_revenue}/mo while claiming "entrepreneur." They pity you at parties. Your LinkedIn is fiction. Everyone knows.`,
        directive: `Earn respect with results or hide forever.`
      })
    };

    const generator = generators[style] || generators.brutal_numbers;
    return generator();
  }
}

// ============================================
// EXPORT THE BRUTALITY
// ============================================

export default {
  BrutalInterventionGenerator,
  InterventionABTester
};

// ============================================
// INTEGRATION EXAMPLE
// ============================================

/*
// In your main engine:
import { BrutalInterventionGenerator, InterventionABTester } from './brutal-interventions.js';

const interventionGen = new BrutalInterventionGenerator();
const abTester = new InterventionABTester();

// Generate intervention based on resistance
const resistanceLevel = await interventionGen.trackResistance(userId, lastInterventionId, userResponse);
const style = await abTester.selectInterventionStyle(userId, pattern);

const intervention = await interventionGen.generateIntervention(
  pattern,
  evidence,
  userData,
  resistanceLevel
);

// Or use styled intervention
const styledIntervention = await abTester.generateStyledIntervention(
  style,
  pattern,
  evidence,
  comparisonData
);
*/