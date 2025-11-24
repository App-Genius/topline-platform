# Product Structure: Topline (Business Optimization Tool)

Based on the provided notes and transcript, here is the structured product definition for the SaaS application.

## 1. Core Value Proposition
A "Scoreboard" and optimization tool that links **Lead Measures** (Behaviors) to **Lag Measures** (Revenue/Outcomes). It drives revenue growth by gamifying staff performance and identifying which behaviors actually move the needle.

## 2. User Roles

### A. Admin/Owner (The Strategist)
- **Goal:** See high-level trends, ROI, and business health.
- **Key Features:**
  - **Macro Dashboard:** Revenue vs. Historical Benchmark (YoY, WoW).
  - **Behavior Correlation:** Visuals showing "As behavior X increased, Average Check increased by Y%".
  - **Feedback Inbox:** View anonymous feedback from staff regarding blockers.
  - **Configuration:** Set Benchmarks (Last Year's Data), Define Behaviors (e.g., "Upsell Wine", "Suggest Dessert").

### B. Supervisor/Manager (The Coach)
- **Goal:** Accountability, data entry, and daily coaching.
- **Key Features:**
  - **Daily Log:** Interface to input Daily Revenue, Total Covers, and Staff Metrics.
  - **Team Scoreboard:** Real-time view of who is performing (Behavior Count vs. Avg Check).
  - **Shift Reports:** Auto-generated summaries to discuss in pre-shift meetings.
  - **Verification:** Ability to audit/validate staff entries (e.g., matching claimed up-sells to receipts).

### C. Team Member (The Player)
- **Goal:** Personal tracking, gamification/rewards, and feedback.
- **Key Features:**
  - **Personal Stats:** "I did 5 up-sells today, my Avg Check is $60."
  - **Quick Input:** Simple tap interface or OCR scanning of receipts to log a behavior.
  - **Anonymous Feedback:** "I couldn't upsell because we were out of X."
  - **Training/Tips:** AI-driven prompts ("Try suggesting the special to increase your avg check").

## 3. Key Modules & Views

### 1. Onboarding & Benchmarking (The Setup)
- **Historical Data Import:** Input last year's revenue and operational days to calculate the "Baseline Average Check".
- **KPI Builder:** Select industry (Restaurant, Retail, etc.) and define custom Behaviors.

### 2. The Scoreboard (Central Feature)
- **Visuals:** High-contrast leaderboard.
- **Metrics:**
  - **Lead Measure:** # of times behavior performed (e.g., "Wine Suggestion").
  - **Lag Measure:** Average Check Size, Total Revenue.
  - **Gamification:** "Player of the Week" badges.

### 3. The Intelligence Engine (AI/Analytics)
- **Correlation Analysis:** "Behavior A is being reported 50 times, but Revenue is flat. Recommendation: Check compliance or change behavior."
- **Nudges:** Automated prompts to staff/managers based on trends.
- **Training Hub:** Content suggested based on weak metrics (e.g., "How to upsell without being pushy" video).

### 4. Feedback Loop
- **Blocker Reporting:** Anonymous channel for staff to report operational issues hindering sales.

## 4. Data Architecture (Conceptual)

- **Organization:** Company -> Location -> Department (F&B, Retail Floor).
- **Users:** Linked to Organization/Department.
- **Periods:** Daily, Weekly, Monthly buckets.
- **Transactions:**
  - `date`
  - `staff_id`
  - `revenue`
  - `covers` (or transaction count)
  - `behaviors_logged` (list of specific actions)
  - `verified` (boolean)

## 5. Proposed Tech Stack (for Mockup)
- **Frontend:** React/Next.js (Responsive for mobile/tablets).
- **Styling:** Tailwind CSS (Clean, "Scoreboard" aesthetic).
- **State:** Context API or Zustand.
- **Mock Backend:** JSON file storage or SQLite for rapid prototyping.

## 6. Mockup Plan
We will build a high-fidelity prototype focusing on three key screens:
1.  **The Setup:** Inputting historical data to set the benchmark.
2.  **The Daily Entry/Scoreboard:** Where the action happens (Manager/Staff view).
3.  **The Insights Dashboard:** The "Why" screen showing the correlation between behavior and money.
