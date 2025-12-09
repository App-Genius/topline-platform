# Topline: Product Vision & System Specification

## Executive Summary

Topline is a **behavior-driven business optimization system** built on the 4 Disciplines of Execution (4DX) framework. It connects daily team member behaviors (lead measures) to business outcomes (lag measures) across ALL organizational roles—not just frontline staff.

The core hypothesis: **If team members consistently execute specific behaviors, and those behaviors are tied to measurable business outcomes, businesses can predictably improve their KPIs.**

---

## Core System Principles

These principles govern ALL development decisions and must be adhered to rigorously:

### Principle 1: Stay Focused on Lag & Lead Measures

The system exists for ONE purpose: connecting behaviors (lead measures) to KPIs (lag measures). Every feature must pass this test:

> "Does this feature directly help measure, track, or improve the connection between behaviors and KPIs?"

**DO:**
- Build features that track behaviors
- Build features that measure KPIs
- Build features that analyze behavior→KPI correlations
- Build features that help teams execute better

**DON'T:**
- Add features because competitors have them
- Build integrations that don't feed into KPI tracking
- Create complexity that doesn't serve the core loop

### Principle 2: Industry-Agnostic by Design

Topline is NOT a restaurant app, NOT a retail app, NOT a hospitality app. It's a **universal behavior-to-outcome system** that adapts to ANY business:

- **Restaurants**: Server suggests wine → Average check increases
- **Hotels**: Front desk offers upgrade → RevPAR increases
- **Accountants**: Staff checks vendor pricing → Cost reduction achieved
- **Cleaning Services**: Tech completes room in target time → Productivity KPI met
- **Landscapers**: Crew logs equipment maintenance → Equipment uptime improves
- **Law Firms**: Associate tracks billable activities → Utilization rate increases

The AI generates scaffolding, language, behaviors, and KPIs appropriate to each industry. The core engine remains the same.

### Principle 3: Universal Quantification

**Every role has measurable behaviors.** This is non-negotiable:

| Role Type | Example Behaviors | Measurable Outcome |
|-----------|-------------------|-------------------|
| Revenue-generating | Upsell suggestions | Check increase |
| Cost-controlling | Vendor comparisons | Cost reduction |
| Quality-focused | Checklist completion | Quality score |
| Compliance-focused | Documentation tasks | Audit readiness |
| Productivity-focused | Time tracking | Efficiency metrics |

If a role exists in a business, there are behaviors that can be tracked.

### Principle 4: Integration Philosophy

Integrations exist ONLY to ingest data. They should NEVER:
- Bloat the core system
- Add complexity to the user experience
- Require the core system to depend on them

**Approved Integration Patterns:**
- POS systems → Revenue & transaction data ingestion
- Scheduling systems → Staff hours data ingestion
- Accounting systems → Cost data ingestion
- Review platforms → Rating data ingestion

**Data Ingestion Methods (in priority order):**
1. Direct API integration (cleanest)
2. Excel/CSV upload (most flexible)
3. OCR/AI document parsing (invoices, receipts)
4. Manual entry (always available as fallback)

### Principle 5: Hide Complexity Behind Intelligence

The system should feel simple to users while doing sophisticated work behind the scenes:

- **Users see**: Simple behavior buttons to tap
- **System does**: Statistical correlation analysis, fraud detection, AI insights
- **Users see**: Clear "winning/losing" game state
- **System does**: Multi-variable benchmark comparisons across time periods
- **Users see**: Personalized coaching messages
- **System does**: Context-aware AI with historical performance memory

---

## Table of Contents

1. [The Problem We Solve](#1-the-problem-we-solve)
2. [The 4DX Framework Foundation](#2-the-4dx-framework-foundation)
3. [Lead Measures vs Lag Measures](#3-lead-measures-vs-lag-measures)
4. [Target Users & Roles](#4-target-users--roles)
5. [Core Concepts Defined](#5-core-concepts-defined)
6. [KPI Definitions & Calculations](#6-kpi-definitions--calculations)
7. [Role-Specific Behavior Templates](#7-role-specific-behavior-templates)
8. [The Correlation Model](#8-the-correlation-model)
9. [Data Entry & Verification](#9-data-entry--verification)
10. [Fraud Detection & Accountability](#10-fraud-detection--accountability)
11. [AI Operations & Insights](#11-ai-operations--insights)
12. [Gamification & Incentives](#12-gamification--incentives)
13. [Onboarding & Setup](#13-onboarding--setup)
14. [Device Strategy](#14-device-strategy)
15. [Business Model](#15-business-model)

---

## 1. The Problem We Solve

### The Reality of Service Businesses

Most service businesses (restaurants, retail, hospitality, hardware stores, gas stations, spas) face a common problem:

1. **Reactive Management**: Owners only see results after the fact (end of month P&L)
2. **Disconnected Teams**: Staff don't understand how their daily actions impact business success
3. **No Accountability**: No way to measure if team members are actually doing what they should
4. **Guesswork**: Business decisions based on gut feeling, not data
5. **Missed Opportunities**: Staff don't actively sell—they just take orders

### What Happens Today

```
Customer walks into restaurant
↓
Server: "What would you like to order?"
↓
Customer orders what they already know
↓
No upsell, no suggestion, no engagement
↓
Average check stays flat
↓
Owner wonders why revenue isn't growing
```

### What Should Happen

```
Customer walks into restaurant
↓
Server: "Welcome! Can I suggest our chef's special appetizer?
         It pairs perfectly with the wine we're featuring tonight."
↓
Customer: "Sure, tell me more!"
↓
Upsell happens, average check increases
↓
Server logs the behavior in the app
↓
Owner sees which behaviors drive results
↓
Business grows predictably
```

---

## 2. The 4DX Framework Foundation

Topline is built on **The 4 Disciplines of Execution** by Franklin Covey:

### Discipline 1: Focus on the Wildly Important
- Don't try to improve everything at once
- Pick 1-2 KPIs that matter most (e.g., Average Check, Cost of Sales)
- All team effort focuses on moving those numbers

### Discipline 2: Act on Lead Measures
- **Lag Measures** = Results (revenue, profit, ratings) — you can't directly control these
- **Lead Measures** = Behaviors that drive results — you CAN control these
- Focus energy on the lead measures; lag measures will follow

### Discipline 3: Keep a Compelling Scoreboard
- People play differently when they're keeping score
- Public scoreboard showing who's winning/losing
- Updated frequently (daily, not monthly)

### Discipline 4: Create a Cadence of Accountability
- Regular meetings (daily briefings) to review progress
- Each person reports on their lead measures
- Commitments made and kept

---

## 3. Lead Measures vs Lag Measures

### Definitions

| Concept | Lead Measure | Lag Measure |
|---------|--------------|-------------|
| **What it is** | Predictive activity that drives results | Outcome that reflects past performance |
| **Can you control it?** | YES - directly | NO - only influence |
| **When measured** | Ongoing, real-time | After the fact |
| **Example** | Number of upsell suggestions made | Total revenue for the month |
| **Action** | "I made 10 wine suggestions today" | "We made $50K this month" |

### The Relationship

```
Lead Measures (Behaviors)     →     Lag Measures (KPIs)
─────────────────────────────────────────────────────
Upsell appetizer every table  →     Average check increases
3 vendor comparisons/week     →     Cost of sales decreases
Suggest wine with dinner      →     Revenue per cover increases
Track kitchen ticket times    →     Table turnover improves
Follow up on A/R weekly       →     Cash flow improves
Monitor utility usage daily   →     Utility costs decrease
```

### Why Lead Measures Matter

1. **Predictive**: If you do the behaviors, results will follow
2. **Influenceable**: You can directly increase behavior frequency
3. **Accountable**: Each team member owns their behaviors
4. **Fast Feedback**: Know immediately if behaviors are being done

---

## 4. Target Users & Roles

### User Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                     BUSINESS OWNER                       │
│  • Sees macro dashboard                                  │
│  • Configures KPIs and targets                          │
│  • Views all reports and insights                       │
│  • Sets incentives and rewards                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    MANAGER/SUPERVISOR                    │
│  • Conducts daily briefings                             │
│  • Verifies behavior logs                               │
│  • Enters daily lag measures (revenue, covers)          │
│  • Views team performance                               │
│  • Receives alerts and recommendations                  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     TEAM MEMBERS                         │
│  • Logs behaviors via tablet/app                        │
│  • Views personal scoreboard                            │
│  • Receives tips and training                           │
│  • Provides anonymous feedback                          │
└─────────────────────────────────────────────────────────┘
```

### Role Types in Detail

#### Revenue-Generating Roles (Frontline)

| Role | Primary Focus | Key Behaviors | Impact KPIs |
|------|---------------|---------------|-------------|
| **Server** | Upselling | Suggest appetizer, dessert, wine | Average Check, Revenue |
| **Bartender** | Premium sales | Suggest premium spirits, cocktails | Average Check, Revenue |
| **Host** | Guest experience | Greet warmly, manage wait times | Customer Rating |
| **Cashier** | Transaction upsell | Suggest add-ons at checkout | Average Transaction |

#### Cost-Control Roles (Back of House)

| Role | Primary Focus | Key Behaviors | Impact KPIs |
|------|---------------|---------------|-------------|
| **Purchaser** | Vendor management | Compare vendor prices, verify invoices | Cost of Sales |
| **Chef/Kitchen** | Food cost | Menu engineering, portion control, 86 alternatives | Food Cost % |
| **Accountant** | Cash flow | A/R follow-up, invoice processing, accruals | Cash Flow, A/R Days |
| **Facilities** | Utilities | Monitor usage, maintenance scheduling | Utility Cost |

### Day in the Life: Server

```
SHIFT START (4:00 PM)
├── Logs into tablet at POS station
├── Sees: "Your stats: 15 behaviors yesterday, $58 avg check, Rank #3"
├── Sees: "Today's upsell focus: Chocolate Lava Cake, Pinot Noir"
└── Attends daily briefing (training topic: wine pairing)

DURING SHIFT (4:00 PM - 10:00 PM)
├── Table 1: Suggests wine → Accepted → Scans receipt, logs behavior
├── Table 2: Suggests appetizer → Declined → Logs attempt anyway
├── Table 3: Suggests dessert → Accepted → Scans receipt, logs behavior
├── ... continues through shift ...
└── AI Coach pops up: "Great work! 12 behaviors so far, avg check trending up!"

SHIFT END (10:00 PM)
├── Final receipt scan
├── Sees daily summary: "18 behaviors, $62 avg check (+$4 vs yesterday)"
├── Weekly feedback prompt: "What's holding you back?" → Submits anonymously
└── Logs out
```

### Day in the Life: Manager

```
PRE-SHIFT (3:30 PM)
├── Opens manager dashboard
├── Sees: Yesterday's revenue vs target, behavior adoption rate
├── Reviews AI insights: "Staff member #4 logged 25 behaviors but avg check flat - verify"
└── Prepares daily briefing materials

DAILY BRIEFING (3:45 PM)
├── Opens briefing flow on tablet
├── Reviews: Reservations, VIPs, 86'd items
├── Announces: Today's upsell items (food + beverage)
├── Delivers: Training topic (2-minute wine pairing video)
├── Takes attendance: Checks boxes for present staff
└── Marks briefing complete

DURING SHIFT
├── Observes staff - are they actually suggesting?
├── Spot checks behavior logs vs actual receipts
├── Verifies pending behavior logs (bulk verify or individual)
└── Receives real-time alerts if anomalies detected

END OF DAY (10:30 PM)
├── Enters lag measures: Total revenue, total covers
├── Reviews: Today's scoreboard (who performed best)
├── Sees: AI summary - "Revenue up 8% vs same day last year"
└── Reviews weekly report on Sunday
```

### Day in the Life: Owner

```
MORNING CHECK (8:00 AM)
├── Opens owner dashboard on phone
├── Sees: Yesterday's KPIs vs targets
├── Sees: Week-to-date performance vs budget
├── Sees: Behavior adoption rate (are people using the system?)
└── Reviews any critical alerts

WEEKLY REVIEW (Sunday evening)
├── Reviews weekly report
├── Sees: Which behaviors correlated with KPI improvements
├── Sees: Top performers and underperformers
├── Sees: Anonymous team feedback themes
├── Decides: Adjust behaviors? Add training? Change incentives?
└── Plans next week's focus

MONTHLY REVIEW
├── Reviews month vs same month last year
├── Calculates: Behavior ROI (did behaviors pay off?)
├── Reviews: Budget variance
├── Plans: Next month's targets and focus areas
└── Recognizes: Top performer of the month (incentive payout)
```

---

## 5. Core Concepts Defined

### 5.1 Behaviors (Lead Measures)

A **Behavior** is a specific, repeatable action that a team member performs that is expected to drive a business outcome.

#### Behavior Anatomy

```yaml
Behavior:
  name: "Suggest Wine Pairing"
  description: "Offer a wine recommendation to every dinner guest"
  category: REVENUE          # REVENUE, COST_CONTROL, QUALITY, COMPLIANCE
  frequency: PER_SHIFT       # PER_SHIFT, PER_DAY, PER_WEEK, PER_MONTH
  target: 10                 # Expected number per frequency period
  points: 5                  # Gamification points per logged behavior
  roles: [SERVER, BARTENDER] # Which roles perform this behavior
  impactedKpi: AVERAGE_CHECK # Which KPI this is expected to impact
  verificationRequired: true # Does manager need to verify?
  script: "May I suggest a wine to complement your meal? Our sommelier recommends..."
```

#### Behavior Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **REVENUE** | Increase sales | Upsell, cross-sell, suggestive selling |
| **COST_CONTROL** | Reduce expenses | Vendor comparisons, waste reduction, portion control |
| **QUALITY** | Improve service | Greeting standards, response times, cleanliness |
| **COMPLIANCE** | Follow procedures | Safety checks, documentation, inventory counts |

#### Behavior Frequency Options

| Frequency | Use When | Example |
|-----------|----------|---------|
| **PER_SHIFT** | Action should happen every shift | Upsell suggestions |
| **PER_DAY** | Daily accountability | Kitchen ticket time checks |
| **PER_WEEK** | Weekly tasks | Vendor price comparisons |
| **PER_MONTH** | Monthly reviews | Menu engineering analysis |

### 5.2 KPIs (Lag Measures)

A **KPI** (Key Performance Indicator) is a measurable business outcome that the owner wants to improve.

#### KPI Categories

| Category | KPIs | Owner Selects |
|----------|------|---------------|
| **Revenue Metrics** | Total Revenue, Average Check, Covers, RevPASH | 1-2 focus KPIs |
| **Profitability** | GOP, Net Profit, Prime Cost | Optional |
| **Cost Metrics** | Cost of Sales %, Food Cost %, Labor %, Beverage Cost % | If cost-focused |
| **Operational** | Table Turnover, Kitchen Ticket Time, Inventory Turnover | If efficiency-focused |
| **Customer** | Rating (Google/TripAdvisor), NPS, Repeat Rate | If experience-focused |
| **Financial** | Cash Flow, A/R Days, Budget Variance | If finance-focused |

### 5.3 Benchmarks (Historical Reference)

**Benchmarks** establish the baseline against which current performance is measured.

#### How Benchmarks Are Set

```
SETUP QUESTION: "What was your total revenue last year?"
ANSWER: $600,000

SETUP QUESTION: "How many days per week are you open?"
ANSWER: 6 days

CALCULATION:
- Days open per year: 6 × 52 = 312 days
- Average daily revenue: $600,000 ÷ 312 = $1,923/day
- This becomes the BENCHMARK

NOW:
- Every day's revenue is compared to $1,923
- Winning = Above benchmark
- Losing = Below benchmark
```

#### Benchmark Types

| Benchmark | Calculation | Use |
|-----------|-------------|-----|
| **Daily Revenue Benchmark** | Last year revenue ÷ Days open | Compare daily performance |
| **Average Check Benchmark** | Historical avg check | Measure upsell effectiveness |
| **Cost of Sales Benchmark** | Historical CoS % | Measure cost control |
| **Monthly Revenue Benchmark** | Same month last year | Month-over-month comparison |

### 5.4 Game State

The **Game State** indicates whether the business is winning or losing against its targets.

```
Game States:
┌─────────────────────────────────────────────────────────┐
│  CELEBRATING  │  >100% of target                        │
│               │  "You hit your goal! Keep it going!"   │
├───────────────┼─────────────────────────────────────────┤
│  WINNING      │  ≥95% of target                         │
│               │  "Great work! You're on track!"        │
├───────────────┼─────────────────────────────────────────┤
│  NEUTRAL      │  90-95% of target                       │
│               │  "Keep pushing - you're close!"        │
├───────────────┼─────────────────────────────────────────┤
│  LOSING       │  <90% of target                         │
│               │  "We need to focus - let's go!"        │
└───────────────┴─────────────────────────────────────────┘
```

### 5.5 Adoption Rate

**Adoption Rate** measures how consistently the team is performing expected behaviors.

```
Formula:
Adoption Rate = (Behaviors Logged ÷ Expected Behaviors) × 100

Example:
- 5 servers on shift
- Each expected to do 10 upsells per shift
- Expected behaviors: 5 × 10 = 50
- Actual behaviors logged: 42
- Adoption Rate: 42 ÷ 50 = 84%

Thresholds:
- ≥95%: GREEN (Excellent adoption)
- 90-95%: ORANGE (Moderate - needs attention)
- <90%: RED (Poor - action required)
```

### 5.6 Verification

**Verification** is the process by which managers confirm that logged behaviors actually occurred.

#### Verification Levels

1. **Self-Reported**: Staff logs behavior, no verification needed
2. **Manager Verified**: Manager must confirm each log
3. **Evidence-Based**: Receipt/photo must be attached

#### Verification Workflow

```
Staff logs behavior
       │
       ▼
┌─────────────────┐
│ Pending Queue   │
│ (Manager sees)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 VERIFY    REJECT
    │         │
    ▼         ▼
 Counts    Flagged
 toward    for
 score     review
```

### 5.7 Daily Briefing

The **Daily Briefing** is a 15-minute pre-shift meeting where the manager aligns the team.

#### Briefing Structure

| Segment | Duration | Content |
|---------|----------|---------|
| **Yesterday's Results** | 2 min | Revenue, avg check, top performer |
| **Today's Focus** | 2 min | Reservations, VIPs, special events |
| **86'd Items** | 2 min | What's not available, alternatives |
| **Upsell Focus** | 3 min | Today's food & beverage recommendations |
| **Training Topic** | 3 min | Short skill-building moment |
| **Attendance** | 2 min | Confirm who's here |
| **Rally** | 1 min | Motivational close |

### 5.8 Scoreboard

The **Scoreboard** is a public display showing team performance.

#### Scoreboard Elements

```
┌────────────────────────────────────────────────────────┐
│                 TODAY'S PERFORMANCE                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│   REVENUE: $1,250         TARGET: $1,923    [65%]     │
│   ════════════════════════░░░░░░░░░░                  │
│                                                        │
│   TEAM BEHAVIORS: 45      ADOPTION: 90%               │
│                                                        │
├────────────────────────────────────────────────────────┤
│                    LEADERBOARD                         │
├────────────────────────────────────────────────────────┤
│   #1  BRIT    │  12 behaviors  │  $59.89 avg check   │
│   #2  JOEL    │  10 behaviors  │  $53.92 avg check   │
│   #3  KOEN    │   8 behaviors  │  $53.03 avg check   │
└────────────────────────────────────────────────────────┘
```

#### Owner Configuration Options

| Setting | Options | Privacy Note |
|---------|---------|--------------|
| **Show Revenue** | Yes/No | Some owners prefer not to show |
| **Show Average Check** | Yes/No | Less sensitive than revenue |
| **Show Behaviors Only** | Yes/No | Focus on lead measures only |
| **Anonymize Names** | Yes/No | Show "Server #1" vs "Joel" |
| **Refresh Interval** | 1-60 min | How often to update |

---

## 6. KPI Definitions & Calculations

### 6.1 Revenue Metrics

#### Total Revenue
```
Definition: Total sales for a period
Calculation: Sum of all transactions
Input: Daily entry by manager OR POS integration
Frequency: Daily
Benchmark: Same period last year OR average daily
```

#### Average Check
```
Definition: Average spend per customer
Calculation: Total Revenue ÷ Number of Covers
Input: Revenue + Covers entered daily
Frequency: Daily
Benchmark: Historical average (e.g., $52)
Target: Increase by X% through upselling

Example:
- Today's revenue: $5,000
- Today's covers: 100
- Average check: $5,000 ÷ 100 = $50.00
- Benchmark: $52.00
- Variance: -$2.00 (-3.8%)
```

#### Covers
```
Definition: Number of guests served
Calculation: Count of customers
Input: Manager enters daily
Frequency: Daily
Note: If restaurant, = number of people who ate
      If retail, = number of transactions
```

#### RevPASH (Revenue Per Available Seat Hour)
```
Definition: Revenue efficiency metric
Calculation: Revenue ÷ (Seats × Hours Open)
Input: Requires seat count and hours
Frequency: Daily
Use: Compare efficiency across time periods
```

### 6.2 Cost Metrics

#### Cost of Sales Percentage
```
Definition: Cost of goods as percentage of revenue
Calculation: (Cost of Goods Sold ÷ Revenue) × 100
Input: Monthly from invoices
Frequency: Monthly
Target: 30-35% for restaurants
Impacted by: Purchaser behaviors, waste reduction

Example:
- Revenue: $100,000
- COGS: $32,000
- CoS%: 32%
```

#### Food Cost Percentage
```
Definition: Food cost as percentage of food revenue
Calculation: (Food Cost ÷ Food Revenue) × 100
Input: Monthly
Frequency: Monthly
Target: 28-32%
Impacted by: Portion control, menu engineering, purchasing
```

#### Labor Cost Percentage
```
Definition: Labor expense as percentage of revenue
Calculation: (Total Labor Cost ÷ Revenue) × 100
Input: From payroll
Frequency: Bi-weekly or monthly
Target: 25-30%
```

### 6.3 Profitability Metrics

#### Gross Operating Profit (GOP)
```
Definition: Profit after controllable expenses
Calculation: Revenue - COGS - Labor - Controllables
Input: Calculated from other inputs
Frequency: Monthly
Target: 40%+ for hotels, 15-20% for restaurants

Controllable Expenses include:
- Paper supplies
- China/glassware
- Maintenance
- Utilities
- Marketing
```

#### Prime Cost
```
Definition: COGS + Labor (biggest controllable costs)
Calculation: (COGS + Labor) ÷ Revenue × 100
Input: Calculated
Frequency: Monthly
Target: <65%
```

### 6.4 Operational Metrics

#### Kitchen Ticket Time
```
Definition: Average time from order to plate delivery
Calculation: Average(Plate Time - Order Time)
Input: Manual tracking or POS timestamps
Frequency: Per shift
Target: <15 minutes for entrees
Impact: Faster = more table turns = more revenue
```

#### Table Turnover
```
Definition: How many times a table is used per shift
Calculation: Covers ÷ Number of Seats
Input: Calculated from covers and seat count
Frequency: Daily
Target: 2-3 turns for dinner
```

### 6.5 Customer Metrics

#### Customer Rating
```
Definition: Average rating on review platforms
Source: Google, TripAdvisor, Yelp
Input: Manual entry or API integration
Frequency: Weekly check
Target: 4.5+ stars
Note: Lag measure - reviews come after experience
```

#### Review Frequency
```
Definition: How often new reviews are posted
Calculation: Reviews per month
Input: Manual tracking
Target: Consistent flow of recent reviews
Behavior: "Ask for review" behavior drives this
```

### 6.6 Financial Metrics

#### Cash Flow
```
Definition: Money in vs money out
Calculation: Cash In - Cash Out
Input: From accounting
Frequency: Weekly/Monthly
Impacted by: A/R collection behaviors
```

#### A/R Days Outstanding
```
Definition: Average days to collect receivables
Calculation: (Accounts Receivable ÷ Revenue) × Days in Period
Input: From accounting
Frequency: Monthly
Target: <30-60 days
Impacted by: Accountant follow-up behaviors
```

#### Budget Variance
```
Definition: Actual vs Budget difference
Calculation: ((Actual - Budget) ÷ Budget) × 100
Input: Budget set at period start, actual tracked
Frequency: Monthly
Alert: Notify if >5% over budget
```

### 6.7 Utility Metrics

#### Utility Cost Percentage
```
Definition: Total utility expense as percentage of revenue
Calculation: (Total Utility Cost ÷ Revenue) × 100
Input: Monthly utility bills (electric, gas, water)
Frequency: Monthly
Target: 3-5% of revenue (varies by industry)
Impacted by: Facilities behaviors (meter readings, HVAC scheduling)

Example:
- Monthly Revenue: $100,000
- Electric: $2,500
- Gas: $800
- Water: $400
- Total Utilities: $3,700
- Utility Cost %: 3.7%
```

#### Utility Cost Per Cover
```
Definition: Utility cost normalized by guest count
Calculation: Total Utility Cost ÷ Total Covers
Input: Utility bills + cover counts
Frequency: Monthly
Use: Accounts for seasonal volume variation
Target: Industry-specific (e.g., $0.50-1.00/cover for restaurants)

Example:
- Monthly Utilities: $3,700
- Monthly Covers: 4,500
- Cost per Cover: $0.82
```

#### Energy Efficiency Index
```
Definition: Utility cost compared to baseline (same month last year)
Calculation: (Current Utility Cost ÷ Baseline Utility Cost) × 100
Input: Current + historical utility data
Frequency: Monthly
Target: <100% (lower = more efficient)
Note: Adjust for weather variations in extreme climates

Weather Adjustment (optional):
- Track heating/cooling degree days
- Normalize comparison across years
```

#### Key Utility Behaviors That Impact This KPI:
```
Facilities Role:
- Daily meter readings → Early detection of spikes
- HVAC schedule verification → Prevent after-hours waste
- Lights-off walkthrough → Reduce unnecessary usage
- Equipment maintenance → Prevent efficiency losses

All Staff:
- Turn off lights when leaving area
- Report equipment issues promptly
- Follow open/close procedures
```

---

## 7. Role-Specific Behavior Templates

### 7.1 Server / Bartender (Revenue-Focused)

| Behavior | Target | Script | Impact KPI |
|----------|--------|--------|------------|
| **Suggest Appetizer** | 10/shift | "May I recommend starting with our signature [item]?" | Avg Check |
| **Suggest Dessert** | 10/shift | "Save room for our famous [item] - it's the perfect finish!" | Avg Check |
| **Wine Pairing** | 8/shift | "This pairs beautifully with [wine]. May I bring a glass?" | Avg Check |
| **Premium Upsell** | 5/shift | "Would you prefer our premium [spirit] in that?" | Avg Check |
| **Ask for Review** | 3/shift | "If you enjoyed your experience, we'd love a Google review!" | Rating |
| **Check Back** | Every table | "How is everything? Can I bring anything else?" | Rating |
| **Learn Guest Name** | 5/shift | Use name in conversation | Repeat Rate |

### 7.2 Purchaser (Cost-Focused)

| Behavior | Target | Description | Impact KPI |
|----------|--------|-------------|------------|
| **Vendor Price Comparison** | 3/week | Compare prices from 3 vendors for top products | Cost of Sales |
| **Invoice Verification** | Daily | Check invoices against delivery receipts | Cost of Sales |
| **Spot Price Check** | 5/week | Verify unit prices haven't crept up | Cost of Sales |
| **Contract Review** | 1/month | Review vendor contracts for better terms | Cost of Sales |
| **Alternative Sourcing** | 2/week | Find alternatives for high-cost items | Cost of Sales |

### 7.3 Chef / Kitchen (Quality & Cost)

| Behavior | Target | Description | Impact KPI |
|----------|--------|-------------|------------|
| **Portion Check** | 10/shift | Verify portions match spec | Food Cost |
| **86 Alternative Ready** | Per item | Have substitute for each 86'd item | Avg Check |
| **Ticket Time Monitor** | Ongoing | Keep tickets under target time | Table Turns |
| **Waste Log** | End of shift | Document all waste with reason | Food Cost |
| **Menu Engineering Review** | 1/week | Analyze item profitability | Food Cost |
| **Walk-In Inventory Check** | Daily | Check stock levels, note shortages | Cost of Sales |

### 7.4 Accountant (Financial)

| Behavior | Target | Description | Impact KPI |
|----------|--------|-------------|------------|
| **A/R Follow-Up Call** | 5/day | Call overdue accounts | A/R Days |
| **Invoice Processing** | Daily | Process all incoming invoices | Cash Flow |
| **Expense Accrual** | Monthly | Accrue for unpaid invoices | Budget Accuracy |
| **Bank Reconciliation** | Weekly | Match bank to books | Cash Flow |
| **Vendor Payment Review** | Weekly | Ensure timely payment (avoid late fees) | Cash Flow |

### 7.5 Facilities (Operational)

| Behavior | Target | Description | Impact KPI |
|----------|--------|-------------|------------|
| **Utility Reading** | Daily | Record electric/water meter readings | Utility Cost |
| **HVAC Schedule Check** | Daily | Verify HVAC runs only during hours | Utility Cost |
| **Lights-Off Walkthrough** | End of day | Ensure all non-essential lights off | Utility Cost |
| **Maintenance Log** | Ongoing | Document all repairs and costs | Maintenance Cost |
| **Equipment Check** | Weekly | Verify all equipment functioning | Downtime |

---

## 8. The Correlation Model

### What Is Correlation?

**Correlation** measures the relationship between behavior frequency and KPI movement.

```
High Positive Correlation:
- More behaviors → Higher KPIs
- Example: More upsells → Higher average check

Low/No Correlation:
- More behaviors → No KPI change
- Example: Staff logs behaviors but avg check flat
- ALERT: Either behaviors aren't real OR wrong behaviors

Negative Correlation:
- More behaviors → Lower KPIs
- Example: Pushy upselling → Lower customer ratings
- ACTION: Retrain or change approach
```

### Correlation Calculation

```
Weekly Analysis:
1. Count behaviors logged this week
2. Measure KPI this week vs last week
3. Compare:
   - If behaviors UP and KPI UP → Positive correlation
   - If behaviors UP and KPI FLAT → No correlation (investigate)
   - If behaviors UP and KPI DOWN → Negative correlation (retrain)

Statistical Approach (Advanced):
- Calculate Pearson correlation coefficient
- Values: -1 (negative) to +1 (positive)
- >0.7 = Strong positive
- 0.3-0.7 = Moderate positive
- <0.3 = Weak/no correlation
```

### Time Lag Consideration

```
Some behaviors have immediate impact:
- Upsell wine → Same-day revenue increase

Some behaviors have delayed impact:
- Vendor negotiation → Next month's CoS decrease
- Training topic → Gradual skill improvement

System accounts for this:
- Revenue behaviors: Compare same day
- Cost behaviors: Compare next period
- Training: Compare 30-day rolling average
```

### AI Correlation Insights (Examples)

**Positive Insight:**
```
"Great news! This week your team logged 245 upsell behaviors
(+15% vs last week). Your average check increased from $52 to $57 (+9.6%).
Keep focusing on these lead measures - they're working!"
```

**Warning Insight:**
```
"Alert: Joel logged 50 behaviors this week but his average check
actually decreased by 3%. Either the behaviors aren't being performed
accurately, or guests aren't responding. Recommend: Shadow Joel's
tables to observe actual upselling technique."
```

**Strategy Insight:**
```
"Analysis: Wine suggestions have 0.82 correlation with avg check increase.
Dessert suggestions have only 0.31 correlation.
Recommendation: Focus training on wine pairing. Consider changing
dessert approach or featuring different items."
```

---

## 9. Data Entry & Verification

### 9.1 Staff Data Entry (Behavior Logging)

#### Option A: Receipt Scanning (Recommended)
```
Flow:
1. Staff serves table
2. Closes check in POS
3. Opens Topline app on tablet near POS
4. Taps their icon (or enters PIN)
5. Scans receipt with camera
6. AI extracts: Table #, covers, total amount
7. Staff selects: Which behavior(s) performed
8. Staff confirms: Upsell accepted? [Yes/No]
9. Submits
10. Done in <10 seconds
```

#### Option B: Manual Entry
```
Flow:
1. Staff taps their icon on tablet
2. Enters: Table # (optional)
3. Enters: Number of covers
4. Enters: Total check amount
5. Selects: Behavior performed
6. Confirms: Accepted? [Yes/No]
7. Submits
```

### 9.2 Manager Data Entry (Lag Measures)

#### Daily Entry (End of Shift)
```
Fields:
- Date (auto-filled)
- Total Revenue (required)
- Total Covers (required)
- Notes (optional)

Optional Per-Staff Entry:
- Staff Name | Revenue | Covers | Avg Check (calculated)
```

#### Why Per-Staff Matters
```
If you only have totals:
- Team made $5,000 with 100 covers
- Average check: $50.00

If you have per-staff:
- Joel: $2,000 / 30 covers = $66.67 avg check ✓
- Maria: $1,500 / 35 covers = $42.86 avg check ⚠
- Kim: $1,500 / 35 covers = $42.86 avg check ⚠

Now you know who's actually performing!
```

### 9.3 Verification Process

#### Manager Verification Queue
```
Daily Review:
1. Open "Pending Verification"
2. See list of behavior logs
3. For each:
   - View: Staff name, behavior, time, receipt image
   - Action: Verify / Reject / Flag
4. Bulk verify option for trusted staff
```

#### Verification Rules
```
Auto-Verify If:
- Receipt attached with matching amount
- Staff has >90% historical accuracy
- Behavior count reasonable for shift length

Require Review If:
- No receipt attached
- Unusually high behavior count
- Amount doesn't match behavior type
```

---

## 10. Fraud Detection & Accountability

### The Fraud Problem

Staff can lie about behaviors:
- "I suggested wine to every table" → But average check is flat
- Logs 50 behaviors but check amounts don't support it

### Detection Mechanisms

#### 1. Behavior vs. KPI Correlation Alert
```
Trigger: High behaviors + Flat/declining KPIs

Example Alert:
"WARNING: Joel logged 75 upsell behaviors this week.
However, his average check decreased from $55 to $48.
Statistical probability this is accurate: LOW

Recommended Action:
- Shadow Joel's tables during next shift
- Review receipt images vs. logged behaviors
- Discuss discrepancy in 1:1"
```

#### 2. Statistical Anomaly Detection
```
Flags:
- Behavior count > 2 standard deviations from team average
- Behavior count inconsistent with shift length
- Pattern of high behaviors with no receipt images
- Sudden spike in behaviors (was logging 10, now logging 50)
```

#### 3. Receipt Verification
```
AI checks:
- Is there actually a wine on this receipt? (if wine upsell logged)
- Does check total match entered amount?
- Is receipt date/time consistent with log time?
```

### Accountability Framework

```
Week 1: Establish baseline
- Everyone logs behaviors
- No judgment yet
- Gather data

Week 2+: Monitor patterns
- Who logs consistently?
- Who's logs correlate with results?
- Who shows anomalies?

Monthly Review:
- "Joel has 92% verification rate and +12% avg check"
- "Maria has 45% verification rate and -3% avg check" ← Needs coaching

Action Levels:
1. Warning: AI alerts manager
2. Discussion: Manager talks to staff
3. Training: Provide additional coaching
4. Performance: Include in performance review
```

---

## 11. AI Operations & Insights

### 11.1 AI Provider Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AI ABSTRACTION LAYER                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Supported Providers:                                   │
│   ├── OpenAI (GPT-4)                                    │
│   ├── OpenRouter (multiple models)                       │
│   ├── Anthropic (Claude)                                │
│   └── Local models (future)                             │
│                                                          │
│   Config:                                                │
│   {                                                      │
│     "provider": "openrouter",                           │
│     "model": "anthropic/claude-3-opus",                 │
│     "fallback": "openai/gpt-4"                          │
│   }                                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Structured Outputs with Zod

All AI responses are validated with Zod schemas to ensure reliable structure.

```typescript
// Example: Insight Generation Schema
const InsightSchema = z.object({
  type: z.enum(['success', 'warning', 'action', 'info']),
  title: z.string().max(100),
  description: z.string().max(500),
  metric: z.object({
    name: z.string(),
    currentValue: z.number(),
    previousValue: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'flat'])
  }).optional(),
  recommendations: z.array(z.string()).max(3),
  affectedRoles: z.array(z.string()),
  priority: z.enum(['high', 'medium', 'low'])
});
```

### 11.3 AI Use Cases

#### 1. Behavior Suggestions
```
Trigger: Role configured without behaviors
Input: Role type, industry, current KPIs
Output: Suggested behaviors with targets

Example Prompt:
"For a {roleType} in a {industry} business currently tracking
{kpis}, suggest 5 specific behaviors that could improve {targetKpi}.
For each behavior, provide: name, description, suggested daily target,
expected KPI impact, and a suggested script."
```

#### 2. Correlation Analysis
```
Trigger: Weekly analysis job
Input: Week's behavior logs + KPI data
Output: Correlation report

Example Prompt:
"Analyze the following data:
- Behavior logs: {behaviorData}
- KPI values: {kpiData}
- Historical baseline: {baseline}

Identify:
1. Which behaviors show positive correlation with KPIs
2. Which behaviors show no/negative correlation
3. Any anomalies in individual staff data
4. Recommendations for next week's focus"
```

#### 3. Training Topic Generation
```
Trigger: Daily briefing preparation
Input: Recent performance data, weak areas
Output: Training topic with content

Example Prompt:
"Based on performance data showing {weakArea}, generate a 2-minute
training topic for today's briefing. Include: title, key points,
example script, and one practice exercise."
```

#### 4. Weekly Report Insights
```
Trigger: End of week
Input: Full week's data
Output: Executive summary

Sections:
- Performance highlights
- Areas of concern
- Top performers
- Behavior adoption summary
- Recommendations for next week
```

#### 5. Anonymous Feedback Synthesis
```
Trigger: When feedback collected
Input: Anonymous feedback entries
Output: Themed summary for owner

Example:
"5 staff members submitted feedback this week.
Common themes:
1. Missing ingredients (3 mentions) - Staff unable to upsell
2. Peak hour staffing (2 mentions) - Too busy to suggest
Recommendation: Address inventory gaps; consider peak scheduling"
```

### 11.4 AI Response Validation

```typescript
async function getAIInsight(data: InsightInput): Promise<Insight> {
  const prompt = buildPrompt(data);
  const rawResponse = await aiProvider.generate(prompt);

  // Validate response structure
  const parseResult = InsightSchema.safeParse(rawResponse);

  if (!parseResult.success) {
    // Log error, use fallback
    logger.error('AI response validation failed', parseResult.error);
    return generateFallbackInsight(data);
  }

  return parseResult.data;
}
```

---

## 12. Gamification & Incentives

### 12.1 Points System

```
Every behavior logged earns points:
- Standard behavior: 5 points
- Verified behavior: 10 points
- Behavior with evidence: 15 points
- Behavior that converts (accepted): 20 points

Points visible on:
- Personal dashboard
- Team scoreboard
- Weekly reports
```

### 12.2 Leaderboard

```
Leaderboard Rankings:

By Behaviors:
#1 Joel    - 125 behaviors - 1,250 points
#2 Maria   - 110 behaviors - 1,100 points
#3 Kim     -  95 behaviors -   950 points

By Average Check:
#1 Joel    - $62.50 avg check (+$10.50 vs baseline)
#2 Kim     - $58.20 avg check (+$6.20 vs baseline)
#3 Maria   - $54.00 avg check (+$2.00 vs baseline)
```

### 12.3 Owner-Configurable Incentives

```yaml
Incentive Options:
  weekly_behavior_leader:
    enabled: true
    reward: "$50 gift card"
    criteria: "Most verified behaviors"

  monthly_avg_check_champion:
    enabled: true
    reward: "$100 bonus"
    criteria: "Highest average check (min 100 covers)"

  team_goal_bonus:
    enabled: true
    reward: "Team dinner"
    criteria: "Team hits monthly revenue target"
    threshold: 100%  # of monthly target
```

### 12.4 Recognition Moments

```
Daily:
- "Today's leader so far: Joel with 15 behaviors!"
- Displayed on scoreboard

Weekly:
- "This week's top performer: Maria - $2,450 in tips earned!"
- Email/notification to team

Monthly:
- "Employee of the Month: Joel"
- Bonus payout
- Recognition in team meeting
```

### 12.5 Avoiding Demotivation

```
Design Principles:
1. Don't shame poor performers publicly
   - Show top 3 only
   - Private feedback for those struggling

2. Multiple ways to win
   - Behaviors leader
   - Average check leader
   - Most improved
   - Consistency award

3. Team goals alongside individual
   - "If we all hit 90% adoption, team bonus!"
   - Encourages helping each other

4. Progress recognition
   - "You improved 15% this week!"
   - Even if not #1, recognize growth
```

---

## 13. Onboarding & Setup

### 13.1 Pre-Qualification Questionnaire

Before system setup, a questionnaire assesses business readiness.

```yaml
Questions:

1. Industry Type:
   - Restaurant
   - Retail
   - Hospitality
   - Hardware/Home Improvement
   - Gas Station/Convenience
   - Spa/Salon
   - Other

2. Revenue Growth (Last 3 Years):
   - Growing year over year
   - Flat/stable
   - Declining
   - Don't know

3. Cost Concerns:
   - Costs are under control
   - Costs have been increasing
   - Major cost concerns
   - Don't track closely

4. Team Engagement:
   - Team is highly engaged
   - Moderate engagement
   - Low engagement
   - High turnover

5. Current Training:
   - Daily briefings happen
   - Weekly meetings
   - Occasional training
   - No structured training

6. Incentive Programs:
   - Performance bonuses exist
   - Recognition programs
   - No incentives currently
   - Considering implementing

7. Technology Comfort:
   - Team uses apps daily
   - Some comfort with tech
   - Low tech adoption
   - Concern about tech
```

#### Scoring & Recommendations

```
Calculate scores (0-100) for:
- Revenue Health
- Cost Management
- Team Engagement

Based on scores, recommend:
- Focus areas (revenue vs cost)
- Behavior templates to start with
- Training needs
- Expected timeline to see results
```

### 13.2 Organization Setup Wizard

#### Step 1: Business Profile
```
Fields:
- Organization name
- Industry type
- Number of locations
- Number of employees
- Operating days per week
```

#### Step 2: Baseline Metrics
```
Fields:
- Last year's total revenue
- Current year revenue (YTD)
- Average check (if known)
- Gross Operating Profit % (if known)
- Cost of Sales % (if known)

System Calculates:
- Daily revenue benchmark
- Average check benchmark (or estimates from industry)
```

#### Step 3: KPI Selection
```
Question: "What do you want to improve?"

Options (select 1-3):
□ Increase Revenue (focus: upselling behaviors)
□ Improve Average Check (focus: suggestive selling)
□ Reduce Cost of Sales (focus: purchasing behaviors)
□ Improve Customer Ratings (focus: service behaviors)
□ Better Cash Flow (focus: accounting behaviors)
□ Lower Utility Costs (focus: facilities behaviors)

For each selected, set target:
- Current: $52 avg check
- Target: $58 avg check (+11.5%)
```

#### Step 4: Role Configuration
```
Question: "Which roles will use Topline?"

Frontline (Revenue):
□ Server
□ Bartender
□ Host
□ Cashier

Back of House (Cost):
□ Purchaser
□ Chef/Kitchen
□ Accountant
□ Facilities

For each selected role:
- Assign from behavior templates
- Set targets (use defaults or customize)
```

#### Step 5: Team Setup
```
Add Team Members:
- Name
- Email
- Role
- PIN (4 digits for quick login)

Permissions:
- Staff: Log behaviors, view own stats
- Supervisor: Verify, view team stats, daily entry
- Admin: All settings, reports, configuration
```

#### Step 6: Review & Launch
```
Summary:
- 1 location configured
- 3 KPIs being tracked
- 5 team members added
- 12 behaviors activated
- Daily revenue benchmark: $1,923

[Launch Topline] →
```

---

## 14. Device Strategy

### 14.1 Recommended Setup

```
┌─────────────────────────────────────────────────────────┐
│                    DEVICE DEPLOYMENT                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   POS Station Area:                                      │
│   ┌─────────────────┐                                   │
│   │  Shared Tablet  │  ← Staff logs behaviors here      │
│   │  (iPad/Android) │                                   │
│   └─────────────────┘                                   │
│                                                          │
│   Back Office:                                           │
│   ┌─────────────────┐                                   │
│   │  Manager Device │  ← Verification, daily entry      │
│   │  (Tablet/Laptop)│                                   │
│   └─────────────────┘                                   │
│                                                          │
│   Public Area (optional):                                │
│   ┌─────────────────┐                                   │
│   │   TV Scoreboard │  ← Motivational display           │
│   │   (Chromecast)  │                                   │
│   └─────────────────┘                                   │
│                                                          │
│   Owner (Remote):                                        │
│   ┌─────────────────┐                                   │
│   │  Phone/Computer │  ← Dashboard, reports             │
│   └─────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 14.2 Why Not Personal Phones?

```
Concerns:
1. Privacy - Some staff don't want work apps on personal devices
2. Policy - Many businesses prohibit phones on floor
3. Distraction - Personal phones = social media temptation
4. Consistency - Shared device = consistent experience
5. Cost - Business provides device, not staff

Exceptions:
- Manager may use personal phone for remote checks
- Owner definitely uses personal phone/computer
```

### 14.3 Tablet Interface Design

```
Staff View (Simple, Fast):
┌─────────────────────────────────────────────────────────┐
│  [Joel]  [Maria]  [Kim]  [Alex]  [Sam]  [+]            │
│─────────────────────────────────────────────────────────│
│                                                          │
│          [Photo]                                         │
│           JOEL                                           │
│      12 behaviors today                                  │
│      $58.50 avg check                                   │
│      Rank #2                                             │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  [SCAN RECEIPT]  or  [QUICK LOG]               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Recent:                                                 │
│  • Table 5 - Wine upsell ✓ - 2 min ago                 │
│  • Table 3 - Dessert upsell ✓ - 15 min ago             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 14.4 Quick Login (PIN)

```
No email/password for staff.
4-digit PIN for fast switch:

[Joel] taps their icon →
┌─────────────────┐
│  Enter PIN      │
│  ● ● ○ ○        │
│  [1][2][3]     │
│  [4][5][6]     │
│  [7][8][9]     │
│     [0]        │
└─────────────────┘

→ 2 seconds, logged in
→ After 5 min idle, auto-logout
```

---

## 15. Business Model

### 15.1 Pricing Structure

```
Setup Fee: $1,000 USD (one-time)
Includes:
- Questionnaire & analysis
- Intake meeting
- System configuration
- Team training session (1 hour)
- First month support

Monthly Licenses:
- $50/user/month
- Minimum 3 users
- Volume discounts: 10+ users = $40/user

Example Business:
- 1 Owner (admin): $50
- 1 Manager (supervisor): $50
- 5 Staff (loggers): $250
- Total: $350/month
- Annual: $4,200 + $1,000 setup = $5,200 first year
```

### 15.2 Performance Fee (Optional)

```
Revenue Share:
- 1% of incremental revenue (year over year)
- Only charged if business revenue increases
- Capped at 2x annual license fees OR $10,000 (whichever is lower)

Example 1 (Small Business):
- Last year revenue: $500,000
- This year revenue: $600,000
- Increment: $100,000
- Performance fee calculation: $1,000 (1% of $100K)
- Annual license fees: $4,200 (7 users)
- Cap: $8,400 (2x license)
- Actual fee: $1,000 (under cap)

Example 2 (Large Growth):
- Last year revenue: $1,000,000
- This year revenue: $1,500,000
- Increment: $500,000
- Performance fee calculation: $5,000 (1% of $500K)
- Annual license fees: $6,000 (10 users)
- Cap: $10,000 (hard cap applies)
- Actual fee: $5,000 (under cap)

Rationale:
- Aligns incentives (we win when you win)
- If revenue doesn't grow, no performance fee
- Cap protects businesses with exceptional growth
- Fair exchange for value delivered
```

### 15.3 License Types

| License | Features | Use Case |
|---------|----------|----------|
| **Staff** | Log behaviors, view own stats | Servers, bartenders, team |
| **Supervisor** | + Verify logs, view team, daily entry | Managers |
| **Admin** | + All settings, reports, configuration | Owners |

### 15.4 Add-On Services

```
Consulting:
- Monthly review call: $200/month
- On-site visit: $500/visit
- Custom behavior design: $300 per role

Training:
- Additional team training: $200/session
- Refresher training: $150/session
- New manager onboarding: $100/session
```

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **4DX** | 4 Disciplines of Execution - framework by Franklin Covey |
| **Adoption Rate** | Percentage of expected behaviors actually logged |
| **Average Check** | Total revenue divided by number of covers |
| **Behavior** | A specific action that drives business outcomes (lead measure) |
| **Benchmark** | Historical baseline for comparison |
| **Covers** | Number of guests served |
| **Game State** | Whether business is winning/losing against targets |
| **GOP** | Gross Operating Profit |
| **KPI** | Key Performance Indicator (lag measure) |
| **Lag Measure** | Outcome metric that reflects past performance |
| **Lead Measure** | Predictive activity that drives results |
| **Scoreboard** | Public display of team performance |
| **Verification** | Manager confirmation that behavior actually occurred |

---

## Appendix B: Industry Benchmarks

| Industry | Avg Check | Food Cost | Labor | GOP |
|----------|-----------|-----------|-------|-----|
| Fine Dining | $75-150 | 28-32% | 30-35% | 15-20% |
| Casual Dining | $25-50 | 30-35% | 28-32% | 10-15% |
| Fast Casual | $12-20 | 28-32% | 25-30% | 12-18% |
| Bar/Nightclub | $20-40 | 20-25% | 20-25% | 20-30% |
| Hotel F&B | $40-80 | 30-35% | 35-40% | 35-45% |
| Retail | $30-100 | 50-60% | 15-20% | 15-25% |

---

## Appendix C: AI-Driven Industry Scaffolding

### How Industry Adaptation Works

When a business onboards, the AI doesn't just pick from pre-built templates—it **generates** the entire scaffolding appropriate to their specific context:

```
INPUT: "I run a boutique hotel with 45 rooms and a small restaurant"

AI GENERATES:
├── Industry Context
│   ├── Primary KPIs: RevPAR, ADR, Occupancy Rate, F&B Revenue
│   ├── Secondary KPIs: Guest Satisfaction, Repeat Rate
│   └── Cost KPIs: Labor %, F&B Cost %, Utility Cost per Occupied Room
│
├── Role Scaffolding
│   ├── Front Desk → Check-in behaviors, upgrade offers, local recommendations
│   ├── Housekeeping → Room completion time, quality checklist, maintenance reports
│   ├── F&B Staff → Upsell behaviors (same as restaurant)
│   └── Maintenance → Preventive maintenance logs, response time tracking
│
├── Language Customization
│   ├── "Covers" → "Guests"
│   ├── "Average Check" → "Average Daily Rate" (for rooms)
│   ├── "Table Turnover" → "Room Turnover"
│   └── Scripts use hospitality terminology
│
└── Benchmark Generation
    ├── Industry-appropriate targets
    ├── Seasonality considerations
    └── Comparable property benchmarks
```

### Scaffolding Generation Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCAFFOLDING GENERATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INDUSTRY CLASSIFICATION                                      │
│     └── AI analyzes business description                        │
│     └── Maps to industry taxonomy                               │
│     └── Identifies hybrid models (hotel + restaurant)           │
│                                                                  │
│  2. KPI GENERATION                                               │
│     └── Core KPIs for this industry                             │
│     └── Custom KPIs based on business specifics                 │
│     └── Calculation formulas                                    │
│                                                                  │
│  3. ROLE GENERATION                                              │
│     └── Standard roles for industry                             │
│     └── Custom roles based on staff description                 │
│     └── Role-appropriate permissions                            │
│                                                                  │
│  4. BEHAVIOR GENERATION                                          │
│     └── High-impact behaviors per role                          │
│     └── Industry-specific scripts                               │
│     └── Realistic targets                                       │
│                                                                  │
│  5. LANGUAGE CUSTOMIZATION                                       │
│     └── Industry terminology mapping                            │
│     └── UI label customization                                  │
│     └── Report language adjustment                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Industry Examples

**Professional Services (Accounting Firm)**
```yaml
kpis:
  - Utilization Rate
  - Realization Rate
  - WIP Turnover
  - Client Retention
behaviors:
  - Log billable time within 24 hours
  - Review invoice before sending
  - Schedule client check-in call
  - Cross-sell additional service
language:
  covers: "clients"
  average_check: "average engagement value"
  table: "client account"
```

**Field Services (Landscaping)**
```yaml
kpis:
  - Jobs Per Day
  - Revenue Per Hour
  - Equipment Uptime
  - Customer Satisfaction
behaviors:
  - Complete job checklist
  - Log equipment maintenance
  - Capture completion photo
  - Upsell additional service
language:
  covers: "jobs"
  average_check: "average job value"
  table: "work order"
```

**Healthcare (Dental Practice)**
```yaml
kpis:
  - Production Per Hour
  - Case Acceptance Rate
  - Patient Retention
  - Treatment Completion
behaviors:
  - Present treatment plan
  - Schedule follow-up appointment
  - Complete patient notes same-day
  - Verify insurance coverage
language:
  covers: "patients"
  average_check: "average case value"
  table: "appointment"
```

### Self-Improving Scaffolding

The AI doesn't stop at initial generation. It continuously improves:

```
Week 1: AI generates initial behaviors
        ↓
Week 4: System analyzes which behaviors correlate with KPIs
        ↓
Week 8: AI suggests behavior modifications
        "Wine pairing suggestions show 0.82 correlation with avg check.
         Dessert suggestions show only 0.31 correlation.
         RECOMMENDATION: Replace dessert script with appetizer upsell."
        ↓
Ongoing: Behaviors evolve based on what actually works for THIS business
```

---

*This document serves as the foundational product specification for Topline. All technical implementation, user flows, and feature development should reference this document.*
