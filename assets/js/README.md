# JavaScript module ownership

New implementation must live in functional modules:
`controls/`, `authoring/`, `activities/`, `grading/`, `assessment/`, `themes/`, `quality/`, `runtime/`, `live/`, `media/`.

Root-level JS files are existing application entrypoints or compatibility bridges. Do not create new monolithic feature files here.
