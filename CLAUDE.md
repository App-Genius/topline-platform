# Topline Project Instructions

## Overview

Topline is a **behavior-driven business optimization platform** built on the 4DX (Four Disciplines of Execution) framework. It connects daily team member behaviors (lead measures) to business outcomes (lag measures) across any industry.

**Core Philosophy**: Revenue is the outcome you want. Behaviors are the inputs you control. Track the behaviors, watch the outcomes improve.

---

## Project Structure

```
topline/
├── apps/
│   ├── api/          # Hono API server (business logic)
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types, calculations, schemas
├── docs/             # Comprehensive specifications
└── tests/            # Test infrastructure
```

---

## Documentation Reference

Before implementing any feature, consult the relevant documentation:

| Document | When to Reference |
|----------|------------------|
| `docs/01-PRODUCT-VISION.md` | Understanding core concepts |
| `docs/05-DATABASE-SCHEMA.md` | Database structure and relationships |
| `docs/06-API-SPECIFICATION.md` | API endpoint contracts |
| `docs/08-CALCULATION-ENGINE.md` | KPI calculations and formulas |
| `docs/09-AI-OPERATIONS.md` | AI integration patterns |
| `docs/12-IMPLEMENTATION-ROADMAP.md` | Feature priorities and phases |
| `docs/13-TESTING-STRATEGY.md` | **Testing requirements and patterns** |

---

## Specialized Agents

Project-specific agents are defined in `.claude/agents/`. Use them to ensure thoroughness:

| Agent | When to Use | Purpose |
|-------|-------------|---------|
| `feature-implementer` | Implementing any feature | Ensures complete implementation with all tests |
| `test-writer` | After implementing, or when coverage is low | Writes comprehensive tests with edge cases |
| `code-reviewer` | Before marking anything complete | Reviews for quality, security, architecture |
| `test-fixer` | When tests fail | Debugs and fixes test failures properly |
| `completion-checker` | Before claiming feature is done | Final gate - verifies nothing is left undone |
| `schema-migrator` | Any database schema change | Handles Prisma migrations safely |

### Agent Workflow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AGENT-ASSISTED DEVELOPMENT                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────┐     ┌─────────────────────┐                         │
│  │ feature-implementer │     │  schema-migrator    │ ◄─ If DB changes needed │
│  └──────────┬──────────┘     └──────────┬──────────┘                         │
│             │                           │                                     │
│             └─────────┬─────────────────┘                                     │
│                       ▼                                                       │
│            ┌─────────────────────┐                                           │
│            │    test-writer      │ ── Ensures comprehensive test coverage    │
│            └──────────┬──────────┘                                           │
│                       │                                                       │
│                       ▼                                                       │
│            ┌─────────────────────┐                                           │
│            │   code-reviewer     │ ── Reviews for quality and security       │
│            └──────────┬──────────┘                                           │
│                       │                                                       │
│                  ┌────┴────┐                                                 │
│                  │ Issues? │                                                 │
│                  └────┬────┘                                                 │
│                       │                                                       │
│              YES ◄────┴────► NO                                              │
│               │              │                                               │
│               ▼              ▼                                               │
│         ┌──────────┐  ┌─────────────────────┐                               │
│         │test-fixer│  │ completion-checker  │ ── Final verification         │
│         └────┬─────┘  └──────────┬──────────┘                               │
│              │                   │                                           │
│              └───────► LOOP ◄────┴───────────► COMPLETE                     │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### How to Invoke Agents

Agents are invoked automatically when:
1. Task matches the agent's description
2. You explicitly request: "Use the code-reviewer agent"
3. The workflow requires specialized handling

**Example**:
```
> Implement the bulk verification feature from the roadmap
[Claude uses feature-implementer agent automatically]

> Review my changes
[Claude uses code-reviewer agent]

> Tests are failing, fix them
[Claude uses test-fixer agent]

> Is this feature complete?
[Claude uses completion-checker agent]
```

---

## Agentic Development Workflow

### The Build-Test-Review-Fix Loop

When implementing features, follow this continuous loop:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AGENTIC DEVELOPMENT LOOP                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌────────┐ │
│  │UNDERSTAND│───►│IMPLEMENT│───►│  TEST   │───►│ VERIFY  │───►│COMPLETE│ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └────────┘ │
│       │              │              │              │                     │
│       │              │              ▼              │                     │
│       │              │         ┌─────────┐        │                     │
│       │              │         │  FAIL?  │────────┘                     │
│       │              │         └─────────┘                              │
│       │              │              │                                    │
│       │              ◄──────────────┘                                    │
│       │                   Fix & Retry                                    │
│       │                                                                  │
│       ▼                                                                  │
│  Read docs/                                                              │
│  Identify endpoints                                                      │
│  Note test scenarios                                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase Details

#### 1. UNDERSTAND
- Read the relevant specification from `docs/`
- Identify which API endpoints are affected
- Note the test scenarios needed (multi-role, edge cases)
- Check existing tests for patterns

#### 2. IMPLEMENT
- Write the feature code following architecture patterns
- Follow the patterns in `apps/web/CLAUDE.md` for frontend
- Use hooks for data fetching, never direct API calls
- Add inline documentation for complex logic

#### 3. TEST
- **Write unit tests** for any pure functions (calculations, validations)
- **Write HTTP scenario tests** for the feature flow
- **Include multi-role tests** if feature involves role interactions
- Run tests: `npm run test`
- Fix any failures before proceeding

#### 4. VERIFY
- Run full test suite: `npm run test`
- Check coverage: `npm run test:coverage`
- Verify no regressions in existing tests
- Run E2E if touching critical paths: `npm run test:e2e`

#### 5. COMPLETE
- All tests passing
- Coverage targets met
- Code follows architecture rules
- Mark task complete, move to next

---

## Testing Requirements

### Before Any Feature is Complete

Every feature MUST have:

```markdown
## Feature Verification Checklist

### Tests Written
- [ ] Unit tests for pure functions (calculations, validation)
- [ ] HTTP scenario tests for the feature flow
- [ ] Edge case tests (empty input, invalid data, auth failures)
- [ ] Multi-role tests if feature involves role interactions

### Tests Passing
- [ ] `npm run test` passes
- [ ] No skipped tests
- [ ] Coverage meets threshold

### Architecture Compliance
- [ ] Follows patterns in apps/web/CLAUDE.md
- [ ] No direct API calls in pages
- [ ] Loading and error states handled
```

### Test Commands

```bash
# Run all unit and scenario tests
npm run test

# Watch mode during development
npm run test:unit:watch

# Run scenario tests only
npm run test:scenarios

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run real LLM tests (nightly/manual only)
npm run test:ai:real
```

### Testing Tiers

| Tier | What | When to Write | When to Run |
|------|------|--------------|-------------|
| **Unit** | Pure functions | Always for calculations | Every save |
| **HTTP Scenario** | Multi-role flows | Always for features | Every commit |
| **E2E** | Critical visual paths | Major UI changes | PR merge |
| **Real LLM** | AI integration | AI changes | Nightly |

---

## Multi-Role Testing Pattern

Topline has multi-role workflows. Tests MUST verify cross-role interactions:

```typescript
// Example: Staff logs, Manager verifies, Staff sees result
it('complete verification flow', async () => {
  // Staff logs behavior
  const log = await staff.logBehavior(behaviorId);
  expect(log.status).toBe('pending');

  // Manager sees it pending
  const pending = await manager.getPendingLogs();
  expect(pending).toContain(log);

  // Manager verifies
  await manager.verify(log.id);

  // Staff sees it verified
  const myLogs = await staff.getMyLogs();
  expect(myLogs[0].status).toBe('verified');
});
```

Use the helper classes in `tests/helpers/`:
- `StaffActions` - Staff user operations
- `ManagerActions` - Manager user operations
- `AdminActions` - Admin user operations

---

## AI Operations Testing

AI endpoints are HTTP with structured I/O. Test them like any endpoint:

```typescript
// Mock LLM for fast tests (every commit)
vi.mock('@/lib/ai/client', () => ({
  generateStructured: vi.fn().mockResolvedValue({
    behaviors: [{ name: 'Test', description: 'Test', category: 'REVENUE' }]
  })
}));

// Schema validation
const result = BehaviorSchema.safeParse(response.body);
expect(result.success).toBe(true);

// Quality assertions
expect(behavior.name.length).toBeLessThanOrEqual(50);
expect(behavior.name).toMatch(/^(Suggest|Offer|Recommend)/);
```

Real LLM tests run nightly - they validate actual AI integration works.

---

## Code Architecture Rules

### Frontend (apps/web/)

See `apps/web/CLAUDE.md` for detailed rules. Key points:

1. **Use hooks for data fetching** - Never call API directly in pages
2. **No mock data in pages** - Demo mode handled by hooks
3. **UI components from components/ui/** - Don't recreate existing components
4. **Handle loading and error states** - Always

### API (apps/api/)

1. **Route handlers contain business logic** - No complex abstractions
2. **Validation with Zod** - All inputs validated
3. **Structured errors** - Consistent error format
4. **Auth middleware** - Role-based access control

### Shared (packages/shared/)

1. **Pure functions** - Calculations, transformations
2. **Type definitions** - Shared TypeScript types
3. **Schemas** - Zod schemas for validation

---

## Implementation Workflow Example

When asked to implement "Bulk Behavior Verification":

### Step 1: Understand
```markdown
- Read docs/06-API-SPECIFICATION.md for endpoint pattern
- Read docs/13-TESTING-STRATEGY.md for test requirements
- Identify: Need POST /api/behavior-logs/bulk-verify
- Test scenarios: success, partial failure, auth, edge cases
```

### Step 2: Implement
```typescript
// apps/api/src/routes/behavior-logs.ts
app.post('/bulk-verify', authMiddleware('manager'), async (c) => {
  const { logIds, status } = await c.req.json();
  // Implementation...
});
```

### Step 3: Test
```typescript
// tests/scenarios/behavior-verification.test.ts
describe('Bulk Verification', () => {
  it('verifies multiple logs at once', async () => {
    const logs = await staff.logBehaviors([...]);
    const result = await manager.verifyAll(logs.map(l => l.id));
    expect(result.verified).toBe(3);
  });

  it('requires manager role', async () => {
    const response = await client.post('/bulk-verify', data, { token: staffToken });
    expect(response.status).toBe(403);
  });
});
```

### Step 4: Verify
```bash
npm run test          # All tests pass
npm run test:coverage # Coverage meets threshold
```

### Step 5: Complete
- Tests passing
- Coverage met
- Architecture followed
- Mark complete, move to next task

---

## Error Handling During Development

### If Tests Fail

1. **Read the error message** - Understand what's failing
2. **Check the test** - Is the expectation correct?
3. **Check the implementation** - Does it match the spec?
4. **Fix and re-run** - Don't move on until green

### If Build Fails

1. **Check TypeScript errors** - Fix type issues
2. **Check imports** - Missing dependencies?
3. **Run `npm run build`** - Verify clean build

### If Stuck

1. **Read the docs** - Answer is likely in `docs/`
2. **Check existing patterns** - How was similar feature done?
3. **Ask for clarification** - Better than guessing

---

## Feature Completion Criteria

A feature is DONE when:

1. **Code implemented** following architecture patterns
2. **Unit tests** for pure functions (95% coverage)
3. **HTTP scenario tests** for feature flow
4. **Multi-role tests** if applicable
5. **All tests passing** (`npm run test`)
6. **No regressions** in existing tests
7. **Coverage targets met**
8. **Documentation updated** if API changed

---

## Quick Reference

### Test a Calculation

```typescript
// tests/unit/calculations/kpi.test.ts
describe('calculateAverageCheck', () => {
  it('divides revenue by covers', () => {
    expect(calculateAverageCheck(5000, 100)).toBe(50);
  });
});
```

### Test an API Flow

```typescript
// tests/scenarios/my-feature.test.ts
describe('My Feature', () => {
  it('works end-to-end', async () => {
    const response = await client.post('/api/endpoint', data, { token });
    expect(response.status).toBe(200);
  });
});
```

### Test Multi-Role Interaction

```typescript
// tests/scenarios/workflow.test.ts
it('staff creates, manager approves, staff sees result', async () => {
  const item = await staffActions.create(data);
  await managerActions.approve(item.id);
  const result = await staffActions.getMyItems();
  expect(result[0].status).toBe('approved');
});
```

---

## Critical Rules (NEVER Violate)

These rules exist because of past issues. Breaking them leads to incomplete work:

### NEVER Do These Things

1. **Never claim a feature is complete without running tests**
   - Run `npm run test` and verify it passes
   - Run `npm run test:coverage` and verify coverage meets threshold

2. **Never skip writing tests**
   - Every feature needs unit tests for logic
   - Every feature needs HTTP scenario tests for flow
   - Multi-role features need multi-role tests

3. **Never leave TODO/FIXME comments without tracking**
   - If you write a TODO, create a task for it
   - Don't leave loose ends

4. **Never guess at requirements**
   - Read the docs in `docs/`
   - Check existing patterns in the codebase
   - Ask for clarification if unclear

5. **Never skip edge cases**
   - Test zero values, empty inputs, null
   - Test permission failures
   - Test cross-organization isolation

6. **Never mark complete without using completion-checker**
   - The `completion-checker` agent is the final gate
   - It verifies ALL requirements are met

### ALWAYS Do These Things

1. **Always read relevant docs before implementing**
2. **Always write tests alongside implementation**
3. **Always verify tests pass before claiming completion**
4. **Always use the specialized agents for their purposes**
5. **Always handle loading, error, and empty states in UI**

---

## Summary

**The golden rule**: Every feature needs tests. The loop is:

```
Understand → Implement → Test → Fix (if needed) → Verify → Complete
```

**Use the specialized agents**:
- `feature-implementer` - For building features
- `test-writer` - For comprehensive tests
- `code-reviewer` - For quality review
- `test-fixer` - For debugging failures
- `completion-checker` - For final verification

Tests ensure the system works as specified. Multi-role tests ensure workflows work across user types. AI tests ensure structured output. Coverage ensures thoroughness.

When in doubt, read `docs/13-TESTING-STRATEGY.md` for the complete testing approach.
