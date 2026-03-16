# Implementation Plan: Booth Visualiser

## Overview

Replace the existing grid-based `BoothVisualiser.jsx` with a proportional SVG canvas tool. Implementation is entirely frontend, contained within the existing component file and a new test directory.

## Tasks

- [x] 1. Define data models, constants, and the layout reducer
  - [x] 1.1 Define `FIXTURE_TYPES` constant array (Rack, Box, Stand with label, color, defaultWidth, defaultHeight)
    - _Requirements: 4.1, 4.2_
  - [x] 1.2 Define `DEFAULT_TABLE`, `DEFAULT_STATE`, and all reducer action types
    - _Requirements: 8.3_
  - [x] 1.3 Implement `layoutReducer` handling all actions: `SET_TABLE_DIM`, `SET_UNIT`, `SET_VIEW`, `ADD_FIXTURE`, `MOVE_FIXTURE`, `RESIZE_FIXTURE`, `DELETE_FIXTURE`, `CLEAR_LAYOUT`, `LOAD_LAYOUT`
    - Clamp `RESIZE_FIXTURE` width/height to `Math.max(1, value)`
    - Convert all dimension values on `SET_UNIT`
    - _Requirements: 1.3, 1.6, 6.4, 7.2_
  - [ ]* 1.4 Write property test for invalid dimension inputs rejected (Property 1)
    - **Property 1: Invalid dimension inputs are rejected**
    - **Validates: Requirements 1.3, 1.4**
  - [ ]* 1.5 Write property test for unit conversion round-trip (Property 2)
    - **Property 2: Unit conversion round-trip**
    - **Validates: Requirements 1.6**
  - [ ]* 1.6 Write property test for resize clamp at minimum 1 unit (Property 12)
    - **Property 12: Resize clamp at minimum 1 unit**
    - **Validates: Requirements 6.4**
  - [ ]* 1.7 Write property test for delete removes fixture (Property 13)
    - **Property 13: Delete removes fixture from list**
    - **Validates: Requirements 7.2**
  - [ ]* 1.8 Write property test for layout serialisation round-trip (Property 14)
    - **Property 14: Layout serialisation round-trip**
    - **Validates: Requirements 8.6**
  - [ ]* 1.9 Write property test for clear layout resets to defaults (Property 15)
    - **Property 15: Clear layout resets to defaults**
    - **Validates: Requirements 8.4, 8.5**

- [x] 2. Implement `isValidLayout` guard and localStorage persistence
  - [x] 2.1 Implement `isValidLayout(parsed)` function that validates shape and field types
    - _Requirements: 8.2_
  - [x] 2.2 Wire `useEffect` in `BoothVisualiser` root to read from `localStorage` on mount and write on state change
    - Wrap `setItem` in try/catch; remove corrupt entry on failed validation
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Implement `DimensionPanel` component
  - [x] 3.1 Render three `<input type="number">` fields for width, depth, height and a `cm`/`in` unit toggle
    - Display inline error messages below invalid fields
    - _Requirements: 1.1, 1.5_
  - [x] 3.2 Implement `onChange` handler that validates input before dispatching `SET_TABLE_DIM`; retain previous value and set error string on invalid input
    - _Requirements: 1.2, 1.3, 1.4_
  - [ ]* 3.3 Write unit tests for DimensionPanel rendering (inputs present, unit toggle present, error display)
    - _Requirements: 1.1, 1.5_

- [x] 4. Implement `ViewToggle` component
  - [x] 4.1 Render two buttons styled as a segmented control (`Top View` / `Front View`) using `#6c3fc5` accent
    - _Requirements: 3.1_
  - [ ]* 4.2 Write unit test: view toggle has exactly two states
    - _Requirements: 3.1_

- [x] 5. Implement scale factor calculation and `BoothCanvas` SVG surface
  - [x] 5.1 Implement `calcScaleFactor(tableRealW, tableRealH, canvasPixelW, canvasPixelH)` pure function using `MARGIN_FACTOR = 0.85`
    - _Requirements: 2.1_
  - [x] 5.2 Implement `BoothCanvas` component with a `ResizeObserver` on its wrapper `<div>` to track pixel width and derive `scaleFactor`
    - Set SVG `viewBox` dynamically; render `TableRect` using view-appropriate dimensions (width×depth for top, width×height for front)
    - _Requirements: 2.1, 2.4, 3.2, 3.3, 3.4_
  - [ ]* 5.3 Write property test for scale factor fills canvas with margin (Property 3)
    - **Property 3: Scale factor fills canvas with margin**
    - **Validates: Requirements 2.1, 2.4**
  - [ ]* 5.4 Write property test for view projection correctness (Property 5)
    - **Property 5: View projection correctness**
    - **Validates: Requirements 3.2, 3.3**
  - [ ]* 5.5 Write unit tests: canvas table rect dimensions match top view and front view
    - _Requirements: 3.2, 3.3_

- [x] 6. Implement `FixturePalette` component
  - [x] 6.1 Render draggable chips for each entry in `FIXTURE_TYPES` with distinct label and colour; attach `onPointerDown` to initiate palette drag
    - _Requirements: 4.1, 4.2, 4.4_
  - [ ]* 6.2 Write unit test: palette shows Rack, Box, Stand chips
    - _Requirements: 4.1_
  - [ ]* 6.3 Write property test for fixture type definitions unique (Property 6)
    - **Property 6: Fixture type definitions are unique**
    - **Validates: Requirements 4.2**

- [x] 7. Implement pointer-event drag-and-drop for fixture placement and movement
  - [x] 7.1 Implement drag state tracking in `BoothCanvas` using `onPointerDown`, `onPointerMove`, `onPointerUp` on the SVG element
    - Distinguish palette source (`{ type, source: 'palette' }`) from canvas source (`{ fixtureId, source: 'canvas', offsetX, offsetY }`)
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 7.2 On `pointerup` within canvas bounds, commit new fixture (palette drop) or updated position (canvas move) by dispatching `ADD_FIXTURE` or `MOVE_FIXTURE`
    - Generate fixture id via `crypto.randomUUID()` with `Date.now()` fallback
    - Clamp drop position to table bounds
    - _Requirements: 4.3, 5.2, 5.3_
  - [x] 7.3 On `pointerup` outside canvas bounds, revert by clearing drag state without dispatching
    - _Requirements: 5.4_
  - [ ]* 7.4 Write property test for fixture drop creates bounded fixture (Property 7)
    - **Property 7: Fixture drop creates a bounded fixture**
    - **Validates: Requirements 4.3, 5.2**
  - [ ]* 7.5 Write property test for fixture move updates position (Property 8)
    - **Property 8: Fixture move updates position**
    - **Validates: Requirements 5.3**
  - [ ]* 7.6 Write property test for out-of-bounds drop reverts position (Property 9)
    - **Property 9: Out-of-bounds drop reverts position**
    - **Validates: Requirements 5.4**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement `FixtureRect` with resize handles and delete control
  - [x] 9.1 Render each fixture as an SVG `<rect>` scaled by `scaleFactor`; show resize handles and delete button when the fixture is selected
    - _Requirements: 6.1, 7.1_
  - [x] 9.2 Implement resize handle `onPointerDown` that tracks drag delta and dispatches `RESIZE_FIXTURE`; display real-world dimension label during resize
    - _Requirements: 6.2, 6.3_
  - [x] 9.3 Implement delete button `onClick` that dispatches `DELETE_FIXTURE`
    - _Requirements: 7.2_
  - [ ]* 9.4 Write unit tests: selected fixture shows resize handles and delete control
    - _Requirements: 6.1, 7.1_
  - [ ]* 9.5 Write property test for proportional rendering invariant (Property 4)
    - **Property 4: Proportional rendering invariant**
    - **Validates: Requirements 2.3**
  - [ ]* 9.6 Write property test for resize updates fixture dimensions (Property 10)
    - **Property 10: Resize updates fixture dimensions**
    - **Validates: Requirements 6.2**
  - [ ]* 9.7 Write property test for resize label matches real-world units (Property 11)
    - **Property 11: Resize dimension label matches real-world units**
    - **Validates: Requirements 6.3**

- [-] 10. Wire all components together in `BoothVisualiser` root and add "Clear Layout" control
  - [-] 10.1 Compose `DimensionPanel`, `ViewToggle`, `BoothCanvas`, and `FixturePalette` inside `BoothVisualiser`; pass state and dispatch callbacks as props
    - _Requirements: 1.1, 3.1, 4.4_
  - [x] 10.2 Add "Clear Layout" button that dispatches `CLEAR_LAYOUT` and removes the `localStorage` entry
    - _Requirements: 8.4, 8.5_
  - [ ]* 10.3 Write unit test: default state when localStorage is empty
    - _Requirements: 8.3_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (`npm install --save-dev fast-check`) with `numRuns: 100`
- Each property test must include a comment tag: `// Feature: booth-visualiser, Property N: <property text>`
- Unit tests and property tests live in `frontend/src/pages/__tests__/`
- Run tests with `npx vitest --run`
