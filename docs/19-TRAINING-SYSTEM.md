# Training System Architecture

A guided walkthrough training system that provides self-service onboarding and feature education through interactive, narrated tutorials.

## Status: Architecture Defined

The flow-documenter agent is active and should be used after implementing user-facing features. The training player UI is deferred for future implementation.

---

## 1. Core Concept

### The Problem
- New users need training on how to use Topline
- Different roles (staff, manager, admin) have different workflows
- Actions in one role affect what another role sees
- Training should scale internationally without human trainers

### The Solution
A standalone training mode that:
1. Guides users through features step-by-step
2. Shows how actions cascade between roles (sequential role-switching)
3. Uses AI-generated narration (text now, speech later)
4. Generates training flows automatically as features are built

---

## 2. Architecture Overview

### System Flow

```
Feature Built → flow-documenter agent → Flow JSON → Training Player → User
                                              ↓
                                    AI Narration Generation
```

### Key Components

| Component | Location | Status |
|-----------|----------|--------|
| Flow Documenter Agent | `.claude/agents/flow-documenter.md` | Active |
| Flow JSON Files | `docs/flows/*.flow.json` | Generated per feature |
| Training Types | `packages/shared/src/types/training-flow.ts` | To implement |
| WalkthroughContext | `apps/web/context/WalkthroughContext.tsx` | To implement |
| Training Routes | `apps/web/app/training/` | To implement |
| Training Components | `apps/web/components/training/` | To implement |

---

## 3. Flow Documentation Format

### Flow JSON Schema

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "estimatedMinutes": "number",
  "roles": ["staff", "manager", "admin"],
  "prerequisites": ["flow-id"],
  "steps": [
    {
      "id": "string",
      "type": "action | observe | transition",
      "role": "staff | manager | admin",
      "route": "/path/to/page",
      "mockDataState": "scenario-name",
      "narration": {
        "text": "string",
        "audioUrl": "string (optional)"
      },
      "highlight": {
        "selector": "string",
        "position": "top | bottom | left | right"
      },
      "expectedAction": {
        "type": "click | input | navigate",
        "target": "string",
        "value": "string"
      }
    }
  ]
}
```

### Step Types

| Type | Purpose | User Action Required |
|------|---------|---------------------|
| `observe` | User looks at something | No - just read |
| `action` | User must interact | Yes - click, type, navigate |
| `transition` | Role or state switch | No - automatic |

### Example Flow

```json
{
  "id": "behavior-verification",
  "title": "Verifying Team Behaviors",
  "description": "Learn how managers verify behaviors logged by their team",
  "estimatedMinutes": 4,
  "roles": ["staff", "manager"],
  "prerequisites": ["behavior-logging"],
  "steps": [
    {
      "id": "staff-logs",
      "type": "action",
      "role": "staff",
      "route": "/staff/behaviors",
      "mockDataState": "neutral",
      "narration": {
        "text": "First, let's log a behavior as a staff member. Click 'Log Behavior'."
      },
      "expectedAction": {
        "type": "click",
        "target": "[data-testid='log-behavior-btn']"
      }
    },
    {
      "id": "role-switch",
      "type": "transition",
      "role": "manager",
      "route": "/manager/verification",
      "mockDataState": "pending_verification",
      "narration": {
        "text": "Now let's switch to the manager view to see what happens when staff log behaviors."
      }
    },
    {
      "id": "manager-sees-pending",
      "type": "observe",
      "role": "manager",
      "route": "/manager/verification",
      "mockDataState": "pending_verification",
      "narration": {
        "text": "The behavior you just logged appears here in the verification queue. Managers review these to ensure accuracy."
      },
      "highlight": {
        "selector": "[data-testid='verification-queue']",
        "position": "right"
      }
    }
  ]
}
```

---

## 4. TypeScript Types

Location: `packages/shared/src/types/training-flow.ts`

```typescript
// Step types
export type StepType = 'action' | 'observe' | 'transition';
export type TrainingRole = 'staff' | 'manager' | 'admin';
export type HighlightPosition = 'top' | 'bottom' | 'left' | 'right';
export type ActionType = 'click' | 'input' | 'navigate';

// Step components
export interface StepHighlight {
  selector: string;
  position: HighlightPosition;
}

export interface StepNarration {
  text: string;
  audioUrl?: string;
}

export interface ExpectedAction {
  type: ActionType;
  target?: string;
  value?: string;
}

// Main step interface
export interface WalkthroughStep {
  id: string;
  type: StepType;
  role: TrainingRole;
  route: string;
  mockDataState: string;
  narration: StepNarration;
  highlight?: StepHighlight;
  expectedAction?: ExpectedAction;
}

// Flow interface
export interface WalkthroughFlow {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  roles: TrainingRole[];
  prerequisites: string[];
  steps: WalkthroughStep[];
}

// User feedback
export interface StepFeedback {
  understood: boolean;
  comment?: string;
  timestamp: Date;
}

// Progress tracking
export interface FlowProgress {
  flowId: string;
  userId: string;
  completedSteps: string[];
  feedback: Record<string, StepFeedback>;
  startedAt: Date;
  completedAt?: Date;
}
```

---

## 5. WalkthroughContext Design

Location: `apps/web/context/WalkthroughContext.tsx`

### Context Value Interface

```typescript
interface WalkthroughContextValue {
  // Current state
  currentFlow: WalkthroughFlow | null;
  currentStepIndex: number;
  currentStep: WalkthroughStep | null;
  isPlaying: boolean;
  currentRole: TrainingRole;

  // Navigation
  startFlow: (flowId: string) => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  exitTraining: () => void;

  // Role management
  switchRole: (role: TrainingRole) => void;

  // Feedback
  submitFeedback: (stepId: string, feedback: StepFeedback) => void;

  // Computed values
  highlightSelector: string | null;
  narrationText: string;
  progress: number; // 0-100
  canGoNext: boolean;
  canGoPrevious: boolean;
}
```

### Implementation Notes

1. **Flow Loading**: Fetch flow JSON from `docs/flows/` or API endpoint
2. **Mock Data Integration**: Switch `DemoContext` scenario based on `step.mockDataState`
3. **Role Switching**: Update `AuthContext` mock user for role transitions
4. **Route Navigation**: Use Next.js router for `step.route` changes
5. **Highlight Coordination**: Pass selector to `TrainingOverlay` component

---

## 6. Route Structure

```
apps/web/app/training/
├── page.tsx                    # Flow selector hub
├── layout.tsx                  # WalkthroughProvider wrapper
├── [flowId]/
│   └── page.tsx                # Flow player
└── components/
    ├── TrainingOverlay.tsx     # Spotlight/highlight system
    ├── NarrationPanel.tsx      # Text + audio controls
    ├── RoleSwitch.tsx          # Role transition animation
    ├── StepProgress.tsx        # Progress bar
    ├── FeedbackCapture.tsx     # "I don't understand" button
    └── FlowCard.tsx            # Flow selection card
```

### Training Hub (`/training`)

Displays available training flows as cards:
- Flow title and description
- Estimated time
- Roles involved
- Prerequisites (with completion status)
- Start button

### Flow Player (`/training/[flowId]`)

Renders the walkthrough:
- Loads flow JSON by ID
- Wraps content in `WalkthroughProvider`
- Renders actual app pages with overlay
- Shows narration panel at bottom

---

## 7. Component Specifications

### TrainingOverlay

Based on existing `CelebrationOverlay.tsx` pattern.

```typescript
interface TrainingOverlayProps {
  highlightSelector: string | null;
  position: HighlightPosition;
  isActionStep: boolean;
  children: React.ReactNode;
}

// Features:
// - Semi-transparent backdrop (rgba(0,0,0,0.7))
// - Spotlight cutout around highlighted element
// - Tooltip positioned based on `position` prop
// - Click-through enabled when `isActionStep` is true
// - Smooth CSS transitions between highlights
```

### NarrationPanel

```typescript
interface NarrationPanelProps {
  text: string;
  audioUrl?: string;
  onNext: () => void;
  onPrevious: () => void;
  onExit: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

// Features:
// - Fixed position at bottom of screen
// - Narration text display
// - Play/pause for audio (future)
// - Previous/Next navigation buttons
// - Progress bar
// - Exit button
// - Keyboard shortcuts (arrows, escape)
```

### RoleSwitch

```typescript
interface RoleSwitchProps {
  fromRole: TrainingRole;
  toRole: TrainingRole;
  onComplete: () => void;
}

// Features:
// - Full-screen transition animation
// - Shows role icons/avatars
// - Brief explanation text
// - Auto-advances after 2-3 seconds
```

### StepProgress

```typescript
interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

// Features:
// - Horizontal step indicators
// - Current step highlighted
// - Completed steps marked
// - Clickable to jump to step (optional)
```

---

## 8. Mock Data Integration

### Extending DemoContext

Add training-specific scenarios to `apps/web/context/DemoContext.tsx`:

```typescript
const TRAINING_SCENARIOS = {
  // Empty/initial states
  'training_empty': {
    behaviorLogs: [],
    verificationQueue: [],
    scoreboard: defaultScoreboard,
  },

  // Pending verification state
  'pending_verification': {
    behaviorLogs: generatePendingLogs(3),
    verificationQueue: generateVerificationItems(3),
    scoreboard: defaultScoreboard,
  },

  // Post-verification state
  'post_verification': {
    behaviorLogs: generateVerifiedLogs(3),
    verificationQueue: [],
    scoreboard: updatedScoreboard,
  },

  // High performance demo
  'winning_state': {
    ...highPerformanceScenario,
    gameState: 'winning',
  },
} as const;
```

### State Transitions

For multi-role flows, mock data should show cause and effect:

```
Step 1 (staff): mockDataState = "training_empty"
  → User logs behavior
Step 2 (transition): mockDataState = "pending_verification"
  → Switch to manager
Step 3 (manager): mockDataState = "pending_verification"
  → Manager sees pending item
Step 4 (manager): mockDataState = "post_verification"
  → After verification
```

---

## 9. AI Narration Integration

### Phase 1: Static Text
- Narration text written by flow-documenter agent
- Displayed in NarrationPanel

### Phase 2: Text-to-Speech
- Use Web Speech API (`speechSynthesis`)
- Create `useNarration.ts` hook

```typescript
function useNarration() {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  const stop = () => speechSynthesis.cancel();
  const pause = () => speechSynthesis.pause();
  const resume = () => speechSynthesis.resume();

  return { speak, stop, pause, resume };
}
```

### Phase 3: AI-Generated Audio (Future)
- Generate narration audio via AI API
- Store as `audioUrl` in flow JSON
- Support multiple languages

---

## 10. Implementation Phases

### Phase 1: Foundation
- [ ] Create TypeScript types (`training-flow.ts`)
- [ ] Implement `WalkthroughContext`
- [ ] Create training route structure
- [ ] Build `TrainingOverlay` component
- [ ] Build `NarrationPanel` component

### Phase 2: Flow Player
- [ ] Implement flow JSON loading
- [ ] Build step navigation logic
- [ ] Implement highlight positioning
- [ ] Add keyboard navigation
- [ ] Build `StepProgress` component

### Phase 3: Multi-Role Support
- [ ] Implement role-switching mechanism
- [ ] Build `RoleSwitch` transition component
- [ ] Add mock data state switching
- [ ] Test cross-role flows

### Phase 4: First Flows
- [ ] Document existing features with flow-documenter
- [ ] Create "Logging Your First Behavior" flow
- [ ] Create "Verifying Team Behaviors" flow
- [ ] Create "Understanding Your Scoreboard" flow

### Phase 5: AI Narration
- [ ] Add Web Speech API integration
- [ ] Create `useNarration` hook
- [ ] Add audio controls to NarrationPanel
- [ ] Test across browsers

### Phase 6: Analytics & Feedback
- [ ] Track flow completion rates
- [ ] Capture "I don't understand" feedback
- [ ] Build admin dashboard for training metrics
- [ ] Iterate based on feedback

---

## 11. Development Workflow Integration

### Feature Completion Checklist

After implementing any user-facing feature:

```markdown
- [ ] Tests pass (test-writer, test-fixer)
- [ ] Code review complete (code-reviewer)
- [ ] Flow documentation generated (flow-documenter)
- [ ] Feature verified complete (completion-checker)
```

### Agent Workflow

```
feature-implementer → test-writer → code-reviewer → flow-documenter → completion-checker
```

---

## 12. File Locations Summary

```
.claude/agents/
└── flow-documenter.md          # Agent for documenting flows

docs/
├── 19-TRAINING-SYSTEM.md       # This document
└── flows/
    ├── behavior-logging.flow.json
    ├── behavior-verification.flow.json
    └── scoreboard-overview.flow.json

packages/shared/src/types/
└── training-flow.ts            # TypeScript interfaces

apps/web/
├── app/training/
│   ├── page.tsx
│   ├── layout.tsx
│   └── [flowId]/page.tsx
├── components/training/
│   ├── TrainingOverlay.tsx
│   ├── NarrationPanel.tsx
│   ├── RoleSwitch.tsx
│   ├── StepProgress.tsx
│   ├── FeedbackCapture.tsx
│   └── FlowCard.tsx
├── context/
│   └── WalkthroughContext.tsx
└── hooks/
    ├── useNarration.ts
    └── useTrainingFlow.ts
```

---

## 13. Success Criteria

1. **Self-service**: Users complete training without human assistance
2. **Multi-role clarity**: Role transitions clearly show cause and effect
3. **Generated during development**: Flows created as features are built
4. **Scalable**: Supports internationalization (text → speech → translated speech)
5. **Measurable**: Analytics track completion and confusion points
6. **Maintainable**: Flows update when features change

---

## 14. Related Documents

- [01-PRODUCT-VISION.md](./01-PRODUCT-VISION.md) - Core product concepts
- [03-USER-FLOWS.md](./03-USER-FLOWS.md) - User flow documentation
- [07-FRONTEND-ARCHITECTURE.md](./07-FRONTEND-ARCHITECTURE.md) - React patterns
- [13-TESTING-STRATEGY.md](./13-TESTING-STRATEGY.md) - Testing approach
