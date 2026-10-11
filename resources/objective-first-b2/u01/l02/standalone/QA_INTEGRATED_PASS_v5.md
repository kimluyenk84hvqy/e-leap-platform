# U1.2 Integrated Pass v5

Based on CLEAN MEDIA + ROLE PASS v4.

This package intentionally combines the two outstanding fixes into ONE upload:

1. Teacher reveal behavior for Screens 16–17 from v4 is preserved.
2. Screen 4 (Checking the previous lesson):
   - all six round buttons 1–6 fit in the right panel;
   - native video controls remain visible/clickable;
   - no transform/scale is applied to the video element;
   - object-fit: cover provides a safe visual crop of black bands;
   - Presentation reserves enough width for the full right-hand panel;
   - right-side navigation and answer box remain visible.

Do not append the earlier manual Screen 4 CSS patch after this stylesheet; it would override these rules.
