<!-- Source: hackforge-design | Confidence: STRONG | Version: v1 | Checkpoint: design-complete | Dependencies: blueprint.md -->
# Design System: Archon — Autonomous AI Life Twin

## Repo Integration Notes
- Existing framework: Next.js (Pages Router) + React Native
- UI library: TailwindCSS (web) + React Native StyleSheet (mobile)
- Existing theme: `apps/web/tailwind.config.js` — basic slate palette
- New tokens added: 28
- Conflicts resolved: Extended slate palette with Archon-specific tokens

---

## 1. Design Philosophy
Archon is trust made visible. Every surface communicates security, intelligence, and calm authority — a sovereign AI that works silently in the background, surfacing only what matters. The design language: **Encrypted Dark**. Depth, encryption, precision.

## 2. Visual References
- **Layout authority:** Linear.app (sidebar density, data typography)
- **Cards/depth:** Vercel Dashboard (glassmorphism, subtle borders)
- **Status/alerting:** Datadog (severity color hierarchy, monospace data)
- **Crypto/identity feel:** 1Password (trust cues, lock iconography)
- **Mobile:** iOS Security (clean dark, biometric confirmation patterns)

## 3. Color Palette (Dark Mode Primary)

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-primary` | `#080c14` | App background — deepest layer |
| `--color-bg-secondary` | `#0e1623` | Card/panel backgrounds |
| `--color-bg-elevated` | `#141e2e` | Elevated surfaces, modals |
| `--color-bg-glass` | `rgba(14,22,35,0.7)` | Glassmorphism panels |
| `--color-text-primary` | `#e8edf5` | Body text, headings |
| `--color-text-secondary` | `#8494a8` | Labels, captions |
| `--color-text-muted` | `#4a5568` | Disabled, placeholder |
| `--color-accent-primary` | `#6366f1` | Primary CTA, active states, glow |
| `--color-accent-secondary` | `#818cf8` | Hover states, highlights |
| `--color-accent-glow` | `rgba(99,102,241,0.2)` | Card glow, focus rings |
| `--color-success` | `#10b981` | Healthy status, confirmed actions |
| `--color-warning` | `#f59e0b` | Budget warnings, attention |
| `--color-error` | `#ef4444` | Failures, critical alerts |
| `--color-info` | `#3b82f6` | Informational, data values |
| `--color-crypto-gold` | `#f6c90e` | DeFi, crypto amounts |
| `--color-pqc-purple` | `#a855f7` | PQC/quantum-resistant features |

## 4. Theme System
- **Default:** Dark (product class: AI/Cybersecurity — dark-first)
- **Toggle:** CSS `[data-theme="dark"]` on `<html>` + `prefers-color-scheme: dark` media query
- **Light mode:** Available but secondary — maps primary bg to `#f8fafc`, text to `#0f172a`

## 5. Typography
- **Primary font:** `Space Grotesk` (Google Fonts) — technical precision, modern, humanist
- **Mono font:** `JetBrains Mono` — for crypto hashes, code, tool calls, event logs

| Scale | Size | Weight | Usage |
|---|---|---|---|
| Display | 48px | 700 | Hero headlines |
| H1 | 36px | 700 | Page titles |
| H2 | 28px | 600 | Section headers |
| H3 | 22px | 600 | Card headers |
| H4 | 18px | 600 | Sub-sections |
| Body | 16px | 400 | Prose |
| Small | 14px | 400 | Labels, metadata |
| Caption | 12px | 400 | Timestamps, tooltips |
| Code | 14px | 400 | Mono — hashes, addresses |

## 6. Spacing Scale
4px base grid: `4, 8, 12, 16, 24, 32, 48, 64, 96` px
Tokens: `--space-xs(4) --space-sm(8) --space-md(16) --space-lg(24) --space-xl(32) --space-2xl(48) --space-3xl(64)`

## 7. Responsive Breakpoints
- **Mobile (<640px):** Single column, bottom tab navigation, full-width cards, 16px body font
- **Tablet (640-1024px):** 2-column grid, collapsible sidebar, 240px sidebar collapsed to icon-rail
- **Desktop (>1024px):** Full layout — 240px fixed sidebar + 64px header + main content area

## 8. Component Patterns

### Button (Primary / Secondary / Ghost / Danger)
```css
/* Primary */
bg: --color-accent-primary, hover-bg: --color-accent-secondary
border: none, border-radius: 8px, padding: 10px 20px
box-shadow: 0 0 16px var(--color-accent-glow) on hover
transition: all 150ms ease-out

/* Secondary */
bg: transparent, border: 1px solid --color-accent-primary
color: --color-accent-primary, hover-bg: --color-accent-glow

/* Ghost */
bg: transparent, border: none — NEVER used for primary CTA

/* Danger */
bg: transparent, border: 1px solid --color-error
color: --color-error, hover-bg: rgba(239,68,68,0.1)
```
Min touch target: 44x44px (mobile). Focus ring: 2px offset, `--color-accent-primary`.

### Card (Standard / Glass / Stat)
```css
/* Standard */
bg: --color-bg-secondary, border: 1px solid rgba(255,255,255,0.06)
border-radius: 16px, padding: 24px

/* Glass */
bg: --color-bg-glass, backdrop-filter: blur(12px) saturate(1.5)
border: 1px solid rgba(255,255,255,0.08)
box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(99,102,241,0.1)

/* Stat (Dashboard KPI card) */
Glass card + accent value in Display/H1 size + glow pulse on live data
```

### Input
```css
bg: --color-bg-elevated, border: 1px solid rgba(255,255,255,0.08)
border-radius: 8px, padding: 10px 14px, color: --color-text-primary
focus-border: --color-accent-primary, focus-shadow: 0 0 0 3px --color-accent-glow
```

### Navigation (Sidebar Web)
```css
width: 240px, bg: --color-bg-secondary, border-right: 1px solid rgba(255,255,255,0.05)
Nav items: 14px Space Grotesk, icon + label, 8px 16px padding
Active: bg --color-accent-glow, text --color-accent-secondary, left border 2px --color-accent-primary
```

## 9. Animation Rules
- **Micro (hover/focus):** 150ms ease-out
- **Transitions (page/panel):** 300ms ease-in-out  
- **Spring (modals/sheets):** 400ms cubic-bezier(0.34, 1.56, 0.64, 1)
- **Pulse (live data):** 2s infinite ease-in-out opacity oscillation
- **Max simultaneous:** 2 animations
- **`prefers-reduced-motion`:** Required — wrap all animations in media query check

## 10. Accessibility Rules
- Contrast: 4.5:1 body text, 3:1 large text (WCAG AA minimum)
- Keyboard: Tab order follows visual flow, visible focus ring on all interactive elements
- ARIA: `role`, `aria-label`, `aria-live` for dynamic content (event logs, live data)
- Touch targets: 44x44px minimum on mobile
- Color independence: Never use color alone to communicate status — add icon/text

## 11. Content State Rules
| State | Implementation |
|---|---|
| Loading | Skeleton shimmer (animated gradient pulse), not spinner for data |
| Empty | Illustration + headline + primary CTA |
| Error | Red border card + human error message + "Retry" button |
| Success | Green checkmark + confirmation message, auto-dismiss 3s |
| Offline | Banner: "Archon offline — local twin active" |
| Partial | Progress bar + "X of Y completed" label |

## 12. Psychology Compliance

| Principle | Status | Implementation |
|---|---|---|
| Trust signals visible | PASS | Encryption indicators, "On-device" badge on all data views |
| No dark patterns | PASS | All destructive actions require confirmation |
| Cognitive load <3 decisions/screen | PASS | Enforced by screen design |
| Primary CTA consistent | FAIL (FIX) | Standardize to `--color-accent-primary` for all primary CTAs |
| Error messages have next action | FAIL (FIX) | All errors must include retry/contact CTA |
| Loading states never block without feedback | FAIL (FIX) | Replace text-only "Loading Session..." |
| Success feedback immediate | PASS | Toast + animation |
| Data freshness visible | PARTIAL | Add "Last updated X ago" to all live data cards |

### Anti-Patterns (Prohibited)
- ❌ Red/green only color coding (add icons)
- ❌ Toast without action for errors
- ❌ Inline form submission without feedback
- ❌ Ghost button as primary CTA
- ❌ Skeleton loaders exceeding 3 seconds without fallback
- ❌ Hardcoded user data visible in production UI

## 13. Data Visualization
- Chart library: Recharts (existing) — theme all charts to Archon palette
- Primary series: `--color-accent-primary` (#6366f1)
- Secondary series: `--color-success` (#10b981)
- Alert series: `--color-warning` (#f59e0b)
- Grid lines: `rgba(255,255,255,0.04)`
- Axis labels: `--color-text-secondary`, 11px JetBrains Mono
- Tooltip: Glass card style, `--color-bg-glass` bg

## 14. AI Interaction Patterns
- Voice: Pulsing orb animation during listening, waveform during processing
- Swarm messages: Slide-in from right, encrypted icon prefix, key fingerprint shown
- ANNEAL repairs: Timeline card showing Before/After delta with diff syntax highlighting
- RSI human review: Full-screen modal with diff viewer + Approve/Reject binary choice
- Tool execution: Inline progress with tool icon + "Running..." → "Done in Xms"

## 15. Real-Time Data Patterns
- Live status: Green/amber/red dot with pulse animation
- Swarm relay: "Listening for swarm..." with antenna icon + pulse
- Budget meter: Horizontal progress bar that turns amber at 80%, red at 95%
- Connection status: Persistent footer badge: "Enclave Active · Ed25519 · X25519"

## 16. Dashboard/Admin Patterns (Web)
- KPI stat cards: 3-column grid, glass cards, large colored number, trend indicator
- Audit log: Sortable table, monospace log IDs, color-coded action badges
- Team table: Avatar + email, role badge, inline role selector
- Charts: Full-width area chart, dual-axis for cost+actions

---

## Session Output
- **Objective:** Generate complete Archon design system
- **Status:** COMPLETE
- **Product Class:** AI/Cybersecurity + Dashboard
- **Tokens defined:** 28 color + 9 spacing + 9 typography
- **Next checkpoint:** hackforge-prompts (generate elevation build prompts)
