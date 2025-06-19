# CELESTE7 MVP TWEAKING GUIDE

## 🔥 CHANGES MADE FOR "HOLY FUCK" IMPACT

### AI BRUTALITY TWEAKING POINTS:

**1. brutal-interventions.js**
- Line 45: `first_contact` intervention - made more direct with competitor comparison
- Line 67: `uncomfortable_truth` - added "You're not planning, you're hiding"
- **TWEAK:** Change message brutality levels in each intervention tier

**2. api/analyze.js** 
- Line 15: `BRUTALITY_LEVEL = 3` (0=gentle, 5=nuclear)
- Line 35: `SHOCK_MULTIPLIER = 2.5` for amplifying interventions
- **TWEAK:** Increase these numbers for more brutal responses

**3. index.js**
- Line 198: `SHOCK_MULTIPLIER = 2.5` in real-time SSE
- **TWEAK:** Adjust for real-time intervention intensity

### SUPABASE INTEGRATION POINTS:

**1. pattern-queries-optimized.js**
- Line 25: `n8nTables` array - **ADD YOUR 23 N8N TABLE NAMES HERE**
- Line 45: Connects to `user_messages_categorized` (your n8n output)
- Line 89: `BRUTALITY_THRESHOLDS` object for pattern sensitivity

**2. api/analyze.js**
- Line 25: Queries `assumption_pattern_matches` table for new users
- Line 55: Logs to `intervention_deliveries` table
- **CONNECT:** Add your other 22 n8n tables to the query

**3. index.js** 
- Line 178: Queries `user_messages_categorized` from n8n
- Line 205: Logs to `intervention_deliveries` for tracking

## 📊 YOUR N8N TABLE INTEGRATION

**Current connection:**
```javascript
// Add your 23 n8n table names here:
const n8nTables = [
  'user_messages_categorized',    // Main n8n output ✅
  'behavioral_signals',           // From n8n analysis
  'task_patterns',               // Planning vs execution  
  'pricing_mentions',            // Pricing discussions
  'competitor_references',       // When they mention others
  // ADD YOUR OTHER 18 TABLES HERE
];
```

## 🎯 ASSUMPTION TABLE USAGE

**Cold start for new users:**
- Queries `assumption_pattern_matches` table
- Uses `shock_value` column for impact
- Falls back to assumptions when no user data exists

## ⚡ MAXIMUM IMPACT SETTINGS

**For "holy fuck" reactions:**
1. Set `BRUTALITY_LEVEL = 4` (line 15, api/analyze.js)
2. Set `SHOCK_MULTIPLIER = 3.0` (line 35, api/analyze.js) 
3. Lower `BRUTALITY_THRESHOLDS.GENTLE = 3` (pattern-queries-optimized.js)
4. Connect all 23 n8n tables for maximum data depth

## 🚀 DEPLOYMENT READY

**Files updated:**
- ✅ Removed Redis/Upstash dependency
- ✅ Added brutal intervention escalation
- ✅ Connected to assumptions table
- ✅ Marked all AI/Supabase tweak points
- ✅ Added n8n table integration hooks

**Deploy command:**
```bash
./deploy-vercel.sh
```

**Test with:**
```json
{"userId": "test_123", "message": "I've been planning this launch for 3 months"}
```

**Expected response:**
"3 months = $7,200 burned while planning. Your competitor shipped and gained 150 customers. Ship in next 4 hours or delete forever."