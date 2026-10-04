# Compatibility bridges

The clean master intentionally keeps a limited set of root-level JS entrypoints under `assets/js/` because current Golden References and host pages import those paths.

These files are compatibility entrypoints, not preferred locations for new implementation. New code belongs in the corresponding modular folders (`controls`, `grading`, `runtime`, `live`, `authoring`, etc.).

Bridges should be removed only after U1.1/U1.2 have been migrated or verified against clean structured lessons.
