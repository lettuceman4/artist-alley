# Design Document: Booth Visualiser

## Overview

The Booth Visualiser replaces the existing grid-based `BoothVisualiser.jsx` with a proportional, canvas-based layout tool. Vendors configure their physical table dimensions, then drag fixture shapes (Rack, Box, Stand) onto an SVG canvas that renders everything to scale. Two view modes — Top View (width × depth) and Front View (width × height) — let vendors plan both surface arrangement and vertical display. All state persists to `localStorage` so layouts survive page reloads.

The implementation uses SVG for rendering (no external libraries), plain React state for interaction, and inline styles consistent with the existing `index.css` design system (purple `#6c3fc5` accent).

## Architecture

The feature is a single-page React component tree contained entirely within `frontend/src/pages/BoothVisualiser.jsx`. No backend changes are required.

```
BoothVisualiser (root)
├── DimensionPanel          — table width/depth/height inputs + unit toggle
├── ViewToggle              — Top View / Front View selector
├── BoothCanvas             — SVG surface; renders table rect + fixture rects
│   ├── TableRect           — the table background rectangle
│   └── FixtureRect (×n)    — each placed fixture with drag/resize/delete handles
└── FixturePalette          — draggable fixture type chips (Rack, Box, Stand)
```

State is managed with `useState` / `useReducer` at the `BoothVisualiser` root and passed down as props. No external state library is needed.

### Data Flow

```
User interaction
      │
      ▼
BoothVisualiser (dispatch action)
      │
      ▼
layoutReducer  ──► new layout state
      │
      ├──► localStorage.setItem (side-effect via useEffect)
      │
      └──► props to BoothCanvas + DimensionPanel + FixturePalette
```

### Drag-and-Drop Strategy

SVG-native drag events are unreliable across browsers. Instead, the implementation uses pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) on the SVG element to track drag state. This gives precise coordinate control and works consistently.

- Dragging from palette: sets `dragState = { type, source: 'palette' }`
- Dragging placed fixture: sets `dragState = { fixtureId, source: 'canvas', offsetX, offsetY }`
- On pointer-up over canvas: commits position; outside canvas bounds reverts

### Scale Factor Calculation

```
scaleFactor = min(canvasWidth / tableRealWidth, canvasHeight / tableRealDepthOrHeight) * MARGIN_FACTOR
```

`MARGIN_FACTOR = 0.85` leaves a consistent 15% margin around the table. The canvas observes its container width via a `ResizeObserver` and recalculates on change.

## Components and Interfaces

### BoothVisualiser (root)

Owns all state via `useReducer(layoutReducer, initialState)`. Reads/writes `localStorage` key `booth-visualiser-layout` via `useEffect`.

**Props:** none

**State shape:** see Data Models section.

### DimensionPanel

**Props:**
```js
{
  table: { width, depth, height, unit },  // current values
  onTableChange: (field, value) => void,  // dispatches SET_TABLE_DIM
  onUnitChange: (unit) => void,           // dispatches SET_UNIT
  errors: { width?, depth?, height? }     // validation error strings
}
```

Renders three `<input type="number">` fields and a unit toggle (`cm` / `in`). Inline error messages appear below invalid fields.

### ViewToggle

**Props:**
```js
{
  view: 'top' | 'front',
  onChange: (view) => void
}
```

Renders two buttons styled as a segmented control using the `#6c3fc5` accent.

### BoothCanvas

**Props:**
```js
{
  table: { width, depth, height, unit },
  view: 'top' | 'front',
  fixtures: Fixture[],
  selectedId: string | null,
  onFixtureDrop: (type, x, y) => void,       // new fixture from palette
  onFixtureMove: (id, x, y) => void,
  onFixtureResize: (id, w, h) => void,
  onFixtureSelect: (id | null) => void,
  onFixtureDelete: (id) => void,
}
```

Renders an `<svg>` element. Uses a `ResizeObserver` on its wrapper `<div>` to track available pixel width and derive `scaleFactor`. The SVG `viewBox` is set dynamically.

### FixturePalette

**Props:**
```js
{
  fixtureTypes: FixtureTypeDef[],   // static list: Rack, Box, Stand
  onDragStart: (type) => void
}
```

Renders draggable chips. Each chip uses `onPointerDown` to initiate a palette drag.

## Data Models

### Layout State

```js
{
  table: {
    width: number,   // real-world value in current unit
    depth: number,
    height: number,
    unit: 'cm' | 'in'
  },
  view: 'top' | 'front',
  fixtures: Fixture[]
}
```

### Fixture

```js
{
  id: string,          // crypto.randomUUID() or Date.now() fallback
  type: 'rack' | 'box' | 'stand',
  x: number,           // position in real-world units from table origin
  y: number,
  width: number,       // real-world units
  height: number
}
```

### FixtureTypeDef (static constant)

```js
{
  type: 'rack' | 'box' | 'stand',
  label: string,
  color: string,       // hex colour
  defaultWidth: number,  // cm
  defaultHeight: number
}
```

Default fixture type definitions:

| type  | label | color     | defaultWidth | defaultHeight |
|-------|-------|-----------|-------------|--------------|
| rack  | Rack  | `#6c3fc5` | 30          | 150          |
| box   | Box   | `#27ae60` | 40          | 30           |
| stand | Stand | `#e67e22` | 20          | 80           |

### localStorage Schema

Key: `booth-visualiser-layout`

Value: JSON-serialised `Layout` object (the full state shape above). Deserialisation validates the shape; if invalid or missing, defaults are used.

### Default State

```js
const DEFAULT_TABLE = { width: 180, depth: 60, height: 75, unit: 'cm' }
const DEFAULT_STATE = { table: DEFAULT_TABLE, view: 'top', fixtures: [] }
```

### Reducer Actions

```js
{ type: 'SET_TABLE_DIM', field: 'width'|'depth'|'height', value: number }
{ type: 'SET_UNIT', unit: 'cm'|'in' }
{ type: 'SET_VIEW', view: 'top'|'front' }
{ type: 'ADD_FIXTURE', fixture: Fixture }
{ type: 'MOVE_FIXTURE', id, x, y }
{ type: 'RESIZE_FIXTURE', id, width, height }
{ type: 'DELETE_FIXTURE', id }
{ type: 'CLEAR_LAYOUT' }
{ type: 'LOAD_LAYOUT', layout: Layout }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid dimension inputs are rejected

*For any* dimension field (width, depth, height) and any input value that is non-numeric, zero, or negative, the layout state's corresponding dimension value SHALL remain unchanged and a validation error SHALL be present.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Unit conversion round-trip

*For any* set of table dimensions expressed in centimetres, converting to inches and then back to centimetres SHALL produce values equivalent to the originals within floating-point tolerance (±0.01).

**Validates: Requirements 1.6**

---

### Property 3: Scale factor fills canvas with margin

*For any* table dimensions (width > 0, depth > 0, height > 0) and any canvas pixel area (width > 0, height > 0), the computed scale factor SHALL result in the table rectangle occupying between 80% and 90% of the smaller canvas dimension (i.e. `MARGIN_FACTOR` of 0.85 ± 0.05).

**Validates: Requirements 2.1, 2.4**

---

### Property 4: Proportional rendering invariant

*For any* fixture whose real-world width is `fw` and a table whose real-world width is `tw`, the fixture's rendered pixel width divided by the table's rendered pixel width SHALL equal `fw / tw`.

**Validates: Requirements 2.3**

---

### Property 5: View projection correctness

*For any* table with dimensions `{ width, depth, height }`, when the view is "Top View" the canvas table rectangle SHALL have pixel dimensions proportional to `width × depth`, and when the view is "Front View" the canvas table rectangle SHALL have pixel dimensions proportional to `width × height`.

**Validates: Requirements 3.2, 3.3**

---

### Property 6: Fixture type definitions are unique

*For any* two distinct fixture type definitions in the palette, their `type` identifiers, `label` strings, and `color` values SHALL all be pairwise distinct.

**Validates: Requirements 4.2**

---

### Property 7: Fixture drop creates a bounded fixture

*For any* fixture type and any pointer position within the canvas bounds, dropping the fixture SHALL add exactly one new fixture to the fixtures list whose position is within the table bounds.

**Validates: Requirements 4.3, 5.2**

---

### Property 8: Fixture move updates position

*For any* placed fixture and any valid new position within the canvas bounds, moving the fixture SHALL update its `x` and `y` to the new position and leave all other fixture properties unchanged.

**Validates: Requirements 5.3**

---

### Property 9: Out-of-bounds drop reverts position

*For any* placed fixture and any pointer position outside the canvas bounds, dropping the fixture at that position SHALL leave the fixture's `x` and `y` unchanged.

**Validates: Requirements 5.4**

---

### Property 10: Resize updates fixture dimensions

*For any* placed fixture and any resize delta that results in dimensions ≥ 1 unit, the fixture's `width` and `height` SHALL be updated to the new values and all other fixture properties SHALL remain unchanged.

**Validates: Requirements 6.2**

---

### Property 11: Resize dimension label matches real-world units

*For any* selected fixture with dimensions `{ width, height }` in real-world units, the displayed dimension label SHALL contain the numeric values of `width` and `height` in the current unit.

**Validates: Requirements 6.3**

---

### Property 12: Resize clamp at minimum 1 unit

*For any* resize operation that would produce a fixture width or height less than 1 unit, the resulting dimension SHALL be exactly 1 unit.

**Validates: Requirements 6.4**

---

### Property 13: Delete removes fixture from list

*For any* fixture present in the fixtures list, activating its delete control SHALL result in the fixtures list no longer containing a fixture with that `id`.

**Validates: Requirements 7.2**

---

### Property 14: Layout serialisation round-trip

*For any* valid layout state, `JSON.parse(JSON.stringify(layout))` SHALL produce an object that is deeply equal to the original layout state.

**Validates: Requirements 8.6**

---

### Property 15: Clear layout resets to defaults

*For any* layout state (regardless of table dimensions or fixture count), activating the "Clear Layout" control SHALL result in the layout state being equal to `DEFAULT_STATE` (default table dimensions, empty fixtures list) and `localStorage` no longer containing a saved layout.

**Validates: Requirements 8.4, 8.5**

## Error Handling

### Dimension Validation

- Invalid inputs (non-numeric, ≤ 0) are caught in the `DimensionPanel` `onChange` handler before dispatching to the reducer.
- The previous valid value is retained in state; an error string is stored in a local `errors` object and displayed inline below the offending field.
- Errors clear as soon as the user enters a valid value.

### localStorage Errors

- `localStorage.setItem` is wrapped in a `try/catch`. If storage is full or unavailable, the error is silently swallowed (layout still works in-memory).
- On mount, `localStorage.getItem` result is validated with a `isValidLayout(parsed)` guard function. If validation fails (missing fields, wrong types), the default state is used and the corrupt entry is removed.

### Out-of-Bounds Fixture Drop

- On `pointerup`, the drop coordinates are checked against the SVG canvas bounding rect. If outside, the drag state is cleared without committing a position change, effectively reverting the fixture.

### Resize Clamping

- The `RESIZE_FIXTURE` reducer action clamps `width` and `height` to `Math.max(1, value)` before updating state, ensuring the minimum 1-unit invariant is always enforced at the state layer regardless of UI input.

### Unit Conversion Precision

- Conversion uses `Math.round(value * 100) / 100` to avoid floating-point drift accumulating across multiple toggles.

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:

- **Unit tests** cover specific examples, integration points, and edge cases.
- **Property tests** verify universal invariants across randomly generated inputs.

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/TypeScript PBT library). Install as a dev dependency:

```
npm install --save-dev fast-check
```

Each property test runs a minimum of **100 iterations** (`numRuns: 100`).

Each property test MUST include a comment tag in the format:

```
// Feature: booth-visualiser, Property N: <property text>
```

### Unit Tests (Vitest)

Focus on:
- Rendering: palette shows Rack, Box, Stand chips (Req 4.1)
- Rendering: view toggle has exactly two states (Req 3.1)
- Rendering: dimension inputs are present (Req 1.1)
- Rendering: selected fixture shows delete control (Req 7.1)
- Rendering: selected fixture shows resize handles (Req 6.1)
- Behaviour: default state when localStorage is empty (Req 8.3)
- Behaviour: canvas table rect dimensions match top view (Req 3.2)
- Behaviour: canvas table rect dimensions match front view (Req 3.3)
- Behaviour: dimension inputs present (Req 1.1, 1.5)

### Property Tests (fast-check)

One property-based test per correctness property:

| Test | Property | fast-check arbitraries |
|------|----------|----------------------|
| Invalid dimension inputs rejected | Property 1 | `fc.oneof(fc.string(), fc.integer({max: 0}))` |
| Unit conversion round-trip | Property 2 | `fc.record({ width: fc.float({min:1}), depth: fc.float({min:1}), height: fc.float({min:1}) })` |
| Scale factor fills canvas with margin | Property 3 | `fc.record({ tableW: fc.float({min:1}), tableH: fc.float({min:1}), canvasW: fc.float({min:100}), canvasH: fc.float({min:100}) })` |
| Proportional rendering invariant | Property 4 | `fc.record({ tableW: fc.float({min:1}), fixtureW: fc.float({min:1}) })` |
| View projection correctness | Property 5 | `fc.record({ width: fc.float({min:1}), depth: fc.float({min:1}), height: fc.float({min:1}), view: fc.constantFrom('top','front') })` |
| Fixture type definitions unique | Property 6 | (static data — single example suffices, but run as property for documentation) |
| Fixture drop creates bounded fixture | Property 7 | `fc.record({ type: fc.constantFrom('rack','box','stand'), x: fc.float({min:0}), y: fc.float({min:0}) })` |
| Fixture move updates position | Property 8 | `fc.record({ fixture: arbitraryFixture, newX: fc.float({min:0}), newY: fc.float({min:0}) })` |
| Out-of-bounds drop reverts | Property 9 | `fc.record({ fixture: arbitraryFixture, x: fc.float({max:-1}), y: fc.float({max:-1}) })` |
| Resize updates dimensions | Property 10 | `fc.record({ fixture: arbitraryFixture, dw: fc.float({min:1}), dh: fc.float({min:1}) })` |
| Resize label matches real-world units | Property 11 | `fc.record({ width: fc.float({min:1}), height: fc.float({min:1}), unit: fc.constantFrom('cm','in') })` |
| Resize clamp at minimum 1 unit | Property 12 | `fc.record({ fixture: arbitraryFixture, dw: fc.float({max:0.99}), dh: fc.float({max:0.99}) })` |
| Delete removes fixture | Property 13 | `fc.array(arbitraryFixture, {minLength:1})` |
| Layout serialisation round-trip | Property 14 | `arbitraryLayout` (composed arbitrary for full layout state) |
| Clear layout resets to defaults | Property 15 | `arbitraryLayout` |

### Test File Location

```
frontend/src/pages/__tests__/BoothVisualiser.test.jsx   — unit tests
frontend/src/pages/__tests__/BoothVisualiser.property.test.jsx — property tests
```

### Running Tests

```bash
# single run (no watch mode)
npx vitest --run
```
