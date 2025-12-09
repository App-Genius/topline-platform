# Topline: User Personas

## Overview

This document provides detailed user personas for the Topline system. Each persona includes demographics, goals, frustrations, daily workflows, and how Topline addresses their needs.

---

## Table of Contents

1. [Persona Overview](#1-persona-overview)
2. [Owner Personas](#2-owner-personas)
3. [Manager Personas](#3-manager-personas)
4. [Staff Personas](#4-staff-personas)
5. [Back Office Personas](#5-back-office-personas)
6. [User Journey Maps](#6-user-journey-maps)

---

## 1. Persona Overview

### 1.1 User Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         OWNER/ADMIN                              │
│                                                                  │
│  • Full system access                                           │
│  • Configuration control                                        │
│  • All data visibility                                          │
│  • Incentive management                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MANAGER/SUPERVISOR                          │
│                                                                  │
│  • Daily operations                                             │
│  • Behavior verification                                        │
│  • Team management                                              │
│  • KPI entry                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        STAFF/TEAM                                │
│                                                                  │
│  • Behavior logging                                             │
│  • Personal stats                                               │
│  • Limited visibility                                           │
│  • Quick interactions                                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Persona Summary

| Persona | Role | Primary Goal | Device |
|---------|------|--------------|--------|
| **Marcus** | Restaurant Owner | Grow revenue, control costs | Desktop, Phone |
| **Elena** | Multi-Unit Operator | Compare locations, scale | Desktop, Tablet |
| **David** | Floor Manager | Run smooth operations | Tablet |
| **Sarah** | Shift Supervisor | Cover for manager | Tablet |
| **Alex** | Server | Earn more tips, recognition | Shared Tablet |
| **Jordan** | Bartender | Build regulars, upsell | Shared Tablet |
| **Chris** | Host | Manage flow, seat strategically | Shared Tablet |
| **Patricia** | Purchaser | Control food costs | Desktop |
| **Michael** | Accountant | Track P&L, cash flow | Desktop |

---

## 2. Owner Personas

### 2.1 Marcus Chen - Single-Unit Restaurant Owner

#### Demographics
- **Age:** 45
- **Location:** Suburban area, population 80,000
- **Business:** Family Italian restaurant, 15 years established
- **Team Size:** 18 employees (6 FOH, 4 BOH, 1 manager)
- **Annual Revenue:** $1.2M
- **Tech Comfort:** Moderate - uses Square POS, QuickBooks

#### Background
Marcus took over his parents' restaurant 10 years ago. He's passionate about food quality and customer experience but struggles with the business side. He works 60+ hours per week, often filling in for absent staff.

#### Goals
1. **Increase revenue** without raising prices significantly
2. **Reduce his own hours** by empowering his team
3. **Understand what's working** - currently flies blind
4. **Retain good employees** in a competitive market
5. **Prepare for expansion** to a second location someday

#### Frustrations
- "I don't know if my staff are actually upselling or just taking orders"
- "My manager gives me verbal reports but I can't trust the numbers"
- "I find out about problems weeks later when I see the P&L"
- "Good servers leave because they don't see a path forward"
- "I can't be everywhere at once"

#### Day in the Life (Before Topline)
```
6:00 AM  - Wake up, check emails, worry about the day
8:00 AM  - Arrive at restaurant, review yesterday's receipts manually
9:00 AM  - Meet with chef about food costs (gut feeling discussion)
10:00 AM - Staff trickle in, no structured briefing
11:00 AM - Lunch service starts, Marcus works the floor
3:00 PM  - Catch up on admin, pay invoices
5:00 PM  - Dinner service, Marcus fills in as host
10:00 PM - Close, count cash, exhausted
11:00 PM - Home, too tired to analyze anything
```

#### Day in the Life (With Topline)
```
6:00 AM  - Wake up, check Topline dashboard on phone
         - See yesterday's results: $4,200 revenue (8% above benchmark!)
         - Note: Wine upsells up 15% - team is executing
8:00 AM  - Quick check of week's trends before heading in
10:00 AM - Manager runs briefing using Topline's training topic
         - Reviews yesterday's wins, today's focus
11:00 AM - Lunch service, staff logging behaviors on tablet
3:00 PM  - Review real-time scoreboard, send quick recognition
5:00 PM  - Dinner service, Marcus can focus on guests
         - Knows team is tracking their own behaviors
10:00 PM - Manager enters daily revenue/covers
         - System calculates avg check automatically
11:00 PM - Home, checks celebration notification
         - "Team beat benchmark 3 days in a row!"
```

#### Topline Value Proposition for Marcus
- **Visibility:** Real-time dashboard shows what's actually happening
- **Accountability:** Staff track their own behaviors, verified by manager
- **Time savings:** Automated calculations, no manual spreadsheets
- **Team engagement:** Gamification makes work more engaging
- **Peace of mind:** Data-driven decisions, not guesswork

#### Feature Priorities
1. Dashboard with KPI trends
2. Daily briefing system
3. Behavior tracking and verification
4. Budget vs actual tracking
5. AI insights and recommendations

---

### 2.2 Elena Rodriguez - Multi-Unit Operator

#### Demographics
- **Age:** 38
- **Location:** Major metropolitan area
- **Business:** 4 fast-casual restaurants under franchise
- **Team Size:** 65 employees across locations
- **Annual Revenue:** $4.5M combined
- **Tech Comfort:** High - early adopter, data-driven

#### Background
Elena started as a server, became a manager, then bought her first franchise 8 years ago. She's grown to 4 locations and has ambitions for more. She's highly analytical but overwhelmed by the complexity of managing multiple sites.

#### Goals
1. **Standardize operations** across all locations
2. **Identify underperformers** quickly (both people and locations)
3. **Scale efficiently** - add locations without proportional headcount
4. **Develop managers** who can run locations autonomously
5. **Exit strategy** - build a business that runs without her

#### Frustrations
- "Each location does things differently"
- "I spend my Mondays comparing spreadsheets from 4 managers"
- "I can't tell if a bad week is the manager or the market"
- "Training is inconsistent - what works in one location doesn't transfer"
- "My best managers get poached because I can't pay enough"

#### Day in the Life (Before Topline)
```
Monday   - Office day: Collect reports from managers, build spreadsheets
Tuesday  - Visit Location 1, spot check operations
Wednesday- Visit Location 2, handle HR issues
Thursday - Visit Location 3, review with underperforming manager
Friday   - Visit Location 4, work on expansion plans
Weekend  - Worry about what's happening at locations
```

#### Day in the Life (With Topline)
```
Monday   - Check consolidated dashboard for all 4 locations
         - Identify Location 3 is 12% below benchmark
         - Drill down: behavior adoption rate only 45%
         - Schedule call with manager to discuss
Tuesday  - Visit Location 1, use Topline data for specific coaching
         - "Your wine upsells are great, let's work on appetizers"
Wednesday- Review correlation report: dessert suggestions up, but not converting
         - Create training topic for all locations
Thursday - Video call with all managers, share best practices from data
         - Location 2's technique on wine pairing - share with others
Friday   - Strategic planning using trend data
         - Decide to delay expansion until Location 3 improves
Weekend  - Quick dashboard checks, but no fires to fight
```

#### Topline Value Proposition for Elena
- **Consolidation:** One dashboard for all locations
- **Comparison:** Benchmark locations against each other
- **Standardization:** Same behaviors, same training, same metrics
- **Manager development:** Clear performance data for coaching
- **Scalability:** Add locations without adding admin complexity

#### Feature Priorities
1. Multi-location dashboard
2. Cross-location benchmarking
3. Standardized behavior templates
4. Manager scorecards
5. Correlation analysis to find what works

---

## 3. Manager Personas

### 3.1 David Park - Floor Manager

#### Demographics
- **Age:** 32
- **Location:** Urban area
- **Experience:** 8 years in restaurants, 3 as manager
- **Reports to:** Owner (Marcus type)
- **Team Size:** 12 direct reports
- **Tech Comfort:** Good - millennial, uses apps daily

#### Background
David worked his way up from busser to server to manager. He's excellent with guests and staff but struggles with paperwork and numbers. He wants to prove himself and eventually own his own place.

#### Goals
1. **Keep the owner happy** with results
2. **Develop his team** and reduce turnover
3. **Run efficient shifts** without chaos
4. **Get recognized** for his contributions
5. **Learn the business side** to prepare for ownership

#### Frustrations
- "I know who's good, but I can't prove it with data"
- "Briefings are boring because I don't have good content"
- "I spend too much time on admin, not enough on the floor"
- "Staff think I play favorites when I give recognition"
- "Owner asks for numbers I don't have readily available"

#### Daily Workflow (With Topline)
```
10:00 AM - Arrive, check today's briefing in Topline
         - Training topic loaded: "Handling allergies"
         - Yesterday's metrics ready for review

10:30 AM - Pre-shift meeting
         - Share yesterday: "$3,800 revenue, beat benchmark!"
         - Recognize top performers (data shows Alice led upsells)
         - Today's focus: appetizer upsells (only 60% of target)
         - Quick training topic: 5 minutes on allergies

11:00 AM - Lunch service begins
         - Staff logging behaviors on tablet near POS
         - David monitors from floor, notes verifications needed

2:30 PM  - Lull between services
         - Verify morning behaviors (15 pending)
         - Flag one suspicious pattern for investigation

5:00 PM  - Dinner service
         - Quick check of scoreboard - team at 85% of daily goal
         - Encourage team: "25 more behaviors to hit target!"

10:00 PM - End of day
         - Enter revenue: $4,100 and covers: 95
         - System shows: "New high score for Thursday!"
         - Take photo of register tape as backup

10:15 PM - Review tomorrow's reservations, note VIPs
         - Close Topline, head home
```

#### Feature Priorities
1. One-click daily briefing content
2. Easy behavior verification
3. Real-time team scoreboard
4. Simple daily entry (revenue/covers)
5. Recognition tools for team

---

### 3.2 Sarah Mitchell - Shift Supervisor

#### Demographics
- **Age:** 26
- **Location:** Suburban area
- **Experience:** 4 years serving, 1 year as supervisor
- **Reports to:** Floor Manager
- **Role:** Covers when manager is off, leads shifts

#### Background
Sarah is a rising star who was promoted to supervisor. She still serves tables but also handles shift leadership duties. She's learning management on the job and often feels underprepared.

#### Goals
1. **Prove she can handle responsibility** for promotion
2. **Keep things running** when manager is off
3. **Build credibility** with peers who were recently colleagues
4. **Learn quickly** without making big mistakes

#### Frustrations
- "I don't know what I should be doing differently than before"
- "Other servers don't take me seriously yet"
- "Manager leaves and I'm lost on the admin stuff"
- "I want to do briefings but don't know what to say"

#### How Topline Helps Sarah
- **Guided briefings:** System tells her exactly what to cover
- **Clear responsibilities:** Verification queue shows what needs doing
- **Authority through data:** Recognition based on numbers, not favoritism
- **Learning:** Sees how manager uses the system, mirrors it

---

## 4. Staff Personas

### 4.1 Alex Torres - Server

#### Demographics
- **Age:** 24
- **Location:** Urban area
- **Experience:** 2 years serving
- **Shift:** Primarily dinner, 4-5 shifts per week
- **Goals:** Pay rent, save for travel, maybe restaurant management
- **Tech Comfort:** Very high - smartphone native

#### Background
Alex is in their mid-20s, working in restaurants while figuring out career direction. They're personable, good with guests, and motivated by recognition and tips. They want to do well but also want work to be engaging, not tedious.

#### Goals
1. **Maximize tips** - money is the primary motivator
2. **Get recognized** - wants to know they're doing well
3. **Have fun at work** - dreads boring, repetitive tasks
4. **Keep options open** - might pursue management, might not
5. **Quick interactions** - doesn't want to spend time on admin

#### Frustrations
- "I feel like I'm just going through the motions"
- "Manager says 'upsell more' but doesn't tell me how"
- "No one notices when I do extra"
- "Some servers are lazy but get away with it"
- "I have no idea how I compare to others"

#### Shift Workflow (With Topline)
```
4:45 PM  - Clock in, check personal dashboard on shared tablet
         - See: "Yesterday: 12 behaviors, +$18 in tips vs average"
         - Today's target: 10 behaviors
         - Current streak: 3 days

5:00 PM  - Pre-shift briefing
         - Hear: "Alex led wine upsells yesterday - nice work!"
         - Today's focus: appetizer suggestions
         - Quick training: new seasonal appetizer

5:30 PM  - First table seated
         - Suggest appetizer, guest says yes!
         - Log behavior with one tap on tablet
         - See: "+2 points, 1/10 for today"

7:00 PM  - Peak dinner
         - Continue logging as behaviors happen
         - Quick glance at scoreboard: 3rd place tonight!

9:30 PM  - Shift winding down
         - Check final score: 11 behaviors logged
         - See celebration animation: "Beat your target!"
         - Leaderboard: 2nd place for the night

9:45 PM  - Clock out, satisfied
         - Received recognition, knows they did well
         - Motivated for tomorrow
```

#### Feature Priorities
1. **One-tap logging** - must be fast, no friction
2. **Personal progress** - see my stats, my streak
3. **Leaderboard** - know where I stand
4. **Recognition** - public acknowledgment
5. **Tips correlation** - show me if this actually helps my income

---

### 4.2 Jordan Williams - Bartender

#### Demographics
- **Age:** 29
- **Location:** Urban area
- **Experience:** 6 years bartending
- **Shift:** Thursday-Sunday nights
- **Goals:** Build regular clientele, eventually open own bar
- **Tech Comfort:** Good

#### Background
Jordan is a career bartender who takes pride in craft. They have a following of regulars and know how to upsell naturally. They're skeptical of systems that feel like surveillance but open to tools that help them earn more.

#### Goals
1. **Build my book of regulars** - relationships are currency
2. **Showcase my skills** - don't want to be treated like order-taker
3. **Earn well** - this is a career, not a stepping stone
4. **Autonomy** - don't micromanage me

#### Initial Skepticism
- "I already upsell naturally, why do I need to log it?"
- "This feels like Big Brother watching me"
- "I'm not a robot, I read each customer differently"

#### How Topline Wins Jordan Over
- **Shows their value:** Data proves they outperform on premium upsells
- **Recognition:** Gets called out in briefings for technique
- **Tips correlation:** Sees clear link between logged behaviors and tip increase
- **Autonomy preserved:** Log when convenient, not forced timing
- **Shares expertise:** Manager asks them to teach technique to new staff

---

### 4.3 Chris Martinez - Host

#### Demographics
- **Age:** 21
- **Location:** Suburban area
- **Experience:** 1 year hosting, first restaurant job
- **Shift:** Primarily weekends
- **Goals:** College student, needs flexible job
- **Tech Comfort:** Very high

#### Background
Chris is a college student working part-time. They're friendly and organized but new to restaurants. They want to do a good job but aren't career-focused on hospitality.

#### Relevant Behaviors
- VIP recognition
- Wait time communication
- Reservation upsells (party size, special occasions)
- Seating optimization

#### How Topline Helps Chris
- **Clear expectations:** Knows exactly what good looks like
- **Training:** Daily topics help them learn the industry
- **Progress tracking:** Sees improvement over time
- **Low barrier:** Simple behaviors, easy to log

---

## 5. Back Office Personas

### 5.1 Patricia Wong - Purchaser

#### Demographics
- **Age:** 52
- **Location:** Suburban area
- **Experience:** 20 years in restaurant purchasing
- **Reports to:** Owner
- **Tech Comfort:** Moderate - prefers spreadsheets

#### Background
Patricia has been managing purchasing for multiple restaurants for decades. She knows every vendor, every price fluctuation, and every way to save money. She's skeptical of new systems but values anything that proves her impact.

#### Goals
1. **Control food costs** - this is her core metric
2. **Document her value** - management changes, she needs proof
3. **Reduce vendor gaming** - knows they inflate prices
4. **Predict needs** - reduce waste, reduce emergency orders

#### Behaviors Tracked
- Three-quote comparisons
- Invoice verification
- Waste documentation
- Vendor negotiation (weekly)

#### How Topline Helps Patricia
- **Tracks her work:** Every quote comparison documented
- **Shows impact:** Direct correlation to Cost of Sales %
- **Historical data:** Prove savings year over year
- **Recognition:** Finally gets credit for saving money

---

### 5.2 Michael Thompson - Accountant

#### Demographics
- **Age:** 45
- **Location:** Works remotely, serves multiple restaurants
- **Experience:** CPA with restaurant specialization
- **Role:** Part-time CFO services

#### Goals
1. **Accurate books** - clean financials
2. **Timely reporting** - monthly P&L on time
3. **Cash flow visibility** - prevent surprises
4. **Efficiency** - serves multiple clients

#### How Topline Helps Michael
- **Daily data entry** - no waiting for end of month
- **Budget tracking** - real-time variance visibility
- **Integration potential** - export to QuickBooks
- **Client reporting** - pre-built reports to share

---

## 6. User Journey Maps

### 6.1 Owner Journey: First 30 Days

```
Day 1-3: Onboarding
├── Complete questionnaire
├── Set up organization
├── Input baseline metrics (last year's revenue, avg check)
├── Configure KPIs to track
└── Create first location

Day 4-7: Team Setup
├── Add roles (Admin, Manager, Server, Host, etc.)
├── Assign behaviors to roles (use templates)
├── Add team members
├── Set up PINs for staff
└── Train manager on system

Day 8-14: Soft Launch
├── Manager runs first briefing (with support)
├── Staff start logging behaviors
├── Manager practices verification
├── Owner reviews daily data
└── Adjust targets based on reality

Day 15-21: Optimization
├── Review first correlation data
├── Identify top/bottom performers
├── Adjust behavior targets
├── Add/remove behaviors as needed
└── First weekly report generated

Day 22-30: Steady State
├── Daily routine established
├── Staff comfortable with logging
├── Manager confident with briefings
├── Owner checking dashboard regularly
└── First meaningful insights emerging
```

### 6.2 Staff Journey: Behavior Logging

```
                    ┌─────────────┐
                    │   TRIGGER   │
                    │ (e.g., guest│
                    │ says yes to │
                    │ appetizer)  │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    WALK TO TABLET      │
              │  (near POS, <10 steps) │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   TAP BEHAVIOR BUTTON  │
              │  (large, easy to find) │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │    SEE CONFIRMATION    │
              │  "+1! 5/10 today"      │
              │  (instant feedback)    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   RETURN TO SERVICE    │
              │  (total time: <15 sec) │
              └────────────────────────┘
```

### 6.3 Manager Journey: Daily Briefing

```
10:00 AM ─── Open Topline Briefing Page
             │
             ├── System shows:
             │   • Yesterday's metrics (auto-populated)
             │   • Today's training topic (scheduled)
             │   • Recommended upsell focus (AI suggestion)
             │   • Who's working today (from schedule)
             │
10:15 AM ─── Gather Team
             │
             ├── Share yesterday's results
             │   "We did $3,800, beat benchmark by 8%"
             │
             ├── Recognize top performers
             │   "Alex led wine upsells with 8 - great job!"
             │
             ├── State today's focus
             │   "Let's push appetizers - we're at 60%"
             │
             ├── Deliver training topic (5 min)
             │   "Today: handling food allergies..."
             │
             └── Confirm upsell items
                 "Food: Loaded Nachos, Drink: House Cab"
             │
10:30 AM ─── Mark Briefing Complete
             │
             ├── Check attendance boxes
             ├── Add any notes
             ├── Optional: take team photo
             └── Submit
             │
             System records:
             • Briefing completed
             • Attendees logged
             • Training delivered
```

---

## Appendix A: Persona Quick Reference

| Persona | Key Quote | Primary Metric | Biggest Win |
|---------|-----------|----------------|-------------|
| Marcus (Owner) | "I can't be everywhere" | Revenue growth | Peace of mind |
| Elena (Multi-Unit) | "Each location is different" | Cross-location comparison | Standardization |
| David (Manager) | "I can't prove it with data" | Team performance | Recognition tools |
| Sarah (Supervisor) | "I don't know what to say" | Briefing confidence | Guided content |
| Alex (Server) | "No one notices" | Personal stats | Leaderboard position |
| Jordan (Bartender) | "I already upsell" | Proven impact | Tips correlation |
| Patricia (Purchaser) | "No one sees my savings" | Cost of Sales % | Documented value |

---

## Appendix B: Feature Priority by Persona

| Feature | Owner | Manager | Staff |
|---------|-------|---------|-------|
| Dashboard | ★★★ | ★★ | ★ |
| Briefing System | ★★ | ★★★ | ★★ |
| Behavior Logging | ★ | ★★ | ★★★ |
| Verification | ★ | ★★★ | |
| Leaderboard | ★★ | ★★ | ★★★ |
| Reports | ★★★ | ★★ | ★ |
| AI Insights | ★★★ | ★★ | ★ |
| Budget Tracking | ★★★ | ★ | |
