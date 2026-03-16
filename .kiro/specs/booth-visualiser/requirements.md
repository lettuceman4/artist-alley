# Requirements Document

## Introduction

The Booth Visualiser is a React-based interactive canvas tool that allows artist alley vendors to plan their booth layout before an event. Users can configure the physical dimensions of their table, switch between front and top views, and drag-and-drop display fixtures (racks, boxes, etc.) onto the canvas. All elements are rendered proportionally to real-world dimensions, giving vendors an accurate spatial preview of their setup.

This feature replaces the existing grid-based layout in `BoothVisualiser.jsx` with a proper proportional canvas-based visualiser.

## Glossary

- **Visualiser**: The React component that renders the booth layout canvas and all interactive controls.
- **Canvas**: The HTML5 canvas or SVG-based rendering surface on which the table and fixtures are drawn.
- **Table**: The physical vendor table whose dimensions the user configures.
- **Fixture**: A draggable, resizable shape representing a display item placed on or around the table (e.g. a rack, a box, a stand).
- **Top View**: A bird's-eye perspective of the table showing the full surface area.
- **Front View**: A straight-on perspective of the table showing width and height (depth is not visible).
- **Scale Factor**: The ratio used to convert real-world dimensions (cm or inches) to canvas pixels, ensuring all elements are proportional.
- **Palette**: The sidebar panel listing available fixture types that can be dragged onto the canvas.

---

## Requirements

### Requirement 1: Table Dimension Configuration

**User Story:** As a vendor, I want to specify the width, depth, and height of my table, so that the canvas accurately reflects my real table size.

#### Acceptance Criteria

1. THE Visualiser SHALL provide numeric input fields for table width, depth, and height.
2. WHEN a user changes a table dimension input, THE Visualiser SHALL update the Canvas within 100ms to reflect the new dimensions.
3. IF a user enters a dimension value less than or equal to zero, THEN THE Visualiser SHALL display an inline validation error and retain the previous valid value.
4. IF a user enters a non-numeric value in a dimension field, THEN THE Visualiser SHALL display an inline validation error and retain the previous valid value.
5. THE Visualiser SHALL support dimension units of centimetres and inches, selectable via a toggle control.
6. WHEN the unit toggle is changed, THE Visualiser SHALL convert all existing dimension values to the newly selected unit and re-render the Canvas.

---

### Requirement 2: Proportional Rendering

**User Story:** As a vendor, I want all elements on the canvas to be proportional to one another, so that I can accurately judge spacing and fit.

#### Acceptance Criteria

1. THE Canvas SHALL derive a Scale Factor from the table dimensions and the available canvas pixel area such that the table fills the canvas at a consistent margin.
2. WHEN the table dimensions change, THE Canvas SHALL recalculate the Scale Factor and re-render all fixtures at their correct proportional sizes.
3. THE Canvas SHALL render all fixtures using the same Scale Factor applied to the table, so that a fixture with half the table width occupies half the canvas table width.
4. WHEN the browser window is resized, THE Canvas SHALL recalculate the Scale Factor and re-render all elements to fit the new available area without distortion.

---

### Requirement 3: Front and Top View Toggle

**User Story:** As a vendor, I want to switch between a top-down view and a front-facing view of my table, so that I can plan both the surface layout and the vertical display arrangement.

#### Acceptance Criteria

1. THE Visualiser SHALL provide a toggle control with exactly two states: "Top View" and "Front View".
2. WHEN the user selects "Top View", THE Canvas SHALL render the table as a rectangle representing width × depth.
3. WHEN the user selects "Front View", THE Canvas SHALL render the table as a rectangle representing width × height.
4. WHEN the view is toggled, THE Canvas SHALL re-render within 100ms.
5. WHILE a fixture is placed on the Canvas, THE Canvas SHALL display the fixture in the appropriate projection for the active view.

---

### Requirement 4: Fixture Palette

**User Story:** As a vendor, I want a palette of fixture types to choose from, so that I can represent different display items in my layout.

#### Acceptance Criteria

1. THE Palette SHALL display at least the following fixture types: Rack, Box, Stand.
2. THE Palette SHALL render each fixture type with a distinct visual label and colour.
3. WHEN a user drags a fixture from the Palette onto the Canvas, THE Visualiser SHALL create a new fixture instance at the drop position.
4. THE Palette SHALL remain accessible while fixtures are placed on the Canvas.

---

### Requirement 5: Drag-and-Drop Fixture Placement

**User Story:** As a vendor, I want to drag and drop fixtures onto the canvas, so that I can freely arrange my display items.

#### Acceptance Criteria

1. WHEN a user begins dragging a fixture from the Palette, THE Canvas SHALL highlight valid drop zones.
2. WHEN a user drops a fixture onto the Canvas, THE Visualiser SHALL place the fixture at the nearest valid position within the canvas bounds.
3. WHEN a user drags an already-placed fixture, THE Canvas SHALL move the fixture to the new drop position.
4. IF a user drops a fixture outside the Canvas bounds, THEN THE Visualiser SHALL return the fixture to its previous position.
5. WHEN a fixture is placed, THE Visualiser SHALL render the fixture proportionally according to the current Scale Factor.

---

### Requirement 6: Fixture Resizing

**User Story:** As a vendor, I want to resize fixtures on the canvas, so that I can match the actual dimensions of my display items.

#### Acceptance Criteria

1. WHEN a user selects a placed fixture, THE Canvas SHALL display resize handles on the fixture boundary.
2. WHEN a user drags a resize handle, THE Canvas SHALL update the fixture dimensions in real time.
3. THE Visualiser SHALL display the current width and height of the selected fixture in real-world units (cm or inches) as the user resizes.
4. IF a user resizes a fixture to a width or height less than 1 unit, THEN THE Visualiser SHALL clamp the dimension to 1 unit and stop further reduction.
5. WHEN a fixture is resized, THE Canvas SHALL maintain the fixture's proportional rendering relative to the Scale Factor.

---

### Requirement 7: Fixture Removal

**User Story:** As a vendor, I want to remove fixtures from the canvas, so that I can correct mistakes in my layout.

#### Acceptance Criteria

1. WHEN a user selects a placed fixture, THE Visualiser SHALL display a delete control for that fixture.
2. WHEN a user activates the delete control, THE Visualiser SHALL remove the fixture from the Canvas.
3. WHEN a fixture is removed, THE Canvas SHALL re-render without the deleted fixture within 100ms.

---

### Requirement 8: Layout Persistence

**User Story:** As a vendor, I want my layout to be saved between sessions, so that I do not have to recreate my booth plan every time I visit the page.

#### Acceptance Criteria

1. WHEN the layout state changes (table dimensions, fixture positions, fixture sizes), THE Visualiser SHALL serialise the layout to browser localStorage.
2. WHEN the Visualiser is mounted, THE Visualiser SHALL deserialise and restore the layout from localStorage if a saved layout exists.
3. IF no saved layout exists in localStorage, THEN THE Visualiser SHALL initialise with default table dimensions and an empty fixture list.
4. THE Visualiser SHALL provide a "Clear Layout" control that removes all fixtures and resets table dimensions to their defaults.
5. WHEN the "Clear Layout" control is activated, THE Visualiser SHALL remove the saved layout from localStorage and re-render the Canvas with default values.
6. FOR ALL valid layout states, serialising then deserialising the layout SHALL produce an equivalent layout state (round-trip property).
