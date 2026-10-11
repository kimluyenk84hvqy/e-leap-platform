# E-LEAP Shell Engine — production-full-v1 checkpoint

## Locked model
E-LEAP is one modular house. Every major area and nested area is a shell identified by a stable ID and parent ID. Depth is not hard-coded.

## Supported structure operations
The Shell Engine contract supports Add, Rename, Move, Reorder, Hide/Show through status, Archive, and Remove Placement. Content/resources and learning evidence remain separate from shell placement.

## Official terminology
Use **Resource** and **Interactive Activity** consistently in product UI.

## CEFR
Skills Lab level shells use A1, A2, B1, B2, C1. C2 can be added later as another data node without changing the engine.

## Course exception
The approved Objective First B2 course flow remains Course → Unit → Lesson and opens the Golden Reference BG directly. Do not add an unnecessary visible layer between lesson and BG.

## Persistence boundary
This checkpoint supplies data-driven shell rendering and pure shell operations. A later authenticated Admin UI may persist these operations to storage; core navigation must not depend on hard-coded depth.
