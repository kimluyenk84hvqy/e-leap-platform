# S3.7 Golden Reference audit — NOT ACCEPTED

Source: exact U4.1/U4.2 Native JSON and FINAL AUDITORIUM HTML; compare draft import/renderer fixture, not authenticated Studio or live class. Mapping below is a thematic correspondence, not proof of content equivalence.

## Full slide/tab traversal

### U4.1

| FINAL slide | Tabs (actual DOM labels) | Native candidate screens / gap |
|---|---|---|
| 1. ENDANGERED | Single state | 1: snow leopard, generic cover; institutional identity missing |
| 2. Aims of the lesson | Single state | 2: aims use Communication rather than Attitudes; not six explicit outcomes |
| 3. Modal verb recall | Items 1–5 / Items 6–10 / Items 11–14 | 3–5: modal items separated; no tabs |
| 4. A world at risk | Observe / Predict / Respond | No separate opener; tiger family photo absent |
| 5. Wildlife challenge | Match photos / Hot Seat / Make a choice | 6–9: photos and choice split; Hot Seat and shared reveal not equivalent |
| 6. Threats to wildlife | Discover / Match / Use | 10: matching only; three-stage flow absent |
| 7. Skim, scan & verify | Skim / Worked example 1 / Worked example 2 | 11, 23: strategy and examples separated |
| 8. A visit to a zoo | Expert read / Expert group / Home group / Group task | 12–22: expert accounts and matching split; no shared full-text panel/tab flow |
| 9. Are zoos good for conservation? | Think / Pair / Share | 24: discussion; no Think/Pair/Share tabs |
| 10. Word formation | Example / Items a–e / Items f–j / Apply | 25–26: two groups of word items; no four-tab flow |
| 11. From causes to solutions | Analyse task / Build ideas / Discover language / Study model / Plan & template / Write / Peer review | 27–28: causes and writing; seven-stage flow not represented |
| 12. Exit ticket | Single state | 29: exit task |
| 13. THANKYOU! | Single state | Missing closing screen |

FINAL: 13 slides, 37 top-level tab states. Native: 29 screens, 58 blocks; 0 field differences in compared activity fields. No real input controls in generic Presentation Preview. Height >1080 px in fixture:
- 10. Threats to wildlife: 1392 px
- 18. Information matching 1–2: 1661 px
- 19. Information matching 3–4: 1618 px
- 20. Information matching 5–6: 1487 px
- 21. Information matching 7–8: 1531 px
- 22. Information matching 9–10: 1574 px

### U4.2

| FINAL slide | Tabs (actual DOM labels) | Native candidate screens / gap |
|---|---|---|
| 1. AS AND LIKE | Single state | 1: generic cover; institutional identity missing |
| 2. Aims of the lesson | Single state | 2: aims labelled Grammar/Vocabulary/Skills rather than locked categories |
| 3. Review U4.1 | Quick challenge / Recall | 3: recall; no two-tab challenge/recall |
| 4. Discover as and like | Notice / Infer / Clarify / Transfer | 4, 10–11: notice/rules split; four-tab flow absent |
| 5. Life in an Animal Training Center | Read / Notice & verify / Apply | 5–9: text and grammar items split; shared reading tabs absent |
| 6. As, like or neither | Common errors / Items a–d / Items e–g | 11–13: errors and practice split |
| 7. Key word transformation | Strategy / Items 1–3 / Items 4–6 | 14–15: transformation practice split; strategy tab absent |
| 8. Compound adjectives | Observe / Discover / Describe / People / Other compounds / Numbers / Compound nouns | 16–19: compounds split; seven-tab flow absent |
| 9. Parts of animals | Parrot / Bear / Tiger / Rhino / Describe | 20: parts vocabulary; animal-specific image/model tabs absent |
| 10. Expressions with time | Language bank / Choose by context / Items a–d / Items e–h / Talk about time | 21–24: time language/practice split; five-tab flow absent |
| 11. Writing Folder 2 · Analyse | Task / Read the model / Cohesion / Missing paragraph / Improve language | 25–28: analysis content split; five-tab flow absent |
| 12. Writing Folder 2 · Produce | Analyse / Elicit ideas / Elicit language / Model / Discover structure / Plan & clarify / Draft & review | 25, 29–30: task/plan/draft; seven-stage flow absent |
| 13. Exit ticket | Recall & reflect | 31: exit task |
| 14. Thank you! | Single state | Missing closing screen |

FINAL: 14 slides, 48 top-level tab states. Native: 31 screens, 58 blocks; 0 field differences in compared activity fields. No real input controls in generic Presentation Preview. Height >1080 px in fixture:
- 4. Notice the difference: 1173 px
- 20. Parts of animals: 2196 px

## Findings and limits
- U4.1 matching answer sequence C A B A D E E B E C agrees, but Native passages are adapted, not equivalent to full FINAL text. Exact source review needed.
- Image hashes: U4.1 FINAL has 7 unique embedded images and Native 6; 0 byte-identical across sets (does not prove different visual subjects). U4.2 FINAL has 8 unique embedded images in D, Native 1; 1 byte-identical.
- Native package review warnings were discarded by import; fixed, now preserved as unverified provenance and academic review issues. Caller cannot grant approval.
- Browser fixtures: exact original FINAL HTML, extracted actual generic Studio renderer, mock image upload and data URI replacement solely in browser fixture, 1920×1080, external requests blocked. No real media or DB requests. All 85 top-level FINAL states traversed; no JS errors in traversal; all 60 imported presentation screen fragments rendered; title 54px in all. No claim of testing every reveal, nested expert selection, role transition, or visual fit.
- Regression: 169/170 passed with Node experimental default module + VM modules; Teacher Ownership suite blocked by missing @neondatabase/serverless. 3 new provenance tests passed.
- No remote mutations. Current restored tree has no .vercelignore; earlier storage exclusion is not retained in S3.6 checkpoint, must be reviewed before any deployment.
- Acceptance blocked: versioned golden Blueprint with explicit tab/step structure; complete source text/keys/media and licensed references; real interactive runtime with approved role controls; independently scrollable reading panels; cover/aims/closing templates; verified media access; authenticated Studio and projector QA.

## Reproduce
`node --experimental-default-type=module scripts/s37-golden-audit.mjs FIXTURE_DIR OUTPUT_DIR`
`python scripts/s37-golden-browser.py FIXTURE_DIR OUTPUT_DIR`
Run from repository root. Browser harness requires locally installed Playwright and Chromium; no runtime dependency added. The output contains draft content and should remain local.
