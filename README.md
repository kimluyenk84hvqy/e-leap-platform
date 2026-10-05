# E-LEAP Teacher Live · Create Class UI Fix

Fixes the first end-to-end live-class test failure:
- `+ Create a new class` now immediately shows **New class name** even if the live DB/bootstrap request fails or returns no existing classes.
- Switching to an existing class hides the new-class field; switching back shows it again.
- Focus moves to the class-name input automatically.
- Pressing Enter in the class-name field starts the same create-session flow.
- Existing class/session/QR APIs are unchanged.

Upload `teacher-live.html` to the repository root on branch `e-leap-clean-v1` and overwrite the existing file.

Suggested commit:
`Fix Teacher Live new class input visibility`
