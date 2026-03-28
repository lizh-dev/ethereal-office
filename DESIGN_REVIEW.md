# The Ethereal Office - Design Review

## UX Problems to Fix

### 1. Drag & Drop from Palette Is Not True Drag-and-Drop

**Expected:** User drags a furniture item or room type from the EditorPanel palette directly onto the canvas, releasing it at the desired position (like Figma's component drag).

**Current:** Clicking a palette button calls `addFurnitureFromPalette(type, 400, 300)` or `addRoomFromPalette(type, 400, 300)` with hardcoded coordinates (400, 300). Every new item lands in the exact same spot. The user must then find it and drag it to the correct location. This is disorienting, especially when the canvas is zoomed or panned away from (400, 300).

---

### 2. Selection Model Is Disconnected Between Canvas and Editor Panel

**Expected:** Selecting an object on the canvas highlights it in the EditorPanel (and vice versa). There should be one unified selection state.

**Current:** The canvas maintains its own `selectedIds` state via `useState`, while the store has separate `selectedFurnitureId` and `selectedRoomId` fields. These two selection systems do not talk to each other. Clicking an item on the canvas updates `selectedIds` locally but never calls `selectFurniture()` or `selectRoom()` on the store, so the EditorPanel's "Selected Furniture" / "Selected Room" detail sections never appear. The EditorPanel's delete button and property inspector are effectively dead UI.

---

### 3. No Undo/Redo

**Expected:** Ctrl+Z / Ctrl+Shift+Z undo and redo any action (move, resize, add, delete). This is table-stakes for any editor.

**Current:** No undo/redo exists anywhere. Deleting a room with all its furniture is a one-way operation.

---

### 4. Canvas Scrolling Conflicts with Page Scroll

**Expected:** Scrolling over the canvas should pan the floor map. Ctrl/Cmd+scroll should zoom. The page itself should not scroll.

**Current:** `handleWheel` calls `e.evt.preventDefault()` which is correct, but only when the event reaches the Konva stage. If the user scrolls while the cursor is outside the stage (e.g., over the sidebar or near the edge), the page may still scroll. There is no `overscroll-behavior` CSS or body scroll lock.

---

### 5. New Rooms Always Stack Vertically Below Existing Ones

**Expected:** The user should be able to place a new room anywhere on the canvas, ideally by clicking or dragging to a position.

**Current:** In SpaceWizard, `handleGenerate` calculates `oy = maxY + 30`, meaning every new space is appended below the lowest room. The horizontal position is always `ox = 20`. This creates a single-column layout that grows downward indefinitely, making it impossible to create a sensible floor plan without manual rearranging after the fact.

---

### 6. Context Menu Is Minimal and Mispositioned

**Expected:** Right-click offers actions like duplicate, copy/paste, bring-to-front, send-to-back, lock, group, and delete. The menu should appear in screen coordinates relative to the viewport.

**Current:** The context menu only has a single "delete" option. Its position is set using `pointer.x` and `pointer.y` from Konva's `getPointerPosition()`, which returns viewport-relative coordinates. However, when the canvas is zoomed or panned, the menu may appear in the wrong spot because the CSS `left/top` is applied to a DOM overlay that does not account for the stage's transform.

---

### 7. Room and Furniture Are Not Linked (Parent-Child)

**Expected:** Furniture placed inside a room should move with the room when the room is dragged. Deleting a room should delete its contained furniture.

**Current:** The `removeRoom` action in the store attempts to clean up furniture by checking positional overlap (`f.x >= room.x && f.x <= room.x + room.w`), which is fragile. There is an optional `roomId` field on Furniture, but the SpaceWizard and addFurnitureFromPalette never set it. Dragging a room does not move its furniture at all -- furniture stays in place while the room slides out from under it.

---

### 8. Resize via Transformer Does Not Persist

**Expected:** Resizing a room or furniture with the Transformer handles should update the store's width/height values.

**Current:** The Konva `Transformer` is wired up visually, but there is no `onTransformEnd` handler. After the user resizes an object, the Konva node's local `scaleX/scaleY` change, but the store's `w` and `h` values remain the same. On the next re-render the object snaps back to its original size.

---

### 9. Snap Guides Use Client Rect Coordinates

**Expected:** Snap guides should work correctly regardless of zoom level or pan offset.

**Current:** `handleDragMove` calls `node.getClientRect()` and `other.getClientRect()`, which return screen-space bounding boxes. The snap correction then divides by `stage.scaleX()` and subtracts `stage.x() / stage.scaleX()`, but this math breaks down when objects are rotated or when the stage origin is not (0,0). The snap lines rendered at `guides.x` and `guides.y` are in screen coordinates but drawn in the stage's coordinate space, so they appear offset.

---

### 10. No Keyboard Shortcuts

**Expected:** Delete/Backspace deletes selection. Arrow keys nudge. Ctrl+A selects all. Escape deselects.

**Current:** None of these exist. The only way to delete is via the context menu.

---

### 11. SpaceWizard Generates Furniture at Absolute Coordinates

**Expected:** Generated furniture positions should be relative to their parent room so that moving the room moves everything together.

**Current:** `generateDeskArea` etc. calculate furniture positions as `ox + pad + c * cellW`, where `ox` is the room's absolute position. The furniture is then added as independent top-level items with absolute x/y, no `roomId` set. This means furniture and room are disconnected from the moment of creation.

---

### 12. Camera State Is Not Used by the Canvas

**Expected:** The `camera` object in the store should drive the Konva Stage's position and scale.

**Current:** The store has `camera: { x, y, zoom }` and a `setCamera` action, and SpaceWizard calls `setCamera` after generating a room. But FloorCanvas never reads `camera` from the store -- the Stage's position and scale are managed entirely through direct Konva API calls (`stage.position()`, `stage.scale()`). The `setCamera` call in SpaceWizard has zero effect.

---

### 13. Avatar Movement Is Not Animated

**Expected:** Clicking a point on the floor should smoothly animate the current user's avatar to that position (like oVice).

**Current:** `moveCurrentUser` sets a `targetPosition` on the user object, but nothing reads `targetPosition` to animate. The `AvatarShape` component renders at `user.position`, and `position` is never updated after the initial state. The avatar does not move at all when the user clicks in view mode.

---

### 14. No Visual Feedback for Editor Mode Toggle

**Expected:** When switching between view and edit mode, the canvas should clearly indicate the current mode (e.g., a colored border, overlay text, or different cursor).

**Current:** The mode toggles the `draggable` prop on canvas objects, but there is no visual cue. Users cannot tell whether they are in edit mode or view mode just by looking at the canvas.

---

### 15. Floor Plan Export but No Save

**Expected:** Changes should persist across page reloads, either via localStorage or a backend.

**Current:** `exportFloorPlan` serializes to JSON and `importFloorPlan` reads it back, but there is no auto-save, no localStorage persistence, and no save button. All changes are lost on refresh.

---

## Architecture Issues

### A. Dual Selection State

The canvas has local `selectedIds: string[]` (via `useState`) while the store has `selectedFurnitureId: string | null` and `selectedRoomId: string | null`. These are never synchronized. The EditorPanel reads from the store; the canvas reads from local state. This split makes the selection system non-functional across components.

**Fix:** Consolidate selection into the store as a single `selectedIds: string[]`. Remove all local selection state from FloorCanvas.

### B. No Parent-Child Relationship Between Room and Furniture

Furniture items exist as a flat list with optional `roomId` that is almost never set. There is no mechanism to automatically associate furniture with the room it visually sits inside, no group-drag, and no cascading delete that reliably works.

**Fix:** Always set `roomId` when furniture is created inside a room. When a room is dragged, compute the delta and apply it to all furniture with matching `roomId`. When a room is deleted, remove all furniture with matching `roomId`.

### C. Camera State Is Disconnected

The store holds `camera` but the canvas ignores it. This means any external component (like SpaceWizard) that wants to adjust the viewport has no working mechanism.

**Fix:** Either remove `camera` from the store and let FloorCanvas own it entirely, or make FloorCanvas derive its Stage transform from `camera` in the store (controlled component pattern).

### D. FloorCanvas Is a 430-Line God Component

FloorCanvas handles: rendering rooms, rendering furniture, rendering avatars, selection rectangles, snap guides, context menus, drag handling, zoom controls, wheel events, and resize observation. This makes it hard to extend or debug.

**Fix:** Extract into sub-components and custom hooks:
- `useCanvasSelection()` - selection rectangle, multi-select, shift-click
- `useSnapGuides()` - snap detection and guide rendering
- `useCanvasZoom()` - wheel handler, zoom controls, fit-all
- `RoomLayer` - room rendering
- `FurnitureLayer` - furniture rendering
- `AvatarLayer` - avatar rendering
- `ContextMenu` - extracted from inline JSX

### E. ID Generation Is Fragile

`nextId` in SpaceWizard uses `Date.now()` + random string. `furnitureIdCounter` / `roomIdCounter` in the store use incrementing integers starting from 100. The default floor plan uses short strings like `'ca-t'`. These three schemes will collide if the user adds items from the palette and the wizard in the same session.

**Fix:** Use a single ID generation strategy (e.g., `crypto.randomUUID()` or a nanoid-style approach) across all creation paths.

### F. No Persistence Layer

The store is purely in-memory Zustand with no middleware. There is no `persist` middleware, no localStorage bridge, no API layer.

**Fix:** Add Zustand's `persist` middleware for localStorage as a quick win. Plan for a backend API layer for multi-user sync later.

---

## Priority Actions (Ordered)

### P0 -- Critical (Editor Is Broken Without These)

1. **Unify selection state** - Move `selectedIds` into the store. Wire EditorPanel and FloorCanvas to the same selection. This unblocks the property inspector and delete button in the sidebar.

2. **Wire room-furniture parent-child** - Set `roomId` on all furniture. Make room drag move its children. Make room delete remove its children.

3. **Persist resize transforms** - Add `onTransformEnd` to rooms and furniture groups that writes new `w`, `h`, and `rotation` back to the store.

4. **Connect camera state** - Either make FloorCanvas read from `store.camera` or remove the store field and let the canvas own zoom/pan entirely.

### P1 -- High Priority (Bad UX Without These)

5. **Implement true drag-from-palette** - When the user mousedowns on a palette item, create the object at the cursor and enter a drag state. Drop places it at the release position in canvas coordinates.

6. **Animate avatar movement** - Read `targetPosition`, animate `position` toward it with requestAnimationFrame or Konva's built-in `to()` tween.

7. **Add undo/redo** - Implement a simple action history stack in the store (or use zustand-history middleware).

8. **Add keyboard shortcuts** - Delete, arrow-key nudge, Ctrl+A, Escape, Ctrl+Z/Y.

9. **Add localStorage persistence** - Use Zustand persist middleware so floor plans survive page refresh.

### P2 -- Medium Priority (Polish)

10. **Fix snap guide coordinate math** - Convert all snap calculations to stage-local coordinates so they work correctly at any zoom level.

11. **Expand context menu** - Add duplicate, copy/paste, bring-to-front/back, lock.

12. **Add mode indicator** - Show a colored border or overlay label when in edit mode.

13. **SmartPlace for SpaceWizard** - Instead of stacking rooms vertically, find available empty space on the canvas or let the user click to place.

14. **Refactor FloorCanvas** - Extract hooks and sub-components for maintainability.

### P3 -- Low Priority (Future)

15. **Consistent ID generation** - Migrate to a single UUID/nanoid approach.

16. **Export/import improvements** - Save/load named floor plans, version history.

17. **Multi-user real-time sync** - WebSocket layer for collaborative editing.

---

## Ideal User Flow

### Creating a New Office Floor Plan

1. **Start with a blank canvas.** The user opens the app and sees an empty grid with a prompt: "Click + to add your first space."

2. **Add the first room via SpaceWizard.** The user clicks the "+" button, selects "Desk Area," names it "Engineering," chooses 3 rows x 4 columns, and clicks Create. The room appears centered on the canvas with desks, chairs, and monitors already arranged inside it.

3. **Pan and zoom to inspect.** Two-finger scroll pans, pinch or Ctrl+scroll zooms. The canvas feels like an infinite workspace (reference: Figma, Miro).

4. **Add more spaces.** The user opens SpaceWizard again, adds a Meeting Room, a Lounge, and a Cafe. Each new room appears near the center of the current viewport (not stacked below). The user drags each room to arrange them into a floor layout.

5. **Fine-tune with palette items.** The user switches to edit mode and drags a plant from the furniture palette directly onto the canvas, dropping it in the lounge. They add a printer near the open area.

6. **Resize and rotate.** The user selects a room and drags its corner handles to make it wider. They select a sofa and rotate it 90 degrees.

7. **Align and snap.** As the user drags rooms close to each other, snap guides appear showing alignment. Rooms snap to edges and centers of nearby rooms with a satisfying click.

8. **Review.** The user presses Escape to exit edit mode. They see their complete floor plan with all rooms, furniture, and labels.

9. **Save.** The floor plan is auto-saved to localStorage. The user can also export as JSON for backup or sharing.

### How Editing Should Feel

The editing experience should feel like **Figma's canvas** crossed with **oVice's spatial concept**:

- **Direct manipulation.** Click to select, drag to move, handles to resize. No property panels required for basic operations (but available for precise control).

- **Multi-select.** Drag a selection rectangle or Shift+click to select multiple items. Move, delete, or duplicate them as a group.

- **Spatial awareness.** Snap guides and alignment helpers make it easy to create orderly layouts without counting pixels. Grid snapping is optional (toggle in sidebar).

- **Undo everything.** Every action is undoable. The user should never fear making changes.

- **Mode clarity.** View mode is for using the office (moving your avatar, seeing who's where). Edit mode is for arranging the floor plan. The visual distinction should be unmistakable -- for example, a blue border around the canvas and a floating "Editing" badge.

- **Responsive feedback.** Hover highlights objects. Dragging shows a ghost preview. Dropping snaps to grid. Deleting shows a brief animation. Every action should feel immediate and reversible.

- **Room = container.** Furniture inside a room belongs to that room. Moving the room moves everything inside it. This is the mental model users expect from every spatial editor.
