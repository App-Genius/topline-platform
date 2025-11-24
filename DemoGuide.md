# Topline Demo Guide

This application is a high-fidelity prototype of **Topline**, a business optimization system that gamifies "Lead Measures" (Behaviors) to drive "Lag Measures" (Revenue).

## How to Run
```bash
cd web
npm run dev
```
Open `http://localhost:3000`.

## The Demo Flow

You can navigate the entire app using the **"Demo Scenarios"** bar at the bottom of the screen.

### 1. Setup Phase (`/setup`)
- **Action:** Enter historical revenue ($600,000) and Days Open (312).
- **Result:** Calculates the "Daily Revenue Target" ($1,923). This becomes the baseline for the entire team to beat.

### 2. The Staff Experience (`/staff`)
- **Persona:** A waiter or retail associate (Joel).
- **Features:**
  - **AI Coach:** Click the pink banner. It gives specific, actionable advice ("Push desserts today").
  - **Logging:** Click "Upsell Wine". Notice the **Friction Log**—you must enter a Table # and Check Amount. This prevents "fake" logging (Fraud).
  - **Stats:** See real-time personal stats vs the team.

### 3. The Scoreboard (`/scoreboard`)
- **Persona:** The "TV" in the kitchen or back office.
- **Features:**
  - Real-time "Today's Revenue" vs Target.
  - Leaderboard showing who is performing the behaviors.
  - **Visuals:** Green/Red coding based on whether the team is winning or losing.

### 4. Manager Audit (`/manager`)
- **Persona:** Shift Supervisor.
- **Features:**
  - **Lag Entry:** Enter total revenue/covers for the shift.
  - **Audit:** Click on a staff member (e.g., Joel) to see their logged behaviors.
  - **Verification:** Mark specific logs as "Verified" against the printed receipt.

### 5. Strategy & AI (`/strategy`)
- **Persona:** Business Owner / GM.
- **Features:**
  - **Weekly Review:** See how behaviors correlated with revenue last week.
  - **AI Calibration:** Toggle between **Restaurant** and **Retail** modes. The AI suggests relevant behaviors (e.g., "Suggest Premium Spirits" vs "Companion Items").

### 6. Intelligence Dashboard (`/admin`)
- **Persona:** The Investor / Owner.
- **Features:**
  - **Correlation Engine:** A chart overlaying "Behaviors" (Blue) vs "Avg Check" (Green).
  - **AI Insight:** Explicitly tells you if the strategy is working ("High Correlation detected").

## Live Simulations (Bottom Bar)

Use the buttons at the bottom to instantly change the data story:

1.  **High Performance:**
    - Sets data to show High Behavior Count + High Average Check.
    - *Check `/admin`:* "Strong Correlation" and Positive AI Insight.
    - *Check `/scoreboard`:* Team is Winning (Green).

2.  **Low Adherence:**
    - Sets data to show Low Behavior Count + Low Average Check.
    - *Check `/admin`:* "Weak Correlation" and Warning Insight.
    - *Check `/scoreboard`:* Team is Losing (Red).

3.  **Suspicious Activity (Fraud):**
    - Sets data to show High Behavior Count but LOW Revenue.
    - *Check `/admin`:* "Fraud Alert: Behaviors high but results flat."
    - *Check `/manager`:* See Joel's logs flagged for audit.
