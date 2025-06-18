// CELESTE7 Behavioral Intelligence Engine
// This is the brain of your system - deploy to Vercel/Railway/Render

// ============================================
// 1. PATTERN DETECTION ENGINE
// ============================================

class BehavioralPatternEngine {
  constructor() {
    // Pattern definitions with multi-dimensional triggers
    this.patterns = {
      procrastination: {
        linguistic_markers: [
          'later', 'tomorrow', 'next week', 'when i', 'should i',
          'thinking about', 'planning to', 'going to', 'will do'
        ],
        semantic_patterns: [
          'delaying action', 'avoiding commitment', 'future tense without specifics'
        ],
        contextual_triggers: {
          message_frequency: 'decreasing',
          task_completion_rate: '<0.3',
          time_since_last_action: '>72h'
        },
        severity_indicators: {
          high: ['months', 'eventually', 'someday', 'been meaning to'],
          medium: ['next week', 'soon', 'later today'],
          low: ['tomorrow', 'this afternoon', 'in a bit']
        }
      },
      
      planning_paralysis: {
        linguistic_markers: [
          'plan', 'strategy', 'roadmap', 'framework', 'structure',
          'organize', 'blueprint', 'system', 'process'
        ],
        semantic_patterns: [
          'excessive planning', 'analysis without action', 'perfectionist planning'
        ],
        contextual_triggers: {
          plans_created_this_week: '>2',
          execution_rate: '<0.2',
          planning_to_action_ratio: '>5:1'
        },
        severity_indicators: {
          high: ['another plan', 'revise my strategy', 'start over'],
          medium: ['need to map out', 'figure out the best'],
          low: ['quick plan', 'rough outline']
        }
      },
      
      perfectionism: {
        linguistic_markers: [
          'perfect', 'ready', 'polished', 'complete', 'finished',
          'good enough', 'quality', 'professional', 'right way'
        ],
        semantic_patterns: [
          'unrealistic standards', 'fear of judgment', 'endless refinement'
        ],
        contextual_triggers: {
          revision_count: '>5',
          time_on_single_task: '>2weeks',
          launch_delay_count: '>0'
        },
        severity_indicators: {
          high: ['not ready yet', 'needs more work', 'almost perfect'],
          medium: ['could be better', 'few more tweaks'],
          low: ['want it to be good', 'quality matters']
        }
      },
      
      pricing_anxiety: {
        linguistic_markers: [
          'price', 'charge', 'worth', 'value', 'cost', 'expensive',
          'afford', 'budget', 'rate', 'fee'
        ],
        semantic_patterns: [
          'undervaluing services', 'fear of rejection', 'imposter pricing'
        ],
        contextual_triggers: {
          current_mrr: '<5000',
          price_changes_last_30d: '0',
          competitor_mentions: '>2'
        },
        severity_indicators: {
          high: ['too expensive', 'no one will pay', 'should I charge less'],
          medium: ['competitive pricing', 'market rate', 'fair price'],
          low: ['value-based pricing', 'premium positioning']
        }
      },
      
      execution_blocking: {
        linguistic_markers: [
          'stuck', 'blocked', 'cant', 'unable', 'trying',
          'struggling', 'difficult', 'hard', 'challenge'
        ],
        semantic_patterns: [
          'perceived obstacles', 'capability doubt', 'resource excuses'
        ],
        contextual_triggers: {
          same_blocker_mentioned: '>3times',
          progress_stalled: '>1week',
          help_seeking_without_action: 'true'
        },
        severity_indicators: {
          high: ['completely stuck', 'impossible', 'can\'t move forward'],
          medium: ['having trouble', 'finding it difficult'],
          low: ['bit challenging', 'working through it']
        }
      }
    };
    
    this.patternCombinations = {
      'analysis_paralysis': ['planning_paralysis', 'perfectionism'],
      'imposter_spiral': ['pricing_anxiety', 'perfectionism', 'execution_blocking'],
      'chronic_avoidance': ['procrastination', 'execution_blocking'],
      'fear_driven_stall': ['perfectionism', 'pricing_anxiety', 'procrastination']
    };
  }
  
  async detectPatterns(mlAnalysis, userContext) {
    const detectedPatterns = [];
    
    // 1. Primary pattern detection from ML intent
    const primaryPattern = this.detectPrimaryPattern(mlAnalysis);
    if (primaryPattern) {
      detectedPatterns.push(primaryPattern);
    }
    
    // 2. Secondary patterns from linguistic analysis
    const linguisticPatterns = this.detectLinguisticPatterns(mlAnalysis.message);
    detectedPatterns.push(...linguisticPatterns);
    
    // 3. Contextual patterns from user history
    const contextualPatterns = this.detectContextualPatterns(userContext);
    detectedPatterns.push(...contextualPatterns);
    
    // 4. Pattern combinations (more severe)
    const combinations = this.detectPatternCombinations(detectedPatterns);
    
    // 5. Calculate composite severity
    const analysis = this.analyzePatternSeverity(detectedPatterns, combinations, userContext);
    
    return {
      patterns: detectedPatterns,
      combinations: combinations,
      severity: analysis.severity,
      confidence: analysis.confidence,
      primary_pattern: analysis.primary,
      urgency: analysis.urgency
    };
  }
  
  detectPrimaryPattern(mlAnalysis) {
    if (!mlAnalysis.intent || mlAnalysis.intent_confidence < 0.6) {
      return null;
    }
    
    const pattern = this.patterns[mlAnalysis.intent];
    if (!pattern) return null;
    
    return {
      type: mlAnalysis.intent,
      confidence: mlAnalysis.intent_confidence,
      source: 'ml_classification',
      severity: this.calculateSeverity(mlAnalysis)
    };
  }
  
  detectLinguisticPatterns(message) {
    const patterns = [];
    const lowerMessage = message.toLowerCase();
    
    Object.entries(this.patterns).forEach(([patternType, pattern]) => {
      let matchScore = 0;
      let matchedMarkers = [];
      
      // Check linguistic markers
      pattern.linguistic_markers.forEach(marker => {
        if (lowerMessage.includes(marker)) {
          matchScore += 0.1;
          matchedMarkers.push(marker);
        }
      });
      
      // Check severity indicators
      let severity = 'low';
      Object.entries(pattern.severity_indicators).forEach(([level, indicators]) => {
        indicators.forEach(indicator => {
          if (lowerMessage.includes(indicator)) {
            severity = level;
            matchScore += level === 'high' ? 0.3 : level === 'medium' ? 0.2 : 0.1;
          }
        });
      });
      
      if (matchScore > 0.2) {
        patterns.push({
          type: patternType,
          confidence: Math.min(matchScore, 0.9),
          source: 'linguistic_analysis',
          severity: severity,
          matched_markers: matchedMarkers
        });
      }
    });
    
    return patterns;
  }
  
  detectContextualPatterns(userContext) {
    const patterns = [];
    
    // Check each pattern's contextual triggers
    Object.entries(this.patterns).forEach(([patternType, pattern]) => {
      let triggersMet = 0;
      let totalTriggers = 0;
      
      Object.entries(pattern.contextual_triggers).forEach(([trigger, condition]) => {
        totalTriggers++;
        if (this.evaluateContextualTrigger(trigger, condition, userContext)) {
          triggersMet++;
        }
      });
      
      if (triggersMet > 0) {
        patterns.push({
          type: patternType,
          confidence: triggersMet / totalTriggers,
          source: 'contextual_analysis',
          severity: triggersMet === totalTriggers ? 'high' : 'medium'
        });
      }
    });
    
    return patterns;
  }
  
  evaluateContextualTrigger(trigger, condition, context) {
    // Parse conditions like '>72h', '<0.3', etc.
    if (typeof condition === 'string') {
      if (condition.startsWith('>')) {
        const value = parseFloat(condition.substring(1));
        return context[trigger] > value;
      } else if (condition.startsWith('<')) {
        const value = parseFloat(condition.substring(1));
        return context[trigger] < value;
      } else if (condition === 'true' || condition === 'false') {
        return context[trigger] === (condition === 'true');
      }
    }
    return context[trigger] === condition;
  }
  
  detectPatternCombinations(patterns) {
    const detectedTypes = patterns.map(p => p.type);
    const combinations = [];
    
    Object.entries(this.patternCombinations).forEach(([comboName, requiredPatterns]) => {
      const hasAllPatterns = requiredPatterns.every(required => 
        detectedTypes.includes(required)
      );
      
      if (hasAllPatterns) {
        combinations.push({
          name: comboName,
          patterns: requiredPatterns,
          severity: 'critical',
          description: this.getCombinationDescription(comboName)
        });
      }
    });
    
    return combinations;
  }
  
  getCombinationDescription(comboName) {
    const descriptions = {
      'analysis_paralysis': 'Overthinking and perfecting plans instead of executing',
      'imposter_spiral': 'Self-doubt affecting pricing and execution',
      'chronic_avoidance': 'Persistent procrastination with real blockers',
      'fear_driven_stall': 'Fear manifesting as perfectionism and delay'
    };
    return descriptions[comboName] || 'Multiple behavioral patterns detected';
  }
  
  analyzePatternSeverity(patterns, combinations, context) {
    if (patterns.length === 0) {
      return { severity: 'none', confidence: 0, primary: null, urgency: 'low' };
    }
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    const primary = patterns[0];
    let severity = primary.severity;
    let urgency = 'medium';
    
    // Escalate for combinations
    if (combinations.length > 0) {
      severity = 'critical';
      urgency = 'high';
    }
    
    // Escalate based on business context
    if (context.current_mrr < 1000 && primary.type === 'pricing_anxiety') {
      urgency = 'critical';
    }
    
    if (context.days_since_last_sale > 30 && primary.type === 'execution_blocking') {
      urgency = 'critical';
    }
    
    return {
      severity,
      confidence: primary.confidence,
      primary: primary.type,
      urgency
    };
  }
  
  calculateSeverity(mlAnalysis) {
    if (mlAnalysis.sentiment_score < 0.3) return 'high';
    if (mlAnalysis.urgency_detected) return 'high';
    if (mlAnalysis.intent_confidence > 0.85) return 'medium';
    return 'low';
  }
}

// ============================================
// 2. INTERVENTION GENERATOR
// ============================================

class InterventionGenerator {
  constructor() {
    this.interventionStrategies = {
      procrastination: {
        low: {
          gentle_nudge: "What's one small step you could take right now?",
          reframe: "Progress beats perfection. Start with 10 minutes.",
          accountability: "Tell me the first thing you'll do today."
        },
        medium: {
          direct_challenge: "You've been planning this for {{days_mentioned}}. Time to act.",
          pattern_interrupt: "Stop. Choose one task. Do it now. Report back in 1 hour.",
          consequence_reminder: "Every day you wait costs you {{estimated_loss}}."
        },
        high: {
          brutal_truth: "You're choosing failure by not starting. This pattern has cost you {{total_opportunity_cost}}.",
          ultimatum: "Start today or admit you're not serious about this.",
          breakdown: "You're overwhelmed. Let's do just THIS: {{micro_action}}"
        },
        critical: {
          intervention: "🚨 PATTERN ALERT: You've said 'later' {{procrastination_count}} times this month. Your business is dying while you plan.",
          directive: "Close this chat. Do ONE revenue-generating activity. Come back when it's done.",
          reality_check: "At this rate, you'll be at ${{projected_mrr}} in 6 months. Still want to wait?"
        }
      },
      
      planning_paralysis: {
        low: {
          gentle_nudge: "Your plan is good enough. What's stopping you from starting?",
          reframe: "Planning is procrastination in disguise. Pick one thing.",
          accountability: "Which part of your existing plan will you execute today?"
        },
        medium: {
          direct_challenge: "You have {{plan_count}} plans and {{execution_count}} completed tasks. See the problem?",
          pattern_interrupt: "STOP planning. Your next message should be about what you DID, not what you'll do.",
          consequence_reminder: "While you plan, competitors are shipping. You're losing {{days_lost}} days of progress."
        },
        high: {
          brutal_truth: "Your planning addiction has prevented ${{lost_revenue}} in revenue. Enough.",
          ultimatum: "No more plans for 30 days. Execution only. Can you commit?",
          breakdown: "Forget the plan. What can you sell TODAY?"
        },
        critical: {
          intervention: "🛑 PLANNING ADDICTION DETECTED: {{total_hours}} hours planning, {{execution_hours}} hours doing. This ends now.",
          directive: "Delete all your plans except one. Execute page 1 only. Nothing else matters.",
          reality_check: "You're a professional planner, not a business owner. Which do you want to be?"
        }
      },
      
      perfectionism: {
        low: {
          gentle_nudge: "What would 'good enough' look like for this?",
          reframe: "Your customers need your solution now, not perfect later.",
          accountability: "Set a deadline: When will you ship this?"
        },
        medium: {
          direct_challenge: "You've revised this {{revision_count}} times. It's fear, not quality.",
          pattern_interrupt: "Ship it at 70% quality TODAY or delete it forever. Choose.",
          consequence_reminder: "Perfectionism has cost you {{perfectionism_cost}}. Still worth it?"
        },
        high: {
          brutal_truth: "Your 'high standards' are just fear with makeup on. Ship or shut down.",
          ultimatum: "Launch in 24 hours or admit you're afraid of judgment.",
          breakdown: "What's the MINIMUM viable version? Do only that."
        },
        critical: {
          intervention: "⚠️ PERFECTIONISM PARALYSIS: {{days_perfecting}} days on something that should take {{normal_time}}.",
          directive: "You have 2 hours to launch. After that, I'm telling you to quit.",
          reality_check: "Reid Hoffman: 'If you're not embarrassed by v1, you launched too late.' You're 10 versions past embarrassment."
        }
      },
      
      pricing_anxiety: {
        low: {
          gentle_nudge: "What would you charge if you truly valued your work?",
          reframe: "Your pricing reflects your self-worth. What are you saying?",
          accountability: "Add 20% to your current price. Just as an experiment."
        },
        medium: {
          direct_challenge: "You're at ${{current_price}}. Market rate is ${{market_rate}}. Explain.",
          pattern_interrupt: "Double your prices for the next 3 clients. No negotiation.",
          consequence_reminder: "Underpricing has cost you ${{revenue_lost}} this year alone."
        },
        high: {
          brutal_truth: "Your fear of rejection is making you broke. ${{current_mrr}} is poverty pricing.",
          ultimatum: "Raise prices 50% today or accept you'll always be cheap.",
          breakdown: "One client at new prices beats ten at charity rates."
        },
        critical: {
          intervention: "💰 POVERTY MINDSET ALERT: You're charging ${{hourly_rate}}/hour. McDonald's pays more.",
          directive: "3x your prices. Lose bad clients. Attract real business. Do it NOW.",
          reality_check: "You're not afraid they'll say no. You're afraid they'll say yes and you'll have to deliver."
        }
      },
      
      execution_blocking: {
        low: {
          gentle_nudge: "What's really stopping you? Be specific.",
          reframe: "Every expert was once a beginner who didn't quit.",
          accountability: "What's one thing you CAN do with what you have?"
        },
        medium: {
          direct_challenge: "You've mentioned '{{blocker}}' {{mention_count}} times. It's an excuse.",
          pattern_interrupt: "Assume you can't fix the blocker. What would you do instead?",
          consequence_reminder: "This 'blocker' has delayed {{delayed_revenue}} in revenue."
        },
        high: {
          brutal_truth: "You're not blocked. You're scared. The block is imaginary.",
          ultimatum: "Find a way or admit you don't want it badly enough.",
          breakdown: "Who has solved this before? Copy them exactly."
        },
        critical: {
          intervention: "🚫 EXCUSE PATTERN: Same 'blocker' for {{days_blocked}} days. You're choosing to stay stuck.",
          directive: "You have 2 options: 1) Solve it today, or 2) Work around it. Staying stuck isn't an option.",
          reality_check: "Winners find a way. Losers find an excuse. Which are you being?"
        }
      }
    };
    
    this.combinationStrategies = {
      analysis_paralysis: {
        intervention: "📊 ANALYSIS PARALYSIS DETECTED: {{plan_count}} plans, {{perfect_attempts}} perfection loops, ZERO launches.",
        prescription: "For the next 7 days: No planning. No perfecting. Only shipping. Can you handle that?",
        accountability: "Send me proof of something you shipped within 24 hours or I'm calling you out."
      },
      imposter_spiral: {
        intervention: "😰 IMPOSTER SPIRAL: Undercharging because you're scared, overworking because you feel inadequate.",
        prescription: "Truth: You know more than your clients. Price like it. Ship like it. Own it.",
        accountability: "Raise your prices TODAY and ship something IMPERFECT. Report back."
      },
      chronic_avoidance: {
        intervention: "⏰ CHRONIC AVOIDANCE: {{days_avoiding}} days of excuses. Your dreams are dying.",
        prescription: "You get 3 more excuses in your entire life. Use them wisely. Today isn't one of them.",
        accountability: "Next message better be about something you DID, not why you couldn't."
      },
      fear_driven_stall: {
        intervention: "😨 FEAR SPIRAL: Every pattern traces back to fear. Fear of judgment, rejection, failure.",
        prescription: "Feel the fear. Do it anyway. Or quit now and save yourself the slow death.",
        accountability: "What are you MOST afraid of? Do exactly that thing TODAY."
      }
    };
  }
  
  generateIntervention(patternAnalysis, userContext, mlResults) {
    // Determine intervention strategy
    const strategy = this.selectStrategy(patternAnalysis, userContext);
    
    // Get base intervention
    let intervention = this.getBaseIntervention(
      patternAnalysis.primary_pattern,
      patternAnalysis.severity,
      strategy
    );
    
    // Personalize with context
    intervention = this.personalizeIntervention(intervention, userContext, patternAnalysis);
    
    // Add combination interventions if needed
    if (patternAnalysis.combinations.length > 0) {
      intervention = this.addCombinationIntervention(
        intervention,
        patternAnalysis.combinations[0],
        userContext
      );
    }
    
    // Add specific directives
    const directive = this.generateDirective(patternAnalysis, userContext);
    
    // Add accountability hook
    const accountability = this.createAccountabilityHook(patternAnalysis, userContext);
    
    return {
      intervention,
      directive,
      accountability,
      follow_up_required: patternAnalysis.severity !== 'low',
      follow_up_timing: this.getFollowUpTiming(patternAnalysis.severity)
    };
  }
  
  selectStrategy(analysis, context) {
    // High trust + high severity = brutal truth
    if (context.trust_level > 7 && analysis.severity === 'high') {
      return 'brutal_truth';
    }
    
    // Low trust = gentle nudge
    if (context.trust_level < 4) {
      return 'gentle_nudge';
    }
    
    // Repeated patterns = pattern interrupt
    if (context.pattern_repetition_count > 3) {
      return 'pattern_interrupt';
    }
    
    // Crisis = ultimatum
    if (analysis.urgency === 'critical') {
      return 'ultimatum';
    }
    
    // Default based on severity
    const defaultStrategies = {
      low: 'gentle_nudge',
      medium: 'direct_challenge',
      high: 'brutal_truth',
      critical: 'intervention'
    };
    
    return defaultStrategies[analysis.severity] || 'direct_challenge';
  }
  
  getBaseIntervention(pattern, severity, strategy) {
    const patternInterventions = this.interventionStrategies[pattern];
    if (!patternInterventions) return "Time to take action on this pattern.";
    
    const severityInterventions = patternInterventions[severity];
    if (!severityInterventions) return patternInterventions.low.gentle_nudge;
    
    return severityInterventions[strategy] || severityInterventions.direct_challenge;
  }
  
  personalizeIntervention(intervention, context, analysis) {
    // Replace all template variables
    const variables = {
      days_mentioned: context.days_since_first_mention || 'several days',
      estimated_loss: `${(context.daily_opportunity_cost * context.days_procrastinating) || 500}`,
      total_opportunity_cost: `${context.total_opportunity_cost || 5000}`,
      procrastination_count: context.procrastination_mentions || 'multiple',
      plan_count: context.plans_created || 'several',
      execution_count: context.tasks_completed || 0,
      days_lost: context.days_spent_planning || 'countless',
      lost_revenue: context.planning_opportunity_cost || 10000,
      total_hours: context.total_planning_hours || 'dozens of',
      execution_hours: context.total_execution_hours || 'almost zero',
      revision_count: context.revision_count || 'countless',
      perfectionism_cost: `${context.perfectionism_opportunity_cost || 5000}`,
      days_perfecting: context.days_perfecting || 'too many',
      normal_time: context.normal_task_time || '2 days',
      current_price: `${context.current_average_price || 97}`,
      market_rate: `${context.market_rate || 297}`,
      revenue_lost: context.underpricing_loss || 50000,
      current_mrr: context.current_mrr || 0,
      hourly_rate: Math.round((context.current_mrr || 1000) / 160),
      blocker: context.most_mentioned_blocker || 'that issue',
      mention_count: context.blocker_mention_count || 'multiple',
      delayed_revenue: context.blocker_delayed_revenue || 10000,
      days_blocked: context.days_since_blocker_first_mentioned || 'many',
      days_avoiding: context.total_avoidance_days || 30,
      projected_mrr: context.current_mrr || 0,
      user_name: context.user_name?.split(' ')[0] || 'Friend'
    };
    
    // Replace variables in intervention
    Object.entries(variables).forEach(([key, value]) => {
      intervention = intervention.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    // Add personal touch for high trust users
    if (context.trust_level > 8 && analysis.severity === 'high') {
      intervention = `${context.user_name}, real talk: ${intervention}`;
    }
    
    return intervention;
  }
  
  addCombinationIntervention(baseIntervention, combination, context) {
    const comboStrategy = this.combinationStrategies[combination.name];
    if (!comboStrategy) return baseIntervention;
    
    let comboIntervention = this.personalizeIntervention(
      comboStrategy.intervention,
      context,
      { severity: 'critical' }
    );
    
    return `${comboIntervention}\n\n${baseIntervention}\n\n${comboStrategy.prescription}`;
  }
  
  generateDirective(analysis, context) {
    const directives = {
      procrastination: {
        low: "Choose one small task and complete it today.",
        medium: "Stop reading this. Go do the thing you're avoiding.",
        high: "You have 1 hour to show progress or we're having a different conversation.",
        critical: "No more messages until you've taken action. I'll know if you haven't."
      },
      planning_paralysis: {
        low: "Execute page 1 of your plan. Ignore the rest.",
        medium: "Delete all plans except one. Execute the first step only.",
        high: "Planning ban for 7 days. Execution only.",
        critical: "Ship something in the next 24 hours or shut down."
      },
      perfectionism: {
        low: "Set a timer for 2 hours. Ship when it rings.",
        medium: "Launch the 70% version today.",
        high: "You have until midnight to go live.",
        critical: "Ship in the next 4 hours. No excuses."
      },
      pricing_anxiety: {
        low: "Increase your price by 20% for the next client.",
        medium: "Double your prices this week. No exceptions.",
        high: "3x your prices or find a job.",
        critical: "Charge what scares you. Do it today."
      },
      execution_blocking: {
        low: "Find three people who solved this. Copy one.",
        medium: "You have 24 hours to eliminate this blocker.",
        high: "Hire someone or find a workaround. Today.",
        critical: "This excuse dies today. Find a way or quit."
      }
    };
    
    const pattern = analysis.primary_pattern;
    const severity = analysis.severity;
    
    return directives[pattern]?.[severity] || "Take action on this today.";
  }
  
  createAccountabilityHook(analysis, context) {
    const hooks = {
      low: "Let me know what you accomplished today.",
      medium: "Report back in 24 hours with proof of progress.",
      high: "Send me evidence of action within 4 hours.",
      critical: "If I don't see results in 24 hours, we're done talking."
    };
    
    let hook = hooks[analysis.severity] || hooks.medium;
    
    // Add specific accountability for patterns
    if (analysis.primary_pattern === 'procrastination') {
      hook += " No explanations, just what you DID.";
    } else if (analysis.primary_pattern === 'planning_paralysis') {
      hook += " Show me what you EXECUTED, not planned.";
    } else if (analysis.primary_pattern === 'perfectionism') {
      hook += " It better be live and imperfect.";
    }
    
    return hook;
  }
  
  getFollowUpTiming(severity) {
    const timings = {
      low: '48h',
      medium: '24h',
      high: '4h',
      critical: '1h'
    };
    return timings[severity] || '24h';
  }
}

// ============================================
// 3. LEARNING SYSTEM
// ============================================

class BehavioralLearningSystem {
  constructor(database) {
    this.db = database;
    this.cache = new Map();
  }
  
  async trackIntervention(userId, intervention, patternAnalysis, mlResults) {
    const trackingId = this.generateTrackingId();
    
    const trackingData = {
      tracking_id: trackingId,
      user_id: userId,
      timestamp: new Date().toISOString(),
      pattern_detected: patternAnalysis.primary_pattern,
      pattern_severity: patternAnalysis.severity,
      pattern_confidence: patternAnalysis.confidence,
      intervention_type: intervention.strategy,
      intervention_text: intervention.intervention,
      ml_intent: mlResults.intent,
      ml_confidence: mlResults.intent_confidence,
      awaiting_outcome: true,
      follow_up_required: intervention.follow_up_required,
      follow_up_timing: intervention.follow_up_timing
    };
    
    // Store in database
    await this.db.storeIntervention(trackingData);
    
    // Schedule follow-up checks
    await this.scheduleOutcomeCollection(trackingId, userId, intervention.follow_up_timing);
    
    // Update user pattern history
    await this.updateUserPatternHistory(userId, patternAnalysis);
    
    return trackingId;
  }
  
  async collectOutcome(trackingId, userId) {
    const intervention = await this.db.getIntervention(trackingId);
    if (!intervention) return;
    
    // Collect behavioral changes
    const behaviorChanges = await this.analyzeBehaviorChange(
      userId,
      intervention.timestamp
    );
    
    // Collect business metrics
    const businessImpact = await this.analyzeBusinessImpact(
      userId,
      intervention.timestamp
    );
    
    // Calculate effectiveness
    const effectiveness = this.calculateEffectiveness(
      behaviorChanges,
      businessImpact,
      intervention
    );
    
    // Update intervention record
    await this.db.updateIntervention(trackingId, {
      outcome_collected: true,
      behavior_changes: behaviorChanges,
      business_impact: businessImpact,
      effectiveness_score: effectiveness.score,
      effectiveness_factors: effectiveness.factors
    });
    
    // Update pattern effectiveness
    await this.updatePatternEffectiveness(
      intervention.pattern_detected,
      effectiveness.score,
      userId
    );
    
    // Learn from outcome
    await this.learn(intervention, effectiveness);
    
    return effectiveness;
  }
  
  async analyzeBehaviorChange(userId, interventionTime) {
    const before = await this.db.getUserBehavior(userId, interventionTime, 'before');
    const after = await this.db.getUserBehavior(userId, interventionTime, 'after');
    
    return {
      message_sentiment_change: after.avg_sentiment - before.avg_sentiment,
      action_language_increase: after.action_word_count - before.action_word_count,
      future_tense_decrease: before.future_tense_count - after.future_tense_count,
      task_completion_increase: after.task_completion_rate - before.task_completion_rate,
      pattern_repetition_decrease: before.pattern_repetition - after.pattern_repetition,
      response_time_improvement: before.avg_response_time - after.avg_response_time
    };
  }
  
  async analyzeBusinessImpact(userId, interventionTime) {
    const before = await this.db.getBusinessMetrics(userId, interventionTime, 'before');
    const after = await this.db.getBusinessMetrics(userId, interventionTime, 'after');
    
    return {
      revenue_change: after.mrr - before.mrr,
      customer_acquisition: after.new_customers - before.new_customers,
      price_increase: after.average_price - before.average_price,
      product_launches: after.products_launched,
      task_completion: after.tasks_completed,
      sales_calls_booked: after.sales_calls
    };
  }
  
  calculateEffectiveness(behaviorChanges, businessImpact, intervention) {
    let score = 0;
    const factors = [];
    
    // Behavioral improvements (40% weight)
    if (behaviorChanges.message_sentiment_change > 0.1) {
      score += 0.1;
      factors.push('improved_sentiment');
    }
    if (behaviorChanges.action_language_increase > 2) {
      score += 0.1;
      factors.push('more_action_oriented');
    }
    if (behaviorChanges.pattern_repetition_decrease > 0) {
      score += 0.2;
      factors.push('pattern_broken');
    }
    
    // Business impact (60% weight)
    if (businessImpact.revenue_change > 0) {
      score += 0.3;
      factors.push('revenue_increased');
    }
    if (businessImpact.task_completion > 0) {
      score += 0.2;
      factors.push('tasks_completed');
    }
    if (businessImpact.product_launches > 0) {
      score += 0.1;
      factors.push('shipped_product');
    }
    
    // Pattern-specific bonuses
    if (intervention.pattern_detected === 'pricing_anxiety' && businessImpact.price_increase > 0) {
      score += 0.2;
      factors.push('pricing_confidence_improved');
    }
    
    return {
      score: Math.min(score, 1.0),
      factors
    };
  }
  
  async updatePatternEffectiveness(pattern, effectivenessScore, userId) {
    // Get current effectiveness
    const current = await this.db.getPatternEffectiveness(pattern, userId);
    
    // Update with exponential moving average
    const alpha = 0.3; // Learning rate
    const newScore = current 
      ? (alpha * effectivenessScore + (1 - alpha) * current.effectiveness)
      : effectivenessScore;
    
    await this.db.updatePatternEffectiveness(pattern, userId, {
      effectiveness: newScore,
      sample_size: (current?.sample_size || 0) + 1,
      last_updated: new Date().toISOString()
    });
  }
  
  async updateUserPatternHistory(userId, patternAnalysis) {
    try {
      const historyData = {
        user_id: userId,
        pattern_type: patternAnalysis.primary_pattern,
        confidence: patternAnalysis.confidence,
        severity: patternAnalysis.severity,
        timestamp: new Date().toISOString()
      };
      await this.db.storePatternHistory(historyData);
      if (typeof logger !== 'undefined') {
        logger.info({ userId, pattern: patternAnalysis.primary_pattern }, 'Pattern history updated');
      } else {
        console.log('Pattern history updated', { userId, pattern: patternAnalysis.primary_pattern });
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.error({ error, userId }, 'Failed to update pattern history');
      } else {
        console.error('Failed to update pattern history', { error, userId });
      }
    }
  }
  
  async learn(intervention, effectiveness) {
    // Update intervention strategy effectiveness
    await this.updateStrategyEffectiveness(
      intervention.pattern_detected,
      intervention.intervention_type,
      effectiveness.score
    );
    
    // Learn feature importance
    if (effectiveness.score > 0.7) {
      await this.reinforceFeatures(intervention);
    } else if (effectiveness.score < 0.3) {
      await this.penalizeFeatures(intervention);
    }
    
    // Update global pattern weights
    await this.updateGlobalWeights();
  }
  
  async predictInterventionSuccess(pattern, severity, userContext) {
    // Get historical effectiveness
    const history = await this.db.getInterventionHistory(
      pattern,
      severity,
      userContext.user_id
    );
    
    if (!history || history.length < 5) {
      return { probability: 0.5, confidence: 'low' };
    }
    
    // Calculate success probability
    const successRate = history.filter(h => h.effectiveness > 0.6).length / history.length;
    const confidence = history.length > 20 ? 'high' : history.length > 10 ? 'medium' : 'low';
    
    return { probability: successRate, confidence };
  }
  
  generateTrackingId() {
    return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async scheduleOutcomeCollection(trackingId, userId, timing) {
    const delayMs = this.parseTimingToMs(timing);
    
    // In production, use a proper job queue
    // For now, store scheduled time in DB
    await this.db.scheduleOutcomeCollection({
      tracking_id: trackingId,
      user_id: userId,
      scheduled_time: new Date(Date.now() + delayMs).toISOString()
    });
  }
  
  parseTimingToMs(timing) {
    const units = {
      'h': 3600000,
      'd': 86400000,
      'w': 604800000
    };
    
    const match = timing.match(/(\d+)([hdw])/);
    if (!match) return 86400000; // Default 24h
    
    return parseInt(match[1]) * units[match[2]];
  }
}

// ============================================
// 4. INTEGRATION API
// ============================================

import express from 'express';
import cors from 'cors';

export class Celeste7BehavioralAPI {
  constructor() {
    this.app = express();
    this.patternEngine = new BehavioralPatternEngine();
    this.interventionGenerator = new InterventionGenerator();
    this.learningSystem = new BehavioralLearningSystem(this.initDatabase());
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'celeste7-behavioral-engine',
        version: '1.0.0',
        uptime: process.uptime()
      });
    });

    // Root route for API info
    this.app.get('/', (req, res) => {
      res.json({
        service: 'CELESTE7 Behavioral Engine',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          analyze: 'POST /analyze',
          trackOutcome: 'POST /track-outcome',
          patterns: 'GET /patterns/:userId'
        }
      });
    });
    
    // Main analysis endpoint
    this.app.post('/analyze', async (req, res) => {
      try {
        const { mlResults, userContext, message } = req.body;
        
        // Add message to ML results for pattern detection
        mlResults.message = message;
        
        // Detect patterns
        const patternAnalysis = await this.patternEngine.detectPatterns(
          mlResults,
          userContext
        );
        
        // Generate intervention
        const intervention = this.interventionGenerator.generateIntervention(
          patternAnalysis,
          userContext,
          mlResults
        );
        
        // Track for learning
        const trackingId = await this.learningSystem.trackIntervention(
          userContext.user_id,
          intervention,
          patternAnalysis,
          mlResults
        );
        
        res.json({
          success: true,
          pattern_analysis: patternAnalysis,
          intervention: intervention,
          tracking_id: trackingId,
          should_intervene: patternAnalysis.confidence > 0.75,
          confidence: patternAnalysis.confidence
        });
        
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Outcome tracking endpoint
    this.app.post('/track-outcome', async (req, res) => {
      try {
        const { tracking_id, user_id } = req.body;
        
        const effectiveness = await this.learningSystem.collectOutcome(
          tracking_id,
          user_id
        );
        
        res.json({
          success: true,
          effectiveness
        });
        
      } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Get user pattern history
    this.app.get('/patterns/:userId', async (req, res) => {
      try {
        const patterns = await this.learningSystem.db.getUserPatterns(
          req.params.userId
        );
        
        res.json({
          success: true,
          patterns
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }
  
  initDatabase() {
    // Database interface - implement with Supabase
    return {
      storeIntervention: async (data) => {
        // Store in interventions table
        console.log('Storing intervention:', data);
      },
      
      getIntervention: async (trackingId) => {
        // Retrieve intervention
        console.log('Getting intervention:', trackingId);
      },
      
      updateIntervention: async (trackingId, updates) => {
        // Update intervention
        console.log('Updating intervention:', trackingId, updates);
      },
      
      getUserBehavior: async (userId, timestamp, period) => {
        // Get behavior metrics
        console.log('Getting user behavior:', userId, timestamp, period);
        return {
          avg_sentiment: 0.5,
          action_word_count: 5,
          future_tense_count: 3,
          task_completion_rate: 0.3,
          pattern_repetition: 2,
          avg_response_time: 24
        };
      },
      
      getBusinessMetrics: async (userId, timestamp, period) => {
        // Get business metrics
        console.log('Getting business metrics:', userId, timestamp, period);
        return {
          mrr: 1000,
          new_customers: 0,
          average_price: 97,
          products_launched: 0,
          tasks_completed: 1,
          sales_calls: 0
        };
      },
      
      getPatternEffectiveness: async (pattern, userId) => {
        // Get pattern effectiveness
        console.log('Getting pattern effectiveness:', pattern, userId);
      },
      
      updatePatternEffectiveness: async (pattern, userId, data) => {
        // Update effectiveness
        console.log('Updating pattern effectiveness:', pattern, userId, data);
      },
      
      getInterventionHistory: async (pattern, severity, userId) => {
        // Get history
        console.log('Getting intervention history:', pattern, severity, userId);
        return [];
      },
      
      getUserPatterns: async (userId) => {
        // Get user patterns
        console.log('Getting user patterns:', userId);
        return [];
      },
      
      scheduleOutcomeCollection: async (data) => {
        // Schedule collection
        console.log('Scheduling outcome collection:', data);
      },
      
      storePatternHistory: async (data) => {
        // Store pattern history
        console.log('Storing pattern history:', data);
      }
    };
  }
  
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`CELESTE7 Behavioral Engine running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  }
}

// ============================================
// 5. DEPLOYMENT
// ============================================

// Create API instance
const api = new Celeste7BehavioralAPI();

// Export for Vercel deployment
export default api.app;

// Start server for local/other deployment (not Vercel)
if (!process.env.VERCEL) {
  api.start(process.env.PORT || 3000);
}

// ============================================
// 6. USAGE IN N8N
// ============================================

/*
In your n8n workflow, call this API:

const behavioralResponse = await fetch('https://your-domain.vercel.app/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mlResults: {
      intent: 'procrastination',
      intent_confidence: 0.85,
      sentiment_score: 0.3,
      urgency_detected: false
    },
    userContext: {
      user_id: $json.user_id,
      user_name: $json.user_name,
      trust_level: $json.trust_level || 5,
      current_mrr: $json.current_mrr || 0,
      days_since_last_sale: $json.days_since_last_sale || 30,
      pattern_repetition_count: $json.pattern_count || 0
    },
    message: $json.current_message
  })
});

const result = await behavioralResponse.json();

if (result.should_intervene) {
  // Add intervention to response
  return {
    enhanced_response: $json.ai_response + '\n\n' + result.intervention.intervention,
    tracking_id: result.tracking_id,
    requires_followup: result.intervention.follow_up_required
  };
}
*/