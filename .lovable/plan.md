
# Code Review Fixes Plan

## Overview
This plan addresses the issues identified in the code review of the recently refactored player panel components. We'll fix unused props, add missing UI for Monarch/Initiative toggles, add semantic color tokens, clean up dead code, and fix type issues.

---

## Changes Summary

### 1. Add Monarch/Initiative Toggle Buttons to CounterModeSelector
Currently, Monarch and Initiative are display-only indicators. We need to make them interactive so users can toggle these statuses.

**File:** `src/components/CounterModeSelector.tsx`
- Add `onToggleMonarch` and `onToggleInitiative` callback props
- Convert static indicators to toggle buttons that call these callbacks
- Add empty-state buttons when player is not Monarch/Initiative (so they can claim it)
- Add `isAdmin` prop to control whether buttons are interactive

### 2. Remove Unused Props from CleanPlayerPanel
The `onToggleMonarch`, `onToggleInitiative`, and `onAdvanceDungeon` props are passed but never used because this panel doesn't have the Monarch/Initiative toggle UI.

**File:** `src/components/CleanPlayerPanel.tsx`
- Pass `onToggleMonarch` and `onToggleInitiative` to `CounterModeSelector`
- Remove `onAdvanceDungeon` from props (not needed for this component)

### 3. Wire Up Props in FullScreenPlayerPanel
Same issue - props are passed but not forwarded to child components.

**File:** `src/components/FullScreenPlayerPanel.tsx`
- Pass `onToggleMonarch` and `onToggleInitiative` to `CounterModeSelector`
- Remove unused `onAdvanceDungeon` from props interface

### 4. Add Semantic Color Tokens for Monarch & Initiative
Currently using hardcoded yellow/purple colors. We'll add CSS variables and Tailwind config.

**File:** `src/index.css`
- Add `--counter-monarch: 48 89% 50%` (golden yellow)
- Add `--counter-initiative: 270 60% 60%` (purple)

**File:** `tailwind.config.ts`
- Add `monarch: "hsl(var(--counter-monarch))"` to counter colors
- Add `initiative: "hsl(var(--counter-initiative))"` to counter colors

**File:** `src/components/CounterModeSelector.tsx`
- Replace hardcoded `bg-yellow-500/40 text-yellow-300` with `bg-counter-monarch/40 text-counter-monarch`
- Replace hardcoded `bg-purple-500/40 text-purple-300` with `bg-counter-initiative/40 text-counter-initiative`

### 5. Fix TypeScript Type in useHoldToAdjust
Using `NodeJS.Timeout` which is Node-specific. Browser should use `ReturnType<typeof setTimeout>`.

**File:** `src/hooks/useHoldToAdjust.ts`
- Change `useRef<NodeJS.Timeout | null>` to `useRef<ReturnType<typeof setTimeout> | null>`
- This is already correct for `setTimeout`, but `setInterval` should use `ReturnType<typeof setInterval>`

### 6. Remove Dead CSS Classes
The `.life-button` classes are no longer used after the refactor.

**File:** `src/index.css`
- Remove `.life-button` and `.life-button.compact` classes (lines 143-157)

---

## Technical Details

### Updated CounterModeSelector Interface
```typescript
interface CounterModeSelectorProps {
  mode: CounterMode;
  onModeChange: (mode: CounterMode) => void;
  poison: number;
  experience: number;
  energy: number;
  commanderDamage: number;
  isMonarch: boolean;
  hasInitiative: boolean;
  dungeonProgress: number;
  isCompact: boolean;
  isAdmin: boolean;  // NEW
  onToggleMonarch: () => void;  // NEW
  onToggleInitiative: () => void;  // NEW
}
```

### Monarch/Initiative Button Behavior
- When player is Monarch: Show filled crown button (tap to remove)
- When player is not Monarch: Show outline crown button (tap to claim)
- Same pattern for Initiative with shield icon
- Only interactive when `isAdmin` is true

---

## Files to Modify
1. `src/components/CounterModeSelector.tsx` - Add toggle functionality and semantic colors
2. `src/components/CleanPlayerPanel.tsx` - Wire up toggle props
3. `src/components/FullScreenPlayerPanel.tsx` - Wire up toggle props, remove unused props
4. `src/hooks/useHoldToAdjust.ts` - Fix TypeScript types
5. `src/index.css` - Add color tokens, remove dead CSS
6. `tailwind.config.ts` - Add Monarch/Initiative color tokens

---

## Testing Checklist
After implementation, verify:
- Tapping Monarch crown toggles the Monarch status
- Tapping Initiative shield toggles the Initiative status
- Only one player can be Monarch at a time
- Only one player can have Initiative at a time
- Colors use the new semantic tokens
- No TypeScript errors
- No console warnings about unused variables
