# E-LEAP Control Layout & Visual State Contract — LOCK CANDIDATE

This contract changes presentation/layout only. The locked Role Control Contract remains authoritative for functionality.

## Desktop layout
- Teacher: fixed Right Smart Dock, grouped as Activity and Class. Collapsible; last collapse preference is remembered locally.
- Admin: same Right Smart Dock plus Edit in Studio when permitted.
- Student: compact Bottom Activity Bar close to the task.
- Guest: compact Bottom Activity Bar without Submit.
- Presentation: minimal bottom-right dock containing Show answer, Reset, Exit Presentation.

## Tablet/mobile
All roles use an adaptive bottom bar with horizontal overflow rather than covering lesson content with a tall toolbar.

## Visual states
- Idle: neutral surface.
- Hover/focus: subtle accent only.
- Active/toggle-on: soft accent fill/outline; never saturated decoration.
- Success: soft positive feedback; transient for one-shot actions.
- Disabled: reduced opacity and non-interactive cursor.
- Submit is the only Student primary action.
- Score is a status indicator, not a button.
- Timer/Presentation/Live states may remain visibly active while the state is active.
- Responses may show a small count badge.

## Non-negotiables
- No free-dragging controls.
- No per-lesson button placement overrides.
- No changes to U1.1/U1.2 Golden content or locked Next/Previous behavior.
- Unsupported actions follow the shared role/activity contract; no ad-hoc lesson-specific behavior.
