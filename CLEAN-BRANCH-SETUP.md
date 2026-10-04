# e-leap-clean-v1 setup

Target branch: `e-leap-clean-v1`

Use this FULL package as the only source baseline for the new clean branch.

Recommended sequence:
1. Keep `production-full-v1` unchanged as production safety baseline.
2. Keep `r1-r2-preview` only as historical/transition preview.
3. Create branch `e-leap-clean-v1`.
4. Replace branch working tree with the contents of this FULL package.
5. Deploy that branch as Preview.
6. Smoke-test Home → Courses → U1.1 → U1.2 → Studio → Live Class.
7. Start U2.1 only after the clean branch passes smoke tests.
