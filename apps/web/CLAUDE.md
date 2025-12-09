# Topline Web Application

## Project Overview

Topline is a **gamified business performance management platform** designed for service businesses (restaurants, retail) to drive revenue growth through behavioral accountability.

### The Core Philosophy

Topline is built on the principle that **revenue (the outcome you want) is driven by specific team behaviors (the inputs you control)**. This is similar to the "4 Disciplines of Execution" (4DX) framework:

- **Lag Measures** = Revenue, Average Check, Customer Ratings (outcomes - you can't directly control these)
- **Lead Measures** = Behaviors like "Upsell Wine", "Suggest Dessert", "Offer Sparkling Water" (inputs - you CAN control these)

The hypothesis: **If staff consistently execute high-value behaviors, revenue will follow.**

### The Game Mechanic

Topline turns daily performance into a **game against last year's numbers**:

1. **Setup**: Owner enters last year's revenue and days open
2. **Daily Target**: System calculates the daily revenue needed to "beat last year"
3. **Win/Lose State**: Each day, the team is either **winning** (above target) or **losing** (below target)
4. **Scoreboard**: Staff compete on a leaderboard based on behaviors logged and average check
5. **Celebration**: When records are broken, a celebration overlay triggers

### The User Personas

| Persona | Primary Goal | Key Actions |
|---------|--------------|-------------|
| **Owner** | See if we're winning | View analytics, set strategy, monitor health |
| **Manager** | Ensure accountability | Verify behavior logs, audit shifts, spot fraud |
| **Staff** | Log behaviors, compete | Log upsells, view personal stats, get AI coaching |
| **TV Mode** | Public display | Show leaderboard on restaurant TV screens |

### Business Context

The app supports multiple industries:
- **Restaurant**: Behaviors like wine upsells, dessert suggestions, sparkling water offers
- **Retail**: Can be adapted for product recommendations, warranty upsells, etc.

### Quality Guardrail

Revenue isn't everything. Topline also tracks **customer ratings** as a "guardrail" to ensure staff aren't being pushy. High behaviors + low ratings = fraud risk alert.

---

## Data Model

### Core Entities

```typescript
// A team member who logs behaviors
interface StaffMember {
  id: string
  name: string
  role: 'admin' | 'manager' | 'staff'
  avatar: string  // Initials like "JD"
}

// A trackable behavior (lead measure)
interface Behavior {
  id: string
  name: string           // "Upsell Wine"
  description: string    // "Suggest a bottle instead of glass"
  type: 'lead'
  target?: number        // Optional daily target
}

// A single behavior log entry
interface BehaviorLog {
  id: string
  staffId: string
  behaviorId: string
  timestamp: string
  metadata?: {
    tableNumber?: string
    checkAmount?: number
  }
  verified: boolean      // Manager has verified this log
}

// Daily performance entry
interface DailyEntry {
  date: string           // "2024-01-15"
  totalRevenue: number
  totalCovers: number    // Number of customers/tables
  staffStats: StaffDailyStat[]
  reviews?: Review[]     // Customer feedback
  verified: boolean
}

// Baseline targets set by owner
interface BenchmarkData {
  lastYearRevenue: number
  daysOpen: number
  baselineAvgCheck: number   // Calculated: revenue / covers
  baselineRating: number     // Target customer rating
}
```

### Game States

```typescript
type GameState = 'neutral' | 'winning' | 'losing' | 'celebrating'
```

- **neutral**: Default state, no strong performance signal
- **winning**: Today's revenue exceeds daily target (emerald UI)
- **losing**: Today's revenue below daily target (rose UI)
- **celebrating**: Record broken, triggers CelebrationOverlay

---

## Application Flow

### 1. Setup (Onboarding)
Owner enters baseline metrics → System calculates daily target

### 2. Daily Operations
- **Staff**: Log behaviors throughout shift (two-tap confirmation)
- **Manager**: Verify logs, input shift revenue/covers at end of day
- **Scoreboard**: Updates in real-time showing leaderboard

### 3. Analysis
- **Admin Dashboard**: Owner reviews trends, correlations, AI insights
- **Strategy**: Weekly planning with AI recommendations

### 4. Demo Scenarios
The DemoNav allows triggering test scenarios:
- `high_performance`: Sets winning state, high revenue, good reviews
- `low_adherence`: Sets losing state, low behaviors, poor results
- `fraud_alert`: High behaviors but bad reviews (pushy staff)
- `celebration`: Triggers victory overlay animation

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **State**: React Context (AppContext)
- **Utilities**: clsx, tailwind-merge

## Design System

**IMPORTANT**: Before creating any new UI, screens, or components, you MUST read and follow the design system:

📖 **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)**

This document contains:
- Complete color palette with semantic meanings
- Typography scale and font usage
- Spacing and layout guidelines
- Component patterns with code examples
- Interactive states and animations
- Page templates for different contexts
- Responsive breakpoints

### Key Design Principles

1. **Use semantic colors**: Emerald = success/wins, Rose = danger/losses, Amber = warnings, Blue = actions
2. **Mobile-first**: Base styles for mobile, use `md:` and `lg:` for larger screens
3. **Consistent spacing**: Use the defined spacing scale (4, 6, 8 units are most common)
4. **Dark theme for action pages**: Staff and Scoreboard use dark backgrounds
5. **Light theme for dashboards**: Admin, Manager, Strategy use light backgrounds

### Quick Component Reference

```tsx
// Standard card
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">

// Primary button
<button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl">

// Input field
<input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />

// Success badge
<span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
```

## Project Structure

```
app/
├── layout.tsx          # Root layout (Inter font, AppProvider)
├── globals.css         # Global styles, Tailwind imports
├── page.tsx            # Home/redirect
├── setup/              # Baseline configuration (onboarding)
├── admin/              # Owner dashboard with analytics
├── manager/            # Shift audit and verification
├── staff/              # Behavior logging (mobile, dark theme)
├── scoreboard/         # TV display leaderboard (dark theme)
└── strategy/           # Weekly AI-powered planning

components/
├── CelebrationOverlay.tsx  # Victory animation overlay
└── DemoNav.tsx             # Demo navigation controller
```

## Application Pages

### `/setup` - Baseline Configuration
**Theme**: Light | **Persona**: Owner (first-time)

The onboarding screen where owners enter:
- Last year's total revenue
- Number of days open
- Baseline customer rating

Calculates the **daily revenue target** that the team needs to beat.

### `/admin` - Business Intelligence Dashboard
**Theme**: Light | **Persona**: Owner

The owner's analytics hub showing:
- KPI cards (Revenue MTD, Avg Check, Behaviors, Rating)
- Revenue vs. Behaviors correlation chart
- Business health monitor (satisfaction + risk alerts)
- Recent customer feedback
- Time range selector (7d/30d/90d)

### `/manager` - Shift Audit & Verification
**Theme**: Light | **Persona**: Manager

Where managers close out shifts:
- Input shift revenue and covers
- View calculated average check
- Staff selector to filter by team member
- Behavior audit log with verification checkboxes
- Ability to mark logs as verified (accountability)

### `/staff` - Behavior Logging
**Theme**: Dark | **Persona**: Staff (mobile-first)

The frontline worker's interface:
- Staff avatar selector (demo purposes)
- Personal stats (behaviors logged, avg check)
- AI coaching nudge banner
- Behavior buttons with **two-tap confirmation** pattern
- Success animation on log completion

### `/scoreboard` - TV Leaderboard
**Theme**: Dark | **Persona**: TV Mode

Designed for display on restaurant/retail TV screens:
- Large "Winning/Losing" status indicator
- Daily revenue vs. target progress
- Team behaviors count
- Staff leaderboard with rankings (gold/silver/bronze)
- Behaviors logged and avg check per staff member

### `/strategy` - Weekly Planning
**Theme**: Light | **Persona**: Owner

AI-powered strategy session:
- Performance summary (revenue, behaviors, check)
- Behavior calibration (approve/reject based on correlation)
- AI-generated suggestions for new behaviors
- "Add to Rotation" functionality

## State Management

The app uses React Context (`AppContext`) for global state:

```tsx
interface AppState {
  gameState: 'idle' | 'celebrating'
  currentPersona: 'owner' | 'manager' | 'staff' | 'tv'
  industryContext: 'restaurant' | 'retail'
}
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all new files
- Define interfaces for component props
- Use `clsx` for conditional class names

### Components
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable patterns to `components/ui/`

### Styling
- Use Tailwind classes exclusively (no custom CSS unless necessary)
- Follow the spacing scale from DESIGN_SYSTEM.md
- Use semantic color names (emerald for success, not green)

## Common Patterns

### Conditional Styling with clsx
```tsx
import { clsx } from 'clsx'

<div className={clsx(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' ? "primary-classes" : "secondary-classes"
)}>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Page Layout Template
```tsx
<div className="min-h-screen bg-slate-50 pb-32">
  <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
    {/* Header */}
  </header>
  <main className="max-w-[1600px] mx-auto p-6 space-y-6">
    {/* Content */}
  </main>
</div>
```

## Running the Project

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Important Notes

1. **Bottom padding**: All pages need `pb-24` or `pb-32` to account for the DemoNav overlay
2. **Z-index**: DemoNav uses `z-100`, keep overlays below this or explicitly higher
3. **Dark theme pages**: Staff and Scoreboard have inverted color schemes
4. **Celebration overlay**: Triggered via `gameState: 'celebrating'` in AppContext
5. **Font**: Inter is loaded in layout.tsx and applied globally

## When Adding New Features

1. Read DESIGN_SYSTEM.md first
2. Use existing component patterns
3. Follow the color semantic system
4. Test on mobile viewport (375px)
5. Ensure proper contrast for accessibility
6. Add bottom padding for DemoNav clearance
7. Use Lucide icons (not other icon libraries)

---

## MANDATORY ARCHITECTURE RULES

**Read the full architecture guide**: [ARCHITECTURE.md](../../ARCHITECTURE.md)

These rules MUST be followed for all code changes. Violations compromise system reliability.

### Rule 1: Data Fetching - Use Hooks, Never Direct API

**FORBIDDEN - Direct API calls in pages:**
```tsx
// BAD - Never do this in a page component
useEffect(() => {
  api.users.list().then(setUsers);
}, []);
```

**REQUIRED - Use data hooks:**
```tsx
// GOOD - Always use hooks
const { data, isLoading, error, refetch } = useUsers();
```

**Why**: Hooks handle loading states, error handling, auth checks, and caching consistently.

### Rule 2: No Mock Data in Page Files

**FORBIDDEN - Inline mock data:**
```tsx
// BAD - Never define mock data in pages
const MOCK_INSIGHTS = { ... };
const MOCK_BUDGET = [ ... ];
```

**REQUIRED - Mock data locations:**
- **Demo mode**: `context/DemoContext.tsx`
- **Tests**: `__tests__/mocks/*.ts`
- **Storybook**: `*.stories.tsx` files only

**Why**: Mock data in pages creates confusion between demo/production, makes testing harder.

### Rule 3: Component Responsibility Layers

| Layer | Responsibility | Can Import | Cannot Import |
|-------|---------------|------------|---------------|
| **Pages** (`app/**/page.tsx`) | Route entry, compose features | Hooks, Feature Components | Direct API, UI Components directly |
| **Feature Components** (`components/features/`) | Domain logic, user interactions | UI Components, Hooks | Direct API |
| **UI Components** (`components/ui/`) | Pure presentation | Nothing (props only) | Hooks, API, Features |
| **Hooks** (`hooks/`) | Data fetching, mutations | API Client | Components |

### Rule 4: Component Props - Clean Interfaces

**FORBIDDEN - God components with everything:**
```tsx
// BAD - Page handles everything
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // 300+ lines of UI code...
}
```

**REQUIRED - Composed from small components:**
```tsx
// GOOD - Page composes feature components
export default function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <>
      <UserList users={data} onEdit={setSelectedUser} />
      <UserFormModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </>
  );
}
```

### Rule 5: Error Handling - Consistent Patterns

**FORBIDDEN - Swallowing errors:**
```tsx
// BAD
try { await api.users.create(data); }
catch (e) { console.log(e); }  // Silent failure
```

**REQUIRED - Proper error handling:**
```tsx
// GOOD - Using hook pattern
const { mutate, isLoading, error } = useCreateUser();

// In UI
{error && <ErrorAlert message={error.message} />}
```

### Rule 6: UI Components - Use the Library

**Before creating ANY UI element, check if it exists:**

| Need | Use Component |
|------|---------------|
| Popup/dialog | `<Modal>` from `components/ui` |
| Data listing | `<DataTable>` from `components/ui` |
| Yes/No prompt | `<ConfirmDialog>` from `components/ui` |
| Form input | `<FormField>` from `components/ui` |
| Dropdown | `<Select>` from `components/ui` |
| Status indicator | `<Badge>` from `components/ui` |
| Metric display | `<KpiCard>` from `components/ui` |
| Loading state | `<LoadingSpinner>` from `components/ui` |
| Empty list | `<EmptyState>` from `components/ui` |
| Section switching | `<Tabs>` from `components/ui` |

**If the component doesn't exist**: Create it in `components/ui/` first, then use it.

### Rule 7: Testing Requirements

**All new code MUST have tests:**

| Code Type | Required Tests | Coverage Target |
|-----------|----------------|-----------------|
| UI Components | Unit tests with Testing Library | 90% |
| Hooks | Unit tests with MSW mocking | 90% |
| Feature Components | Integration tests | 80% |
| Critical flows | E2E with Playwright | 100% of happy paths |

**Test file locations:**
- `__tests__/components/ui/*.test.tsx`
- `__tests__/hooks/*.test.ts`
- `e2e/flows/*.spec.ts`

### Rule 8: Demo Mode vs Production

**Demo mode is for sales demos ONLY. It must be invisible to production code.**

```tsx
// Hooks handle the switch internally
export function useUsers() {
  const { isDemoMode, mockData } = useDemo();

  if (isDemoMode) {
    return { data: mockData.users, isLoading: false, error: null };
  }

  return useApiCall(() => api.users.list());
}

// Pages don't know about demo mode
export default function UsersPage() {
  const { data } = useUsers(); // Works in both modes
}
```

---

## Code Review Checklist

Before submitting any code, verify:

- [ ] No direct `api.*` calls in pages (use hooks)
- [ ] No `MOCK_*` constants in page files
- [ ] All data comes from hooks
- [ ] UI components from `components/ui/` used where applicable
- [ ] Loading and error states handled
- [ ] Tests written for new code
- [ ] Component props are typed with interfaces
- [ ] No business logic in UI components

---

## File Creation Guidelines

When creating new files, follow these patterns:

### New Page
```
app/[route]/page.tsx
- Import hooks for data
- Import feature components
- Handle loading/error states
- Compose UI from components
- Keep under 50 lines of JSX
```

### New Feature Component
```
components/features/[domain]/[Component].tsx
- Receive data via props
- Handle user interactions
- Emit events via callbacks
- Import UI components only
```

### New UI Component
```
components/ui/[Component].tsx
- Pure presentational
- Fully controlled via props
- No internal data fetching
- Add to barrel export in index.ts
- Write test in __tests__/components/ui/
```

### New Hook
```
hooks/use[Resource].ts
- Handle API calls
- Manage loading/error states
- Check auth status
- Return consistent shape: { data, isLoading, error, refetch }
- Write test in __tests__/hooks/
```

---

## Enterprise Standards

### Data Fetching with React Query

All data fetching MUST use React Query (TanStack Query) via our custom hooks.

**Query Client Configuration** (`lib/query-client.ts`):
- 5 minute stale time (data considered fresh)
- 30 minute garbage collection time
- 3 retries with exponential backoff
- Offline-first network mode

**Query Key Factory** (`lib/query-keys.ts`):
```tsx
// Always use the factory for consistent cache keys
import { queryKeys } from '@/lib/query-keys';

// Examples:
queryKeys.users.all           // ['users']
queryKeys.users.list()        // ['users', 'list']
queryKeys.users.detail('123') // ['users', 'detail', '123']
queryKeys.budget.current()    // ['budget', 'current']
```

**Hook Pattern**:
```tsx
// hooks/queries/useUsers.ts
export function useUsers(params?: UserListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => api.users.list(params),
    enabled: isAuthenticated,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserInput) => api.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
```

**Available Hooks** (`hooks/queries/index.ts`):
| Hook | Purpose |
|------|---------|
| `useUsers`, `useUser`, `useCreateUser` | User management |
| `useRoles`, `useRole` | Role definitions |
| `useBehaviors`, `useLogBehavior` | Behavior tracking |
| `useBudget`, `useUpdateBudget` | Budget management |
| `useSettings`, `useUpdateSettings` | App settings |
| `useInsights`, `useRefreshInsights` | AI insights |
| `useBriefing`, `useCompleteBriefing` | Daily briefings |

---

### Accessibility Standards (WCAG 2.1 AA)

All UI components MUST meet WCAG 2.1 AA standards.

**Required ARIA Patterns**:

| Component | Requirements |
|-----------|--------------|
| Modal | Focus trap, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Button (loading) | `aria-busy="true"`, `aria-disabled="true"`, screen reader text |
| DataTable | `role="grid"`, `aria-sort`, keyboard navigation (arrows, Home, End) |
| Tabs | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| Form inputs | `aria-invalid`, `aria-describedby` for errors |
| Progress bars | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Toggles/Switches | `role="switch"`, `aria-checked` |

**Keyboard Navigation**:
- All interactive elements must be keyboard accessible
- Focus indicators must be visible (use `focus:ring-2 focus:ring-blue-500`)
- Escape closes modals and dropdowns
- Arrow keys navigate within composite widgets

**Focus Management**:
- Modal opens → focus moves to modal
- Modal closes → focus returns to trigger element
- Use `focus-trap-react` for modal focus containment

**Screen Reader Support**:
- Use `aria-live="polite"` for dynamic content updates
- Use `aria-hidden="true"` on decorative icons
- Provide `sr-only` text for icon-only buttons

**Testing**:
- Run axe-core in development
- Test with VoiceOver (Mac) or NVDA (Windows)
- Verify keyboard-only navigation works

---

### Error Handling Standards

**Error Boundary** (`components/ErrorBoundary.tsx`):
- Wraps the entire app in `layout.tsx`
- Catches React errors and displays fallback UI
- Provides retry functionality

**Query Error Handling**:
```tsx
// In pages - show error state
const { data, isLoading, error } = useUsers();

if (error) {
  return <ErrorAlert message={error.message} onRetry={refetch} />;
}
```

**Mutation Error Handling**:
```tsx
const createUser = useCreateUser();

// Option 1: Check error state
{createUser.error && <ErrorAlert message={createUser.error.message} />}

// Option 2: Handle in onError callback
const createUser = useCreateUser({
  onError: (error) => toast.error(error.message),
});
```

**Never Swallow Errors**:
```tsx
// BAD
try { await doThing(); } catch (e) { console.log(e); }

// GOOD
try { await doThing(); } catch (e) {
  console.error('Failed to do thing:', e);
  throw e; // Re-throw or handle properly
}
```

---

### Form Validation Standards

Use controlled forms with proper validation feedback.

**Pattern**:
```tsx
const [formData, setFormData] = useState({ name: '', email: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.name) newErrors.name = 'Name is required';
  if (!formData.email) newErrors.email = 'Email is required';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// In JSX
<input
  value={formData.name}
  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'name-error' : undefined}
/>
{errors.name && <span id="name-error" className="text-red-600">{errors.name}</span>}
```

---

### Performance Standards

**Bundle Size Budgets**:
- First load JS: < 150KB gzipped
- Per-route chunks: < 50KB gzipped

**React Query Optimization**:
- Use `staleTime` to prevent unnecessary refetches
- Use `enabled` to defer queries until needed
- Use `select` to transform/filter data

**Component Optimization**:
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Avoid inline object/array creation in render

---

### Security Checklist

Before deploying any feature, verify:

- [ ] No secrets in client-side code
- [ ] API calls use authenticated endpoints
- [ ] User input is validated before submission
- [ ] XSS prevention: no `dangerouslySetInnerHTML` without sanitization
- [ ] CSRF tokens included in mutations (handled by API client)
- [ ] Sensitive data not logged to console in production
- [ ] Auth state checked before protected routes

---

## Testing Strategy

### Philosophy: Test Business Logic, Not UI

For this MVP, testing focuses on code that can break user trust:
- **Calculations** that show wrong numbers
- **Data mutations** that lose or corrupt data
- **Permissions** that leak sensitive information
- **Edge cases** that crash the app

We do NOT extensively test:
- UI component styling (Button variants, colors)
- Layout and visual appearance
- Mock/demo data accuracy

### What We Test

| Priority | Category | Examples | Test Type |
|----------|----------|----------|-----------|
| **P0** | Calculations | Budget variance %, average check, margins | Unit |
| **P0** | Auth flows | Login, token refresh, logout | Unit + E2E |
| **P1** | Data mutations | Behavior verification, briefing completion | Unit |
| **P1** | Edge cases | Division by zero, null handling, empty arrays | Unit |
| **P2** | Critical user flows | Briefing flow, settings updates | E2E |
| **P2** | Cache invalidation | Data freshness after mutations | Unit |

### High-Risk Files to Test

1. `hooks/queries/useBudget.ts` - Variance calculations
2. `hooks/queries/useBriefing.ts` - Data assembly, attendance rates
3. `lib/api-client.ts` - Auth flow, token handling
4. `hooks/queries/useInsights.ts` - Metrics calculations

### Test Structure

```
__tests__/
├── hooks/queries/     # Hook unit tests (business logic)
├── mocks/             # MSW handlers for API mocking
├── utils/             # Test utilities (wrapper, helpers)
└── setup.ts           # Vitest setup with jest-dom

e2e/
├── fixtures.ts        # Auth mocking, test data
├── briefing.spec.ts   # Briefing flow E2E
├── budget.spec.ts     # Budget page E2E
└── settings.spec.ts   # Settings page E2E
```

### Running Tests

```bash
npm run test           # Unit tests (watch mode)
npm run test:run       # Unit tests (single run)
npm run test:coverage  # Unit tests with coverage report
npm run test:e2e       # Playwright E2E tests
npm run test:e2e:ui    # Playwright with UI
```

### Writing New Tests

**For hooks (business logic):**
```tsx
describe('useBudget', () => {
  it('calculates variance correctly', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.summary.variancePercent).toBeCloseTo(-4.7, 1);
  });
});
```

**For E2E (critical flows):**
```tsx
test('manager completes daily briefing', async ({ page }) => {
  await page.goto('/manager/briefing');
  await page.getByRole('tab', { name: /attendance/i }).click();
  await page.getByRole('button', { name: /complete/i }).click();
  await expect(page.getByText(/complete/i)).toBeVisible();
});
```

### What NOT to Test

- Component styling (`Button variant="primary"` renders blue)
- CSS class application
- Icon rendering
- Animation timing
- Mock data values (they're placeholders)
