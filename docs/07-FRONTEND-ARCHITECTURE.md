# Topline: Frontend Architecture Specification

## Overview

This document specifies the frontend architecture for the Topline web application, including component structure, state management, design system, and implementation patterns.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Routing & Navigation](#3-routing--navigation)
4. [Component Architecture](#4-component-architecture)
5. [Design System](#5-design-system)
6. [State Management](#6-state-management)
7. [Data Fetching](#7-data-fetching)
8. [Forms & Validation](#8-forms--validation)
9. [Authentication](#9-authentication)
10. [Performance Optimization](#10-performance-optimization)
11. [Testing Strategy](#11-testing-strategy)
12. [Accessibility](#12-accessibility)
13. [Mobile Responsiveness](#13-mobile-responsiveness)

---

## 1. Technology Stack

### 1.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **React Query** | 5.x | Server state management |
| **Zod** | 3.x | Schema validation |
| **Recharts** | 3.x | Data visualization |
| **Lucide React** | Latest | Icon library |

### 1.2 Development Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Testing Library** | Component testing |
| **MSW** | API mocking |
| **ESLint** | Linting |

---

## 2. Project Structure

### 2.1 Directory Layout

```
apps/web/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Authenticated routes group
│   │   ├── layout.tsx          # Shared layout with sidebar
│   │   ├── admin/              # Owner/Admin pages
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── behaviors/
│   │   │   ├── budget/
│   │   │   ├── insights/
│   │   │   ├── roles/
│   │   │   ├── settings/
│   │   │   └── users/
│   │   ├── manager/            # Manager pages
│   │   │   ├── page.tsx        # Manager dashboard
│   │   │   ├── briefing/
│   │   │   ├── daily-entry/
│   │   │   └── verification/
│   │   ├── staff/              # Staff pages
│   │   │   ├── page.tsx        # Staff dashboard
│   │   │   └── quick-log/
│   │   └── scoreboard/         # Scoreboard display
│   │       └── page.tsx
│   ├── (auth)/                 # Auth routes group
│   │   ├── layout.tsx          # Minimal auth layout
│   │   ├── login/
│   │   └── register/
│   ├── questionnaire/          # Public questionnaire
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing redirect
│   ├── globals.css             # Global styles
│   └── error.tsx               # Error boundary
├── components/                 # React components
│   ├── ui/                     # Design system primitives
│   ├── layout/                 # Layout components
│   ├── features/               # Feature components
│   └── icons/                  # Custom icons
├── hooks/                      # Custom hooks
│   ├── queries/                # React Query hooks
│   └── mutations/              # Mutation hooks
├── lib/                        # Utility libraries
│   ├── api.ts                  # API client
│   ├── utils.ts                # Utility functions
│   └── constants.ts            # App constants
├── context/                    # React contexts
│   ├── AuthContext.tsx
│   └── AppContext.tsx
├── providers/                  # Provider components
│   └── QueryProvider.tsx
├── types/                      # TypeScript types
└── tests/                      # Test utilities
    ├── setup.ts
    └── mocks/
```

### 2.2 Import Aliases

```typescript
// tsconfig.json paths
{
  "@/*": ["./apps/web/*"],
  "@/components/*": ["./apps/web/components/*"],
  "@/hooks/*": ["./apps/web/hooks/*"],
  "@/lib/*": ["./apps/web/lib/*"],
  "@/context/*": ["./apps/web/context/*"],
  "@topline/shared": ["./packages/shared/src"]
}
```

---

## 3. Routing & Navigation

### 3.1 Route Structure

```typescript
// Route definitions
const routes = {
  // Public routes
  home: '/',
  login: '/login',
  register: '/register',
  questionnaire: '/questionnaire',

  // Staff routes
  staff: {
    dashboard: '/staff',
    quickLog: '/staff/quick-log',
  },

  // Manager routes
  manager: {
    dashboard: '/manager',
    briefing: '/manager/briefing',
    dailyEntry: '/manager/daily-entry',
    verification: '/manager/verification',
  },

  // Admin routes
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    roles: '/admin/roles',
    behaviors: '/admin/behaviors',
    budget: '/admin/budget',
    settings: '/admin/settings',
    insights: '/admin/insights',
  },

  // Scoreboard
  scoreboard: '/scoreboard',
}
```

### 3.2 Layout Groups

**`(app)` Group - Authenticated Layout:**
```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
```

**`(auth)` Group - Auth Layout:**
```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  )
}
```

### 3.3 Navigation Configuration

```typescript
// lib/navigation.ts
import { RoleType } from '@topline/shared'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType
  roles: RoleType[]
}

export const navItems: NavItem[] = [
  // Staff items
  {
    label: 'Dashboard',
    href: '/staff',
    icon: Home,
    roles: ['SERVER', 'HOST', 'BARTENDER', 'BUSSER'],
  },
  {
    label: 'Quick Log',
    href: '/staff/quick-log',
    icon: PlusCircle,
    roles: ['SERVER', 'HOST', 'BARTENDER', 'BUSSER'],
  },

  // Manager items
  {
    label: 'Dashboard',
    href: '/manager',
    icon: LayoutDashboard,
    roles: ['MANAGER'],
  },
  {
    label: 'Daily Briefing',
    href: '/manager/briefing',
    icon: ClipboardList,
    roles: ['MANAGER'],
  },
  {
    label: 'Verify Behaviors',
    href: '/manager/verification',
    icon: CheckCircle,
    roles: ['MANAGER'],
  },
  {
    label: 'Daily Entry',
    href: '/manager/daily-entry',
    icon: DollarSign,
    roles: ['MANAGER'],
  },

  // Admin items
  {
    label: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    roles: ['ADMIN'],
  },
  {
    label: 'Team',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Roles',
    href: '/admin/roles',
    icon: Shield,
    roles: ['ADMIN'],
  },
  {
    label: 'Behaviors',
    href: '/admin/behaviors',
    icon: Target,
    roles: ['ADMIN'],
  },
  {
    label: 'Budget',
    href: '/admin/budget',
    icon: Wallet,
    roles: ['ADMIN'],
  },
  {
    label: 'Insights',
    href: '/admin/insights',
    icon: Lightbulb,
    roles: ['ADMIN'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },

  // Common
  {
    label: 'Scoreboard',
    href: '/scoreboard',
    icon: Trophy,
    roles: ['ADMIN', 'MANAGER', 'SERVER', 'HOST', 'BARTENDER', 'BUSSER'],
  },
]
```

---

## 4. Component Architecture

### 4.1 Component Categories

**UI Components (`components/ui/`):**
- Atomic, reusable design system primitives
- No business logic
- Fully typed props with variants

**Layout Components (`components/layout/`):**
- Page structure components
- Consistent spacing and containers
- Navigation elements

**Feature Components (`components/features/`):**
- Business-specific components
- Composed from UI components
- May include data fetching

### 4.2 Component Template

```tsx
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500',
        ghost: 'hover:bg-slate-100 focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner className="mr-2 h-4 w-4" />
      ) : null}
      {children}
    </button>
  )
}
```

### 4.3 Feature Component Example

```tsx
// components/features/BehaviorButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useLogBehavior } from '@/hooks/mutations/useLogBehavior'
import { cn } from '@/lib/utils'

interface BehaviorButtonProps {
  behavior: {
    id: string
    name: string
    targetPerDay: number
    points: number
  }
  todayCount: number
  className?: string
}

export function BehaviorButton({
  behavior,
  todayCount,
  className,
}: BehaviorButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const logBehavior = useLogBehavior()

  const handleClick = async () => {
    setIsAnimating(true)
    await logBehavior.mutateAsync({ behaviorId: behavior.id })
    setTimeout(() => setIsAnimating(false), 500)
  }

  const progress = Math.min(todayCount / behavior.targetPerDay, 1)
  const isComplete = todayCount >= behavior.targetPerDay

  return (
    <button
      onClick={handleClick}
      disabled={logBehavior.isPending}
      className={cn(
        'relative flex flex-col items-center justify-center p-6 rounded-2xl transition-all',
        'bg-white border-2 shadow-sm hover:shadow-md',
        isComplete ? 'border-green-500 bg-green-50' : 'border-slate-200',
        isAnimating && 'scale-95',
        className
      )}
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-slate-100"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray={`${progress * 283} 283`}
          className={isComplete ? 'text-green-500' : 'text-blue-500'}
        />
      </svg>

      {/* Content */}
      <span className="text-lg font-semibold text-slate-900">
        {behavior.name}
      </span>
      <span className="text-sm text-slate-500 mt-1">
        {todayCount} / {behavior.targetPerDay}
      </span>
      <span className="text-xs text-blue-600 mt-2">
        +{behavior.points} pts
      </span>

      {/* Success animation */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl animate-ping">+1</span>
        </div>
      )}
    </button>
  )
}
```

---

## 5. Design System

### 5.1 Color Palette

```css
/* globals.css */
:root {
  /* Brand colors */
  --color-primary: 59 130 246;      /* blue-500 */
  --color-primary-dark: 37 99 235;  /* blue-600 */

  /* Semantic colors */
  --color-success: 34 197 94;       /* green-500 */
  --color-warning: 234 179 8;       /* yellow-500 */
  --color-danger: 239 68 68;        /* red-500 */

  /* Neutral colors */
  --color-slate-50: 248 250 252;
  --color-slate-100: 241 245 249;
  --color-slate-200: 226 232 240;
  --color-slate-500: 100 116 139;
  --color-slate-700: 51 65 85;
  --color-slate-900: 15 23 42;

  /* Game state colors */
  --color-winning: 34 197 94;       /* green */
  --color-losing: 239 68 68;        /* red */
  --color-neutral: 100 116 139;     /* slate */
  --color-celebrating: 234 179 8;   /* yellow/gold */
}
```

### 5.2 Typography

```css
/* Typography scale */
.text-display {
  font-size: 3rem;      /* 48px */
  line-height: 1.1;
  font-weight: 700;
}

.text-h1 {
  font-size: 2.25rem;   /* 36px */
  line-height: 1.2;
  font-weight: 700;
}

.text-h2 {
  font-size: 1.875rem;  /* 30px */
  line-height: 1.3;
  font-weight: 600;
}

.text-h3 {
  font-size: 1.5rem;    /* 24px */
  line-height: 1.4;
  font-weight: 600;
}

.text-h4 {
  font-size: 1.25rem;   /* 20px */
  line-height: 1.5;
  font-weight: 600;
}

.text-body {
  font-size: 1rem;      /* 16px */
  line-height: 1.5;
}

.text-small {
  font-size: 0.875rem;  /* 14px */
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;   /* 12px */
  line-height: 1.5;
}
```

### 5.3 Spacing Scale

```css
/* Spacing (matches Tailwind) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 5.4 Component Library

**Core Components:**

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, ghost, danger variants |
| `Input` | Text input with label, error, helper text |
| `Select` | Dropdown select with search (optional) |
| `Checkbox` | Checkbox with label |
| `Radio` | Radio button group |
| `Toggle` | Boolean toggle switch |
| `Textarea` | Multi-line text input |

**Display Components:**

| Component | Description |
|-----------|-------------|
| `Card` | Container with header, body, footer |
| `Badge` | Status indicator with variants |
| `Avatar` | User avatar with emoji support |
| `Progress` | Linear and circular progress |
| `Spinner` | Loading indicator |
| `Skeleton` | Loading placeholder |

**Overlay Components:**

| Component | Description |
|-----------|-------------|
| `Modal` | Dialog overlay with focus trap |
| `Sheet` | Slide-in panel from edge |
| `Toast` | Notification messages |
| `Tooltip` | Hover information |
| `Popover` | Click-triggered floating content |
| `DropdownMenu` | Context menu |

**Data Display:**

| Component | Description |
|-----------|-------------|
| `Table` | Data table with sorting, pagination |
| `DataList` | Key-value pair list |
| `EmptyState` | No data placeholder |
| `Chart` | Recharts wrapper |

---

## 6. State Management

### 6.1 State Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      STATE CATEGORIES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SERVER STATE (React Query)                                      │
│  ├── User data                                                  │
│  ├── Behaviors, KPIs                                            │
│  ├── Daily entries                                              │
│  └── Reports, Insights                                          │
│                                                                  │
│  CLIENT STATE (React Context)                                    │
│  ├── Auth state (current user)                                  │
│  ├── UI state (sidebar open, theme)                             │
│  ├── Game state (winning/losing)                                │
│  └── Selected location/date range                               │
│                                                                  │
│  URL STATE (Next.js Router)                                      │
│  ├── Current route                                              │
│  ├── Search/filter params                                       │
│  └── Modal/panel open state                                     │
│                                                                  │
│  FORM STATE (Local)                                              │
│  ├── Input values                                               │
│  ├── Validation errors                                          │
│  └── Submit state                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Auth Context

```tsx
// context/AuthContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User } from '@topline/shared'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  loginWithPin: (pin: string, orgId: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token')
    if (token) {
      api.setToken(token)
      fetchUser(token)
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const fetchUser = async (token: string) => {
    try {
      const user = await api.users.me()
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch {
      localStorage.removeItem('token')
      api.setToken(null)
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  const login = async (email: string, password: string) => {
    const { token, user } = await api.auth.login({ email, password })
    localStorage.setItem('token', token)
    api.setToken(token)
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }

  const loginWithPin = async (pin: string, organizationId: string) => {
    const { token, user } = await api.auth.pinLogin({ pin, organizationId })
    sessionStorage.setItem('token', token)
    api.setToken(token)
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    api.setToken(null)
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const updateUser = (updates: Partial<User>) => {
    setState(s => ({
      ...s,
      user: s.user ? { ...s.user, ...updates } : null,
    }))
  }

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithPin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 6.3 App Context

```tsx
// context/AppContext.tsx
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'

type GameState = 'winning' | 'losing' | 'neutral' | 'celebrating'

interface AppState {
  gameState: GameState
  isCelebrating: boolean
  sidebarOpen: boolean
  selectedLocationId: string | null
  dateRange: {
    start: Date
    end: Date
  }
}

type AppAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'START_CELEBRATION' }
  | { type: 'END_CELEBRATION' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'SET_LOCATION'; payload: string | null }
  | { type: 'SET_DATE_RANGE'; payload: { start: Date; end: Date } }

const initialState: AppState = {
  gameState: 'neutral',
  isCelebrating: false,
  sidebarOpen: true,
  selectedLocationId: null,
  dateRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload }
    case 'START_CELEBRATION':
      return { ...state, isCelebrating: true, gameState: 'celebrating' }
    case 'END_CELEBRATION':
      return { ...state, isCelebrating: false, gameState: 'winning' }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload }
    case 'SET_LOCATION':
      return { ...state, selectedLocationId: action.payload }
    case 'SET_DATE_RANGE':
      return { ...state, dateRange: action.payload }
    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// Convenience hooks
export function useGameState() {
  const { state, dispatch } = useApp()
  return {
    gameState: state.gameState,
    isCelebrating: state.isCelebrating,
    setGameState: (gs: GameState) => dispatch({ type: 'SET_GAME_STATE', payload: gs }),
    startCelebration: () => dispatch({ type: 'START_CELEBRATION' }),
    endCelebration: () => dispatch({ type: 'END_CELEBRATION' }),
  }
}

export function useDateRange() {
  const { state, dispatch } = useApp()
  return {
    dateRange: state.dateRange,
    setDateRange: (range: { start: Date; end: Date }) =>
      dispatch({ type: 'SET_DATE_RANGE', payload: range }),
  }
}
```

---

## 7. Data Fetching

### 7.1 Query Provider Setup

```tsx
// providers/QueryProvider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes
            gcTime: 30 * 60 * 1000,         // 30 minutes
            retry: 1,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### 7.2 Query Hook Pattern

```tsx
// hooks/queries/useBehaviors.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Behavior, CreateBehaviorInput, UpdateBehaviorInput } from '@topline/shared'

// Query key factory
export const behaviorKeys = {
  all: ['behaviors'] as const,
  lists: () => [...behaviorKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...behaviorKeys.lists(), filters] as const,
  details: () => [...behaviorKeys.all, 'detail'] as const,
  detail: (id: string) => [...behaviorKeys.details(), id] as const,
}

// List query
export function useBehaviors(filters: {
  roleId?: string
  category?: string
  isActive?: boolean
} = {}) {
  return useQuery({
    queryKey: behaviorKeys.list(filters),
    queryFn: () => api.behaviors.list(filters),
  })
}

// Detail query
export function useBehavior(id: string) {
  return useQuery({
    queryKey: behaviorKeys.detail(id),
    queryFn: () => api.behaviors.get(id),
    enabled: !!id,
  })
}

// Create mutation
export function useCreateBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBehaviorInput) => api.behaviors.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: behaviorKeys.lists() })
    },
  })
}

// Update mutation
export function useUpdateBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBehaviorInput }) =>
      api.behaviors.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: behaviorKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: behaviorKeys.lists() })
    },
  })
}

// Delete mutation
export function useDeleteBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.behaviors.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: behaviorKeys.lists() })
    },
  })
}
```

### 7.3 Optimistic Updates

```tsx
// hooks/mutations/useLogBehavior.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { behaviorLogKeys } from './queryKeys'

export function useLogBehavior() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.behaviorLogs.create,

    // Optimistic update
    onMutate: async (newLog) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: behaviorLogKeys.lists() })

      // Snapshot previous value
      const previousLogs = queryClient.getQueryData(behaviorLogKeys.lists())

      // Optimistically update
      queryClient.setQueryData(behaviorLogKeys.lists(), (old: any) => ({
        ...old,
        data: [
          {
            id: 'temp-' + Date.now(),
            ...newLog,
            createdAt: new Date().toISOString(),
            verified: false,
          },
          ...(old?.data || []),
        ],
      }))

      return { previousLogs }
    },

    // Rollback on error
    onError: (err, newLog, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(behaviorLogKeys.lists(), context.previousLogs)
      }
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: behaviorLogKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
```

---

## 8. Forms & Validation

### 8.1 Form Pattern

```tsx
// Example: Create Behavior Form
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBehaviorSchema, type CreateBehaviorInput } from '@topline/shared'
import { useCreateBehavior } from '@/hooks/mutations/useCreateBehavior'
import { Button, Input, Select, Textarea } from '@/components/ui'

export function CreateBehaviorForm({ onSuccess }: { onSuccess?: () => void }) {
  const createBehavior = useCreateBehavior()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateBehaviorInput>({
    resolver: zodResolver(createBehaviorSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'REVENUE',
      targetPerDay: 10,
      points: 1,
    },
  })

  const onSubmit = async (data: CreateBehaviorInput) => {
    try {
      await createBehavior.mutateAsync(data)
      reset()
      onSuccess?.()
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Behavior Name"
        {...register('name')}
        error={errors.name?.message}
        placeholder="e.g., Upsell Appetizer"
      />

      <Textarea
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Describe when and how this behavior should be performed"
      />

      <Select
        label="Category"
        {...register('category')}
        error={errors.category?.message}
        options={[
          { value: 'REVENUE', label: 'Revenue' },
          { value: 'COST_CONTROL', label: 'Cost Control' },
          { value: 'QUALITY', label: 'Quality' },
          { value: 'COMPLIANCE', label: 'Compliance' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          label="Daily Target"
          {...register('targetPerDay', { valueAsNumber: true })}
          error={errors.targetPerDay?.message}
        />

        <Input
          type="number"
          label="Points"
          {...register('points', { valueAsNumber: true })}
          error={errors.points?.message}
        />
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting || createBehavior.isPending}
        className="w-full"
      >
        Create Behavior
      </Button>

      {createBehavior.isError && (
        <p className="text-sm text-red-600">
          {createBehavior.error.message}
        </p>
      )}
    </form>
  )
}
```

### 8.2 Form Components

```tsx
// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 rounded-lg border transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200',
            'disabled:bg-slate-50 disabled:text-slate-500',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
```

---

## 9. Authentication

### 9.1 Protected Routes

```tsx
// components/auth/RequireAuth.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/Spinner'

interface RequireAuthProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user && allowedRoles && !allowedRoles.includes(user.role.type)) {
      // Redirect to appropriate dashboard
      router.push(getDashboardPath(user.role.type))
    }
  }, [user, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role.type)) {
    return null
  }

  return <>{children}</>
}

function getDashboardPath(roleType: string): string {
  switch (roleType) {
    case 'ADMIN':
      return '/admin'
    case 'MANAGER':
      return '/manager'
    default:
      return '/staff'
  }
}
```

### 9.2 Login Form

```tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-600 mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner@restaurant.com"
          required
          autoComplete="email"
        />

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}
```

---

## 10. Performance Optimization

### 10.1 Code Splitting

```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/ui/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})

const RichTextEditor = dynamic(() => import('@/components/features/RichTextEditor'), {
  loading: () => <EditorSkeleton />,
})
```

### 10.2 Image Optimization

```tsx
import Image from 'next/image'

// Receipt image with optimization
<Image
  src={receipt.imageUrl}
  alt="Receipt"
  width={400}
  height={600}
  placeholder="blur"
  blurDataURL={receipt.thumbnail}
  priority={false}
/>

// Avatar with fallback
<Image
  src={user.avatarUrl || '/default-avatar.png'}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>
```

### 10.3 Memoization

```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize expensive component
export const LeaderboardTable = memo(function LeaderboardTable({
  data,
  onUserClick,
}: Props) {
  // Component implementation
})

// Memoize derived data
function DashboardPage() {
  const { data: behaviors } = useBehaviors()

  const behaviorsByCategory = useMemo(() => {
    if (!behaviors) return {}
    return groupBy(behaviors.data, 'category')
  }, [behaviors])

  // ...
}

// Memoize callbacks
function BehaviorList({ onEdit }: Props) {
  const handleEdit = useCallback((id: string) => {
    onEdit(id)
  }, [onEdit])

  // ...
}
```

### 10.4 Virtualization

```tsx
// For long lists
import { useVirtualizer } from '@tanstack/react-virtual'

function BehaviorLogList({ logs }: { logs: BehaviorLog[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
  })

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <BehaviorLogRow log={logs[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest)

```tsx
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant styles', () => {
    render(<Button variant="danger">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })
})
```

### 11.2 Integration Tests

```tsx
// hooks/queries/useBehaviors.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/mocks/server'
import { useBehaviors } from './useBehaviors'

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBehaviors', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/behaviors', () => {
        return HttpResponse.json({
          data: [
            { id: '1', name: 'Behavior 1' },
            { id: '2', name: 'Behavior 2' },
          ],
          meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
        })
      })
    )
  })

  it('fetches behaviors', async () => {
    const { result } = renderHook(() => useBehaviors(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(2)
    expect(result.current.data?.data[0].name).toBe('Behavior 1')
  })
})
```

### 11.3 E2E Tests (Playwright)

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'owner@demo.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/admin')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'wrong@email.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })
})
```

---

## 12. Accessibility

### 12.1 ARIA Patterns

```tsx
// Modal with proper ARIA
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <DialogHeader>
          <DialogTitle id="modal-title">{title}</DialogTitle>
        </DialogHeader>
        <div id="modal-description">{children}</div>
      </DialogContent>
    </Dialog>
  )
}

// Form with accessible labels
<div role="group" aria-labelledby="behavior-form-title">
  <h2 id="behavior-form-title">Create Behavior</h2>
  <Input
    id="behavior-name"
    name="name"
    aria-required="true"
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? 'name-error' : undefined}
  />
</div>
```

### 12.2 Keyboard Navigation

```tsx
// Focus trap for modals
import FocusTrap from 'focus-trap-react'

export function Modal({ isOpen, children }: ModalProps) {
  return isOpen ? (
    <FocusTrap>
      <div className="modal">{children}</div>
    </FocusTrap>
  ) : null
}

// Custom keyboard handlers
function BehaviorGrid({ behaviors }: Props) {
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
        focusBehavior(index + 1)
        break
      case 'ArrowLeft':
        focusBehavior(index - 1)
        break
      case 'Enter':
      case ' ':
        logBehavior(behaviors[index].id)
        break
    }
  }

  // ...
}
```

### 12.3 Screen Reader Support

```tsx
// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {notification && notification.message}
</div>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Descriptive loading states
{isLoading && (
  <div role="status" aria-live="polite">
    <Spinner />
    <span className="sr-only">Loading behaviors...</span>
  </div>
)}
```

---

## 13. Mobile Responsiveness

### 13.1 Responsive Breakpoints

```css
/* Tailwind breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### 13.2 Mobile-First Components

```tsx
// Responsive navigation
function Navigation() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile header with menu button */}
      <header className="lg:hidden flex items-center justify-between p-4">
        <Logo />
        <button
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile slide-out menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left">
          <Sidebar />
        </SheetContent>
      </Sheet>
    </>
  )
}
```

### 13.3 Touch-Friendly Targets

```tsx
// Large touch targets for staff interface
<button
  className={cn(
    'min-h-[48px] min-w-[48px]', // WCAG minimum
    'p-4 md:p-6',                 // Extra padding on tablet
    'active:scale-95',            // Touch feedback
    'touch-manipulation'          // Disable double-tap zoom
  )}
>
  <span className="text-lg md:text-xl">{behavior.name}</span>
</button>

// Swipe gestures
import { useSwipeable } from 'react-swipeable'

function SwipeableCard({ onSwipeLeft, onSwipeRight, children }: Props) {
  const handlers = useSwipeable({
    onSwipedLeft: onSwipeLeft,
    onSwipedRight: onSwipeRight,
    trackMouse: false,
    trackTouch: true,
  })

  return <div {...handlers}>{children}</div>
}
```

### 13.4 Responsive Layouts

```tsx
// Dashboard grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard />
  <KpiCard />
  <KpiCard />
  <KpiCard />
</div>

// Behavior button grid
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
  {behaviors.map((b) => (
    <BehaviorButton key={b.id} behavior={b} />
  ))}
</div>

// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <h1 className="text-2xl font-bold">Dashboard</h1>
  <div className="flex gap-2">
    <Button>Export</Button>
    <Button>Settings</Button>
  </div>
</div>
```

---

## Appendix A: Component Checklist

When creating new components:

- [ ] TypeScript types for all props
- [ ] Default values where appropriate
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Accessible (ARIA, keyboard)
- [ ] Responsive
- [ ] Tested (unit tests)
- [ ] Documented (JSDoc)
