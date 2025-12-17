# Topline Architecture

This document defines the technical architecture and coding patterns for the Topline application. All code must follow these patterns.

## System Overview

Topline is a Next.js application with Server Actions for backend logic:

```
topline/
├── apps/web/          # Next.js application
│   ├── app/           # App Router pages
│   ├── actions/       # Server Actions (business logic)
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks (React Query)
│   ├── lib/           # Utilities, database, auth
│   └── prisma/        # Database schema
```

## Layer Responsibilities

### 1. Pages (`app/**/page.tsx`)

**Purpose**: Route entry points only

**Allowed**:
- Import and use data hooks
- Import and compose Feature Components
- Minimal state for UI concerns (selected item, modal open state)
- Handle loading/error states from hooks

**Forbidden**:
- Direct Server Action calls (use hooks instead)
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

### 2. Feature Components (`components/features/`)

**Purpose**: Domain-specific UI with interactions

**Allowed**:
- Import UI Components from `components/ui/`
- Import and use hooks for data
- Handle user interactions
- Emit events via callback props

**Forbidden**:
- Direct Server Action calls
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

### 3. UI Components (`components/ui/`)

**Purpose**: Pure presentational, reusable across the app

**Allowed**:
- Accept all data and handlers via props
- Internal UI state only (hover, focus, animation)
- Tailwind CSS classes

**Forbidden**:
- Hooks that fetch data
- Import Server Actions
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

### 4. Hooks (`hooks/queries/`)

**Purpose**: Data fetching, mutations, state management via React Query

**Allowed**:
- Call Server Actions
- Manage loading/error states via React Query
- Check authentication
- Handle caching/revalidation

**Forbidden**:
- Return JSX
- Import components

**Pattern**:
```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser } from "@/actions/users";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/context/AuthContext";

export function useUsers(params?: UserListParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: async () => {
      const result = await getUsers(params);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const result = await createUser(data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
```

---

### 5. Server Actions (`actions/`)

**Purpose**: Backend business logic with database access

**Allowed**:
- Database queries via Prisma
- Authentication/authorization checks
- Data validation
- Business logic

**Forbidden**:
- Import React components
- Client-side state management

**Pattern**:
```tsx
'use server'

import { prisma } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth/session'

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export async function getUsers(params?: UserListParams): Promise<ActionResult<PaginatedResponse<User>>> {
  try {
    await requireRole('MANAGER', 'ADMIN')
    const session = await requireAuth()

    const users = await prisma.user.findMany({
      where: { organizationId: session.orgId },
      include: { role: true },
      take: params?.limit ?? 50,
      skip: ((params?.page ?? 1) - 1) * (params?.limit ?? 50),
    })

    return { success: true, data: { data: users, pagination: { ... } } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
```

---

### 6. Services (`lib/services/`)

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
│                    React Query Hook (useUsers)                  │
│  - Manages cache                                                │
│  - Calls Server Actions                                         │
│  - Returns { data, isLoading, error, refetch }                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server Action (getUsers)                    │
│  - Authentication check                                         │
│  - Database query via Prisma                                    │
│  - Returns ActionResult<T>                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Prisma (lib/db.ts)                         │
│  - Type-safe database queries                                   │
│  - PostgreSQL connection                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Architecture

### Cookie-Based Sessions

Authentication uses HTTP-only cookies with signed JWTs:

```tsx
// lib/auth/session.ts
export interface SessionPayload {
  userId: string
  email: string
  orgId: string
  roleType: string
  permissions: string[]
}

// Session functions
createSession(payload)   // Set cookie on login
getSession()             // Read session from cookie
destroySession()         // Clear cookie on logout
requireAuth()            // Throw if not authenticated
requireRole(...roles)    // Throw if not authorized
```

### Auth Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│  Server     │───▶│  Set Cookie │
│   Form      │    │  Action     │    │  (HTTP-only)│
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Page      │───▶│  Hook       │───▶│  Server     │
│   Load      │    │  (Query)    │    │  Action     │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                                              ▼
                                      ┌─────────────┐
                                      │  Read       │
                                      │  Cookie     │
                                      └─────────────┘
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

// hooks/queries/useUsers.ts - Demo-aware hook
export function useUsers() {
  const { isDemoMode, mockData } = useDemo();
  const { isAuthenticated } = useAuth();

  // In demo mode, return mock data immediately
  if (isDemoMode) {
    return {
      data: mockData.users,
      isLoading: false,
      error: null,
      refetch: () => {}
    };
  }

  // In production, call Server Actions
  return useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      const result = await getUsers();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: isAuthenticated,
  });
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
| Hooks | Vitest | 90% |
| Server Actions | Vitest | 90% |
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
│   ├── actions/
│   │   └── users.test.ts
│   └── mocks/
│       └── prisma.ts
├── e2e/
│   └── flows/
│       ├── user-management.spec.ts
│       └── behavior-logging.spec.ts
```

### Test Patterns

**Server Action Test**:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUsers } from '@/actions/users';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db');
vi.mock('@/lib/auth/session', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: '1', orgId: 'org-1' }),
  requireRole: vi.fn(),
}));

describe('getUsers', () => {
  it('returns paginated users', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: '1', name: 'Test' }]);

    const result = await getUsers({ page: 1, limit: 10 });

    expect(result.success).toBe(true);
    expect(result.data?.data).toHaveLength(1);
  });
});
```

**Hook Test**:
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '@/hooks/queries/useUsers';
import { getUsers } from '@/actions/users';

vi.mock('@/actions/users');

describe('useUsers', () => {
  it('fetches users via Server Action', async () => {
    vi.mocked(getUsers).mockResolvedValue({
      success: true,
      data: { data: [{ id: '1' }], pagination: {} }
    });

    const { result } = renderHook(() => useUsers(), { wrapper: TestProviders });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.data).toHaveLength(1);
  });
});
```

---

## Error Handling

### Server Action Errors

All Server Actions return a consistent `ActionResult<T>` type:

```tsx
export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

// In Server Actions
export async function createUser(data: CreateUserInput): Promise<ActionResult<User>> {
  try {
    await requireRole('ADMIN');
    const user = await prisma.user.create({ data });
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// In hooks - convert to thrown errors for React Query
const result = await createUser(data);
if (!result.success) throw new Error(result.error);
return result.data;
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

- [ ] No direct Server Action calls in pages (use hooks)
- [ ] No `MOCK_*` constants outside DemoContext
- [ ] All data comes from hooks
- [ ] UI components from `components/ui/` used
- [ ] Loading and error states handled
- [ ] Tests written for new code
- [ ] Props typed with interfaces
- [ ] No business logic in UI components
