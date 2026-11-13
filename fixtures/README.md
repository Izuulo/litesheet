# Fixtures

Real Litematica material list exports, used by the parser tests. Keep them byte-for-byte as
exported (no reformatting). They win over `docs/PRD.md` wherever the two disagree.

Wanted for M0:

- a `.txt` material list (plain "Write to file")
- a `.csv` material list (Shift + "Write to file")
- a `.json` material list (Alt + "Write to file")
- one export with a multiplier above 1 (header becomes `Total (xN)`)
- one large build (200+ item types) and one tiny build
- if possible, one exported with a non-English game language
