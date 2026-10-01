# E-LEAP Platform Master v1.0 — APPROVED

GitHub-ready package for the approved E-LEAP platform shell.

## Open locally
Open `index.html`.

## GitHub Pages
This repository is ready for GitHub Pages deployment from the repository root.

See:
- `docs/DEPLOY-GITHUB-PAGES.md`
- `docs/ARCHITECTURE.md`

## Repository structure

```text
/
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/app.js
├── courses/
│   ├── registry.json
│   ├── objective-first-b2/
│   │   ├── course.json
│   │   └── unit-01/unit.json
│   ├── life-intermediate/
│   └── esp/
├── docs/
├── media-private/
├── .gitignore
├── .nojekyll
└── .env.example
```

## Production rule
The platform shell is locked. Add new courses, units, lessons, activities and classes as data/content without redesigning the shell.

## Next production task
Build **Objective First B2 — Unit 1** from an approved Content Map.

## Production Foundation v1.3 — Learning Event Contract
Adds the first central, UI-independent learning-event contract and a development-only local sink. Golden Reference lesson code is still preserved unchanged. The compatibility host records only truthful platform-level open/close events; it does not fabricate activity responses. See `docs/LEARNING-EVENT-CONTRACT-v1.0.md`.

## Production Foundation 1.4
Adds Native Activity Contract + Submission Model. Foundation QA: `engine/native-activity-qa.html`. This proves the normalized Choose/Type/Record → Submit → Teacher Responses → Progress path without changing U1.1/U1.2 Golden References. Local persistence is development-only.
