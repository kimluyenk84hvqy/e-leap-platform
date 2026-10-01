# E-LEAP — Production Foundation v1.0

**Formal name:** E-LEAP — English Learning, Engagement and Assessment Platform  
**Technical ID:** `e-leap`

## Locked production rules
1. Shells are generic nodes. Depth is not hard-coded.
2. Stable IDs do not change when a shell is renamed or moved.
3. Resources (furniture) have their own identity and are attached by placements/references.
4. The same resource may be reused in multiple shells without copying the canonical source.
5. Content and learning data are separate. Moving/replacing content must not erase historical learner evidence.
6. Course/Unit/Lesson/Skills structures are data, not hard-coded page layouts.
7. Approved visual identity/colors from Platform Master v1.0 are retained.
8. U1.1 and U1.2 are Golden Reference lessons; lesson content is not redesigned during Foundation work.
9. Every production media resource is license-aware. Unknown rights default to AMBER/private-until-cleared.
10. Lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED.

## Shell operations
Create · Rename · Move · Reorder · Archive. These operations change metadata/relationships, not source code structure.

## Resource operations
Add · Replace/version · Attach · Reuse · Unplace · Archive. A resource keeps one stable ID.

## Copyright gate
- GREEN: owned, licensed, public-domain, or otherwise cleared for intended use.
- AMBER: restricted/unclear; private until the permitted scope is verified.
- RED: not permitted for intended use; do not publish; replace or obtain permission.

Attribution is recorded when required, but attribution alone is not treated as permission.

## Next integration checkpoint
Import canonical U1.1/U1.2 lesson JSON into `resources/objective-first-b2/u01/...`, audit media, then connect the shared Lesson Engine without changing the approved lesson content.
