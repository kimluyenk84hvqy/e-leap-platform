# Local PDF Intake Extension (Foundation Lab, Preview)
Adds local browser PDF text extraction to the M1 Foundation Lab.
- Up to 25 MB, first 30 PDF pages, selectable text only; uses the same version-pinned PDF.js CDN as existing Resource Workshop.
- Extracted text retains source page boundaries. It is explicitly **unverified** and requires teacher review, restructuring, and explicit UNIT/TASK markers before the deterministic task parser can accept it.
- No OCR or image-only PDF extraction, PPTX reading, audio understanding, or semantic matching is claimed.
- No document bytes uploaded to server; on opening PDF.js code/worker itself is fetched from CDN. Future review should vendor PDF.js for guaranteed availability and supply-chain control.
- This is an additional step toward M1, not a full M1 pass.
