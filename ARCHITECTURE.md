# Topline Architecture

This document defines the technical architecture and coding patterns for the Topline application. All code must follow these patterns.

## System Overview

Topline is a monorepo containing:

```
topline/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Hono API backend
├── packages/
│   ├── db/           # Prisma client & schema
│   └── shared/       # Shared types, schemas, utilities
```

## Layer Responsibilities

### 1. Pages (`apps/web/app/**/page.tsx`)

**Purpose**: Route entry points only

**Allowed**:
- Import and use data hooks
- Import and compose Feature Components
- Minimal state for UI concerns (selected item, modal open state)
- Handle loading/error states from hooks

**Forbidden**:
- Direct API calls (`api.*`)
- Inline mock data (`const MOCK_* = {}`)
- Business logic or calculations
- More than ~50 lines of JSX

**Pattern**:
```tsx
export default function UsersPage() {
  const { data, isLoading, error, refetch } = useUsers();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error.message} />;

  return (
    <>
      <UserList users={data?.data ?? []} onEdit={setSelectedUser} />
      <UserFormModal user={selectedUser} onClose={() => setSelectedUser(null)} onSave={refetch} />
    </>
  );
}
```

---

### 2. Feature Components (`apps/web/components/features/`)

**Purpose**: Domain-specific UI with interactions

**Allowed**:
- Import UI Components from `components/ui/`
- Import and use hooks for data
- Handle user interactions
- Emit events via callback props

**Forbidden**:
- Direct API calls
- Import other Feature Components (use composition in pages)

**Pattern**:
```tsx
interface UserListProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserList({ users, isLoading, onEdit, onDelete }: UserListProps) {
  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Actions', render: (user) => <ActionButtons onEdit={() => onEdit(user)} /> }
  ];

  return <DataTable data={users} columns={columns} isLoading={isLoading} />;
}
```

---

### 3. UI Components (`apps/web/components/ui/`)

**Purpose**: Pure presentational, reusable across the app

**Allowed**:
- Accept all data and handlers via props
- Internal UI state only (hover, focus, animation)
- Tailwind CSS classes

**Forbidden**:
- Hooks that fetch data
- Import API client
- Import other feature or page components
- Business logic

**Pattern**:
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} data-testid="modal-backdrop" />
      <div className={clsx('relative bg-white rounded-xl', sizeClasses[size])}>
        <header className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="absolute top-4 right-4">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
```

---

### 4. Hooks (`apps/web/hooks/`)

**Purpose**: Data fetching, mutations, state management

**Allowed**:
- Call API client
- Manage loading/error states
- Check authentication
- Handle caching/revalidation

**Forbidden**:
- Return JSX
- Import components

**Pattern**:
```tsx
export function useUsers(filters?: UserFilters) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const result = await api.users.list(filters);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
```

---

### 5. API Client (`apps/web/lib/api-client.ts`)

**Purpose**: HTTP layer only

**Allowed**:
- Type-safe fetch wrappers
- Token management
- Request/response transformation

**Forbidden**:
- Business logic
- Caching logic (that's for hooks)

**Usage**:
```tsx
// NEVER call directly from pages
// ALWAYS use via hooks

// In hooks/useApi.ts:
import { api } from '@/lib/api-client';

export function useUsers() {
  return useApiCall(() => api.users.list());
}

// In pages:
const { data } = useUsers();  // Correct
const data = await api.users.list();  // WRONG
```

---

### 6. Services (`apps/web/lib/services/`)

**Purpose**: Business logic, calculations, transformations

**Allowed**:
- Pure functions
- Data transformations
- Analytics calculations

**Pattern**:
```tsx
// lib/services/analytics.ts
export function calculatePerformanceScore(behaviors: BehaviorLog[], target: number): number {
  const completed = behaviors.filter(b => b.verified).length;
  return Math.round((completed / target) * 100);
}

export function groupBehaviorsByUser(logs: BehaviorLog[]): Map<string, BehaviorLog[]> {
  return logs.reduce((map, log) => {
    const existing = map.get(log.userId) || [];
    map.set(log.userId, [...existing, log]);
    return map;
  }, new Map());
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Component                          │
│  - Calls hooks                                                  │
│  - Composes Feature Components                                  │
│  - Handles loading/error states                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Custom Hook (useUsers)                     │
│  - Manages state                                                │
│  - Calls API client                                             │
│  - Returns { data, isLoading, error, refetch }                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Client (api.users.*)                     │
│  - HTTP fetch                                                   │
│  - Token management                                             │
│  - Type-safe responses                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Hono API (apps/api)                        │
│  - Route handlers                                               │
│  - Validation                                                   │
│  - Database queries                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Demo Mode Architecture

Demo mode allows the app to run with mock data for sales demonstrations. **Pages should be completely unaware of demo mode.**

### Pattern

```tsx
// context/DemoContext.tsx
interface DemoContextValue {
  isDemoMode: boolean;
  scenario: DemoScenario;
  mockData: MockDataSet;
  triggerScenario: (scenario: DemoScenario) => void;
}

// hooks/useApi.ts - Demo-aware hook
export function useUsers() {
  const { isDemoMode, mockData } = useDemo();

  // In demo mode, return mock data immediately
  if (isDemoMode) {
    return {
      data: mockData.users,
      isLoading: false,
      error: null,
      refetch: () => {}
    };
  }

  // In production, fetch from API
  return useApiCall(() => api.users.list());
}

// pages/admin/users/page.tsx - Unaware of demo mode
export default function UsersPage() {
  const { data, isLoading } = useUsers();  // Works in both modes
  // ...
}
```

### Mock Data Location

- **All mock data**: `context/DemoContext.tsx`
- **Test mocks**: `__tests__/mocks/*.ts`
- **Storybook**: `*.stories.tsx`

**Never** put mock data in:
- Page files
- Feature components
- Hooks (other than DemoContext check)

---

## Testing Strategy

### Coverage Targets

| Layer | Tool | Coverage |
|-------|------|----------|
| UI Components | Vitest + Testing Library | 90% |
| Hooks | Vitest + MSW | 90% |
| Feature Components | Vitest + Testing Library | 80% |
| E2E Flows | Playwright | Critical paths |

### File Structure

```
apps/web/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Modal.test.tsx
│   │   │   └── DataTable.test.tsx
│   │   └── features/
│   │       └── UserList.test.tsx
│   ├── hooks/
│   │   └── useUsers.test.ts
│   └── mocks/
│       ├── handlers.ts
│       └── server.ts
├── e2e/
│   └── flows/
│       ├── user-management.spec.ts
│       └── behavior-logging.spec.ts
```

### Test Patterns

**UI Component Test**:
```tsx
describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test">Content</Modal>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

**Hook Test**:
```tsx
describe('useUsers', () => {
  it('fetches users', async () => {
    server.use(
      rest.get('/api/users', (_, res, ctx) => res(ctx.json({ data: [{ id: '1' }] })))
    );

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toHaveLength(1);
  });
});
```

---

## Error Handling

### API Errors

All API errors should be handled consistently:

```tsx
// lib/api-client.ts
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

// In hooks - errors are returned, not thrown
export function useUsers() {
  const [error, setError] = useState<Error | null>(null);

  try {
    const data = await api.users.list();
  } catch (e) {
    setError(e instanceof ApiError ? e : new Error('Unknown error'));
  }

  return { data, error };
}

// In pages - display errors
export default function UsersPage() {
  const { error } = useUsers();

  if (error) {
    return <ErrorAlert message={error.message} />;
  }
}
```

### Loading States

Every data-dependent UI should handle loading:

```tsx
const { data, isLoading } = useUsers();

if (isLoading) return <LoadingSpinner />;
if (!data) return <EmptyState message="No users found" />;

return <UserList users={data.data} />;
```

---

## Component Library

These UI components must be used instead of inline implementations:

| Component | Purpose | File |
|-----------|---------|------|
| `Modal` | Dialogs, forms, confirmations | `components/ui/Modal.tsx` |
| `DataTable` | Sortable, paginated tables | `components/ui/DataTable.tsx` |
| `ConfirmDialog` | Yes/No confirmations | `components/ui/ConfirmDialog.tsx` |
| `FormField` | Input with label, error | `components/ui/FormField.tsx` |
| `Select` | Dropdown selection | `components/ui/Select.tsx` |
| `Badge` | Status indicators | `components/ui/Badge.tsx` |
| `Alert` | Error/success messages | `components/ui/Alert.tsx` |
| `LoadingSpinner` | Loading indicator | `components/ui/LoadingSpinner.tsx` |
| `EmptyState` | No data placeholder | `components/ui/EmptyState.tsx` |
| `Tabs` | Tab navigation | `components/ui/Tabs.tsx` |
| `KpiCard` | Metric display cards | `components/ui/KpiCard.tsx` |

**Rule**: If a component doesn't exist, create it in `components/ui/` first, then use it.

---

## Code Review Checklist

Before merging any PR:

- [ ] No direct `api.*` calls in pages
- [ ] No `MOCK_*` constants outside DemoContext
- [ ] All data comes from hooks
- [ ] UI components from `components/ui/` used
- [ ] Loading and error states handled
- [ ] Tests written for new code
- [ ] Props typed with interfaces
- [ ] No business logic in UI components
