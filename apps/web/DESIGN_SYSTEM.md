# Topline Design System

> A comprehensive design system for the Topline web application. All new features, screens, and components MUST adhere to these guidelines to maintain visual consistency.

---

## Table of Contents

1. [Foundation](#foundation)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Interactive States](#interactive-states)
7. [Animations](#animations)
8. [Icons](#icons)
9. [Page Templates](#page-templates)
10. [Patterns & Recipes](#patterns--recipes)

---

## Foundation

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Utilities**: clsx, tailwind-merge
- **Font**: Inter (Google Fonts)

### Design Principles
1. **Clarity over decoration** - Every element serves a purpose
2. **Semantic color usage** - Colors convey meaning, not just aesthetics
3. **Mobile-first** - Base styles for mobile, enhance for larger screens
4. **Consistent spacing** - Use the defined spacing scale religiously
5. **Accessible contrast** - Ensure text is readable on all backgrounds

---

## Color System

### Neutral Palette (Slate)

The slate palette is the foundation. Use it for backgrounds, text, borders, and structural elements.

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `neutral-50` | `slate-50` | `#f8fafc` | Page backgrounds (light theme) |
| `neutral-100` | `slate-100` | `#f1f5f9` | Card headers, subtle backgrounds |
| `neutral-200` | `slate-200` | `#e2e8f0` | Borders, dividers |
| `neutral-300` | `slate-300` | `#cbd5e1` | Disabled states, silver badges |
| `neutral-400` | `slate-400` | `#94a3b8` | Placeholder text, tertiary text |
| `neutral-500` | `slate-500` | `#64748b` | Secondary text |
| `neutral-600` | `slate-600` | `#475569` | Body text (dark backgrounds) |
| `neutral-700` | `slate-700` | `#334155` | Primary text |
| `neutral-800` | `slate-800` | `#1e293b` | Card backgrounds (dark theme) |
| `neutral-900` | `slate-900` | `#0f172a` | Page backgrounds (dark theme), headings |
| `neutral-950` | `slate-950` | `#020617` | Darkest backgrounds (scoreboard) |

### Semantic Colors

#### Success (Emerald)
Use for: wins, verified items, positive trends, confirmations, revenue success

```
bg-emerald-50    - Light background
bg-emerald-100   - Badge background
bg-emerald-500   - Solid buttons, indicators
bg-emerald-600   - Primary success actions
text-emerald-600 - Success text on light bg
text-emerald-400 - Success text on dark bg
border-emerald-200 - Success borders (light)
border-emerald-500 - Success borders (prominent)
```

#### Primary Action (Blue)
Use for: primary buttons, links, lead measures, interactive elements, focus states

```
bg-blue-50       - Light background
bg-blue-500      - Progress bars, charts
bg-blue-600      - Primary buttons
bg-blue-700      - Hover state for buttons
text-blue-600    - Links, action text
focus:ring-blue-200 - Focus rings
```

#### Warning (Amber)
Use for: pending items, caution states, needs attention

```
bg-amber-50      - Alert background
bg-amber-100     - Badge background
text-amber-700   - Warning text
text-amber-800   - Strong warning text
border-amber-200 - Warning borders
```

#### Danger/Loss (Rose)
Use for: losses, errors, negative trends, rejection, critical alerts

```
bg-rose-50       - Light danger background
bg-rose-100      - Badge background
bg-rose-500      - Solid danger indicators
text-rose-500    - Danger text
text-rose-700    - Strong danger text
border-rose-500  - Danger borders
```

#### AI/Premium (Purple/Pink/Indigo)
Use for: AI features, premium sections, insights, recommendations

```
bg-purple-600    - AI accent
bg-indigo-600    - Gradient start
bg-purple-700    - Gradient end
text-pink-500    - AI highlights
text-purple-400  - AI text on dark
from-indigo-600 to-purple-700 - AI gradient
from-pink-600 to-purple-600   - AI banner gradient
```

#### Achievement (Yellow)
Use for: rankings, celebrations, gold medals, achievements

```
bg-yellow-500    - Gold/1st place
text-yellow-400  - Achievement text (dark bg)
text-yellow-600  - Achievement text (light bg)
border-yellow-600 - Achievement borders
```

### Dark Theme Colors

For dark-themed pages (Staff, Scoreboard):

| Element | Light Theme | Dark Theme |
|---------|-------------|------------|
| Page background | `bg-slate-50` | `bg-slate-900` or `bg-slate-950` |
| Card background | `bg-white` | `bg-slate-800` |
| Primary text | `text-slate-900` | `text-white` |
| Secondary text | `text-slate-500` | `text-slate-400` |
| Borders | `border-slate-200` | `border-slate-700` |

---

## Typography

### Font Family

```tsx
// Primary font - Inter from Google Fonts
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

// Usage in layout
<body className={inter.className}>
```

For numeric/monetary values, use `font-mono` for alignment and precision.

### Type Scale

| Name | Classes | Usage |
|------|---------|-------|
| **Display** | `text-5xl font-black` | Hero numbers, celebration overlays |
| **Heading 1** | `text-2xl font-bold` | Page titles |
| **Heading 2** | `text-xl font-bold` | Section titles |
| **Heading 3** | `text-lg font-bold` | Card titles |
| **KPI Value** | `text-3xl font-black tracking-tight` | Dashboard metrics |
| **Body** | `text-sm font-medium` | Default body text |
| **Body Small** | `text-xs` | Supporting text |
| **Label** | `text-xs font-bold uppercase tracking-widest` | Form labels, section labels |
| **Micro** | `text-[10px] font-bold` | Badges, timestamps |

### Text Colors

```
text-slate-900  - Primary headings (light bg)
text-slate-700  - Body text (light bg)
text-slate-500  - Secondary/muted text
text-slate-400  - Placeholder, tertiary text
text-white      - Primary text (dark bg)
text-slate-300  - Body text (dark bg)
```

---

## Spacing & Layout

### Spacing Scale

Use Tailwind's default spacing scale (4px base unit):

| Token | Value | Common Usage |
|-------|-------|--------------|
| `1` | 4px | Tight gaps (gap-1) |
| `2` | 8px | Icon-text gaps |
| `3` | 12px | Small padding |
| `4` | 16px | Standard padding, gaps |
| `5` | 20px | Card internal padding |
| `6` | 24px | Section padding, major gaps |
| `8` | 32px | Large section spacing |
| `24` | 96px | Bottom nav buffer (pb-24) |
| `32` | 128px | Extra bottom buffer (pb-32) |

### Container Widths

```
max-w-md        - 448px  - Mobile-optimized (setup, modals)
max-w-4xl       - 896px  - Focused content (strategy)
max-w-5xl       - 1024px - Standard dashboards (manager)
max-w-[1600px]  - 1600px - Wide dashboards (admin)
```

Always center containers: `mx-auto`

### Grid Layouts

**KPI Cards (4-column responsive)**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Main + Sidebar (3-column)**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">Main content</div>
  <div>Sidebar</div>
</div>
```

**Two Column**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

### Page Structure Template

```tsx
<div className="min-h-screen bg-slate-50 pb-32">
  {/* Sticky Header */}
  <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
    {/* Header content */}
  </header>

  {/* Main Content */}
  <main className="max-w-[1600px] mx-auto p-6 space-y-6">
    {/* Page content */}
  </main>
</div>
```

---

## Components

### Cards

**Standard Card**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
  {/* Card content */}
</div>
```

**Card with Header**
```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
    <h3 className="font-bold text-slate-800">Card Title</h3>
  </div>
  <div className="p-6">
    {/* Card content */}
  </div>
</div>
```

**Dark Theme Card**
```tsx
<div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
  {/* Card content */}
</div>
```

### KPI Card

```tsx
interface KpiCardProps {
  title: string
  value: string
  subValue?: string
  trend?: { value: string; positive: boolean }
  icon: LucideIcon
  color: 'emerald' | 'blue' | 'yellow' | 'purple'
}

// Structure
<div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[140px]">
  <div className="flex justify-between items-start">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
        {title}
      </p>
      <p className="text-3xl font-black tracking-tight text-slate-900">
        {value}
      </p>
      {trend && (
        <div className={clsx(
          "flex items-center gap-1 mt-1 text-xs font-bold",
          trend.positive ? "text-emerald-600" : "text-rose-500"
        )}>
          {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend.value}
        </div>
      )}
    </div>
    <div className={`p-3 rounded-lg bg-${color}-50`}>
      <Icon className={`text-${color}-600`} size={20} />
    </div>
  </div>
</div>
```

### Inputs

**Standard Input**
```tsx
<input
  type="text"
  className="w-full px-4 py-3 rounded-xl border border-slate-200
    focus:border-blue-500 focus:ring-2 focus:ring-blue-200
    outline-none transition-all"
  placeholder="Enter value..."
/>
```

**Input with Icon Prefix**
```tsx
<div className="relative">
  <DollarSign
    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    size={16}
  />
  <input
    type="text"
    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200
      focus:border-blue-500 focus:ring-2 focus:ring-blue-200
      outline-none transition-all font-mono"
  />
</div>
```

**Emerald Focus Variant** (for positive actions)
```tsx
focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
```

### Buttons

**Primary Button**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white font-bold
  py-4 px-6 rounded-xl shadow-lg hover:shadow-blue-500/30
  transition-all flex items-center justify-center gap-2">
  Continue
  <ArrowRight size={20} />
</button>
```

**Secondary Button**
```tsx
<button className="bg-white border border-slate-200 text-slate-700
  font-bold py-3 px-4 rounded-xl hover:bg-slate-50
  transition-colors flex items-center gap-2">
  Cancel
</button>
```

**Ghost Button (Dark Theme)**
```tsx
<button className="bg-white/10 hover:bg-white/20 px-4 py-2
  rounded-lg text-white text-sm font-bold transition-colors">
  Action
</button>
```

**Small Action Button**
```tsx
<button className="text-blue-600 hover:text-blue-800 font-bold text-xs
  border border-blue-200 hover:border-blue-400
  rounded px-2 py-1 transition-colors">
  Verify
</button>
```

### Badges

**Status Badges**
```tsx
// Success
<span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
  Verified
</span>

// Warning
<span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
  Pending
</span>

// Neutral
<span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase">
  Draft
</span>
```

**Trend Badges**
```tsx
// Positive
<span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
  <TrendingUp size={12} />
  +12%
</span>

// Negative
<span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-xs font-bold">
  <TrendingDown size={12} />
  -5%
</span>
```

### Alerts

**Warning Alert**
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
  <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
  <div>
    <p className="font-medium text-amber-800">Attention Required</p>
    <p className="text-sm text-amber-700 mt-1">Description text here.</p>
  </div>
</div>
```

**Success Alert**
```tsx
<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
  <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
  <div>
    <p className="font-medium text-emerald-800">Success</p>
    <p className="text-sm text-emerald-700 mt-1">Description text here.</p>
  </div>
</div>
```

### Progress Bar

```tsx
<div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
  <div
    className="bg-blue-500 h-full rounded-full transition-all"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Avatar

```tsx
// Standard (light theme)
<div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
  <span className="text-sm font-bold text-slate-600">JD</span>
</div>

// Dark theme
<div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
  <span className="text-sm font-bold text-white">JD</span>
</div>

// With gradient
<div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
  flex items-center justify-center shadow-lg">
  <span className="text-sm font-bold text-white">JD</span>
</div>
```

---

## Interactive States

### Hover States

```
hover:bg-slate-50       - List item hover (light)
hover:bg-white/5        - List item hover (dark)
hover:bg-blue-700       - Button hover
hover:scale-[1.02]      - Subtle scale on cards
hover:shadow-lg         - Elevate on hover
hover:border-slate-500  - Border emphasis
hover:text-blue-800     - Text color shift
```

### Focus States

Always provide visible focus states for accessibility:

```
focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none
```

### Active/Selected States

```tsx
// Selected row or item
<div className={clsx(
  "border-l-4 px-4 py-3 transition-colors",
  isSelected
    ? "bg-blue-50 border-blue-500"
    : "border-transparent hover:bg-slate-50"
)}>
```

### Disabled States

```
opacity-50 cursor-not-allowed pointer-events-none
```

### Transition Classes

Always add transitions for smooth state changes:

```
transition-all      - All properties
transition-colors   - Only colors (bg, text, border)
transition-transform - Only transforms (scale, translate)
duration-200        - Slightly slower (default is 150ms)
duration-300        - Noticeable transition
duration-500        - Slow, dramatic transition
```

---

## Animations

### Entry Animations

```tsx
// Fade in
className="animate-in fade-in duration-300"

// Slide up and fade
className="animate-in fade-in slide-in-from-bottom-4 duration-300"

// Zoom in (for modals, overlays)
className="animate-in zoom-in duration-200"
```

### Continuous Animations

```tsx
// Pulsing (for AI features, attention)
className="animate-pulse"

// Bouncing (for celebrations)
className="animate-bounce"
```

### Custom Animations

Define in globals.css if needed:

```css
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes fall {
  0% { transform: translateY(-100vh) rotate(0deg); }
  100% { transform: translateY(100vh) rotate(720deg); }
}
```

Usage:
```tsx
className="animate-[shrink_3s_linear_forwards]"
className="animate-[fall_3s_linear_infinite]"
```

---

## Icons

### Icon Library

Use **Lucide React** exclusively for icons.

```tsx
import { IconName } from 'lucide-react'
```

### Standard Sizes

| Context | Size | Example |
|---------|------|---------|
| Inline with text | 14-16 | Trend indicators |
| Buttons | 16-20 | Button icons |
| Cards/Badges | 20 | KPI card icons |
| Large display | 24-32 | Empty states |
| Hero/Celebration | 48-180 | Overlays |

### Icon + Text Pattern

```tsx
<div className="flex items-center gap-2">
  <Icon size={16} />
  <span>Label text</span>
</div>
```

### Icon in Colored Circle

```tsx
<div className="p-3 rounded-lg bg-emerald-50">
  <Icon className="text-emerald-600" size={20} />
</div>
```

### Commonly Used Icons

| Category | Icons |
|----------|-------|
| Navigation | `LayoutDashboard`, `Users`, `Settings`, `Menu`, `X` |
| Metrics | `TrendingUp`, `TrendingDown`, `DollarSign`, `Star` |
| Actions | `Check`, `Plus`, `ArrowRight`, `Save`, `Search` |
| Status | `AlertTriangle`, `CheckCircle`, `AlertCircle` |
| AI/Premium | `Sparkles`, `BrainCircuit` |
| Celebration | `Trophy`, `PartyPopper` |

---

## Page Templates

### Light Theme Dashboard

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900">Page Title</h1>
          {/* Header actions */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI Cards */}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Main content */}
          </div>
          <div>
            {/* Sidebar */}
          </div>
        </div>
      </main>
    </div>
  )
}
```

### Dark Theme Page (Mobile-First)

```tsx
export default function MobilePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32">
      {/* Sticky Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700
        px-4 py-3 sticky top-0 z-20">
        {/* Header content */}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stat cards */}
        </div>

        {/* Action List */}
        <div className="space-y-3">
          {/* Action buttons */}
        </div>
      </main>
    </div>
  )
}
```

### Centered Form Page

```tsx
export default function FormPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 pb-24">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Icon */}
          <div className="flex items-center justify-center mx-auto mb-4">
            <div className="p-4 rounded-full bg-blue-50">
              <Icon className="text-blue-600" size={32} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Title</h1>
            <p className="text-slate-500 mt-2">Description</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Form fields */}
          </div>

          {/* Action */}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white
            font-bold py-4 rounded-xl mt-6">
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Patterns & Recipes

### Two-Tap Confirmation

Used in Staff page for preventing accidental actions:

```tsx
const [confirming, setConfirming] = useState<string | null>(null)

// On first tap
const handleTap = (id: string) => {
  if (confirming === id) {
    // Execute action
    handleConfirm(id)
    setConfirming(null)
  } else {
    setConfirming(id)
    // Auto-reset after 3 seconds
    setTimeout(() => setConfirming(null), 3000)
  }
}

// Button styling
<button className={clsx(
  "w-full p-4 rounded-xl border transition-all",
  confirming === id
    ? "bg-emerald-600 border-emerald-400 text-white scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.3)]"
    : "bg-slate-800 border-slate-700 hover:border-slate-500"
)}>
  {confirming === id ? "Tap again to Confirm" : "Action Name"}

  {/* Progress bar for confirmation timer */}
  {confirming === id && (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400/30">
      <div className="h-full bg-emerald-300 animate-[shrink_3s_linear_forwards]" />
    </div>
  )}
</button>
```

### Conditional Win/Loss Styling

```tsx
const isWinning = revenue > target

<div className={clsx(
  "rounded-3xl border-2 p-6",
  isWinning
    ? "bg-emerald-900/20 border-emerald-500/50"
    : "bg-rose-900/20 border-rose-500/50"
)}>
  <div className={clsx(
    "h-16 w-16 rounded-full flex items-center justify-center",
    isWinning ? "bg-emerald-500" : "bg-rose-500"
  )}>
    {isWinning ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
  </div>
</div>
```

### Ranking Medal Colors

```tsx
const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1: return "bg-yellow-500 text-black"    // Gold
    case 2: return "bg-slate-300 text-black"     // Silver
    case 3: return "bg-orange-700 text-white"    // Bronze
    default: return "bg-slate-800 text-slate-500" // Default
  }
}
```

### AI/Premium Section

```tsx
<div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
  {/* Decorative blur */}
  <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

  {/* Content */}
  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-4">
      <Sparkles className="text-yellow-300" size={20} />
      <span className="text-white font-bold">AI Insights</span>
    </div>

    {/* Cards with glassmorphism */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
        {/* Card content */}
      </div>
    </div>
  </div>
</div>
```

### Verified/Unverified Row

```tsx
<div className={clsx(
  "grid grid-cols-12 gap-4 px-6 py-4 transition-colors",
  isVerified
    ? "bg-emerald-50/30"
    : "hover:bg-slate-50"
)}>
  {/* Row content */}
  <div className="col-span-1">
    {isVerified && <CheckCircle className="text-emerald-500" size={16} />}
  </div>
</div>
```

### Sticky Multi-Level Header

```tsx
{/* Primary Header */}
<header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
  <h1 className="text-xl font-bold">Page Title</h1>
</header>

{/* Secondary Header */}
<div className="bg-slate-900 text-white px-6 py-3 sticky top-[73px] z-10">
  <p className="text-sm">Secondary context or actions</p>
</div>
```

### List with Dividers

```tsx
<div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
  {items.map(item => (
    <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
      {/* Item content */}
    </div>
  ))}
</div>
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Base | 0px | Mobile-first styles |
| `sm` | 640px | Rarely used |
| `md` | 768px | Tablet, 2-column layouts |
| `lg` | 1024px | Desktop, 3-4 column layouts |
| `xl` | 1280px | Wide screens (rarely needed) |

### Common Responsive Patterns

```tsx
// KPI grid
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

// Content + sidebar
grid-cols-1 lg:grid-cols-3

// Two column
grid-cols-1 md:grid-cols-2
```

---

## Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| Base | 0 | Default content |
| Sticky headers | 10-20 | Navigation bars |
| Dropdowns | 30 | Menus, tooltips |
| Modals | 40 | Dialog overlays |
| Overlays | 50 | Full-screen overlays |
| DemoNav | 100 | Development navigation |

---

## Accessibility Checklist

- [ ] All interactive elements have visible focus states
- [ ] Color is not the only indicator of state (include icons/text)
- [ ] Text contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Touch targets are at least 44x44px
- [ ] Form inputs have associated labels
- [ ] Images have alt text
- [ ] Semantic HTML is used (button, nav, main, etc.)

---

## File Organization

```
components/
├── ui/                 # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── ...
├── CelebrationOverlay.tsx
├── DemoNav.tsx
└── ...

app/
├── globals.css         # Global styles, CSS variables
├── layout.tsx          # Root layout with fonts
├── page.tsx            # Home page
├── admin/
├── manager/
├── staff/
├── scoreboard/
├── setup/
└── strategy/
```

---

## Quick Reference

### Most Common Classes

```
// Backgrounds
bg-slate-50 bg-white bg-slate-800 bg-slate-900

// Text
text-slate-900 text-slate-500 text-white font-bold font-medium

// Spacing
p-4 p-6 gap-4 gap-6 space-y-6

// Borders
rounded-xl border border-slate-200 shadow-sm

// Layout
flex items-center justify-between
grid grid-cols-1 lg:grid-cols-3

// Interactive
hover:bg-slate-50 transition-colors
focus:border-blue-500 focus:ring-2 focus:ring-blue-200
```

---

*Last updated: December 2024*
