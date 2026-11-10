# E-LEAP Studio | LIFE U12 Opener + 12A + 12B Acceptance Fixture

**Canonical draft key:** `life-2e-a2b1-u12-opener-12a-12b`  
**Studio entry:** `/studio/?pilot=life-u12`  
**Git branch:** `feature/studio-media-library-v1` (Preview only)

## Sources verified

| Segment | Coursebook | PPT | Audio |
|---|---|---|---|
| Opener: storm chasers | printed p. 141 | slides 9–12 | Track 093 |
| 12A: extreme weather, What if, second conditional, pronunciation, speaking | printed pp. 142–143 | slides 13–30 | Track 095 for pronunciation |
| 12B: nature, David Liittschwager, indefinite pronouns, speaking | printed pp. 144–145 | slides 31–43 | Track 096 |

The source book audioscript appears at printed p. 189 for tracks 093, 095 and 096. Distinguish source locations from media that is actually hosted. The source book and PPT are **inputs to extraction**, not slide background pictures.

## Implemented pilot coverage

- 21 acceptance **screens**, grouped as Cover/Aims, Opener, 12A, 12B, Review and Closing.
- Every screen has explicit textbook and/or presentation source coordinates in model metadata, not learner text.
- Reading 12A has six Yes/No prompts with evidence excerpts from an adapted teaching passage and item-specific **Why** explanations. Teacher/Admin/Presentation may reveal and highlight evidence; this is a Studio preview interaction, not proof of the deployed lesson runtime's behavior.
- 12B five-item listening T/F uses answer sequence `T T T F F` confirmed from the supplied PPT.
- Grammar: second conditional and some-/any-/every-/no- families.
- Vocabulary has short definitions and no page-scanned image.
- Two listening source tracks and pronunciation source track are referenced as *unlinked* originals.
- One stable lesson draft ID; loading the same Studio pilot reuses the local draft. No ZIP exports.

## Blocking limitations before quality sign-off

1. **Eight media slots** (images/audio) still require authorized private storage references; neither upload nor playback is asserted as working.
2. The derived images in the PPT have not been copyright/license cleared for publication.
3. The 21 screens are a **coverage test**, not the final optimized slide count. Teaching combo step consolidation and true interactive runtime integration are pending.
4. Evidence interactions have been implemented in **Studio Preview**; full student exercise check/reset, role control, live class and response collection require browser end-to-end testing.
5. Visual layouts now have bounded and variant-driven CSS, but viewport-by-viewport screenshot tests and actual 16:9 projection testing are not completed.
6. Do not Publish to Production until missing assets and access controls are validated.

## Run available source-contract tests

With Node 22+:

```bash
node --experimental-default-type=module tests/studio-content-mapper.test.mjs
node --experimental-default-type=module tests/studio-life-u12.test.mjs
```

No production files or existing lessons are overwritten by importing this fixture.
