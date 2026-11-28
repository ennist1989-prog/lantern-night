# Pixel lint

Read-only checker for the sprite and creature sheets. Pillow only; it never writes or repairs an image.

```bash
python3 tools/pixel-lint/pixel_lint.py                 # chars + mon + boss (the default)
python3 tools/pixel-lint/pixel_lint.py --dir public/assets/tiles
python3 tools/pixel-lint/pixel_lint.py --max-colors 16 --fail-on-fail
```

Writes `tools/pixel-lint/report.md`: one row per scanned PNG with PASS or FAIL, the opaque colour count and the
size, then a section per failing image naming the rule and the offending pixels or colours. Faces
(`public/assets/faces`) are portraits and are not scanned by default.

## Rules

| # | rule | detail |
|---|---|---|
| 1 | palette cap | unique opaque colours <= `--max-colors` (default 12) |
| 2 | hard-edged alpha | every alpha is 0 or 255; anything between is flagged |
| 3 | outline | an opaque pixel with a transparent or off-image 4-neighbour must be `#141b1b` |
| 4 | highlight ceiling | brightest opaque colour is L* <= 90 in CIELAB; `#ffe08a` is exempt |
| 5 | no gold | hue 40-60 deg with chroma > 30 is flagged; `#ffe08a` is exempt |
| 6 | neighbour contrast | horizontally/vertically adjacent unlike opaque pixels differ by dL* >= 8; the report names the worst pair with coordinates |

L\*, chroma and hue are CIELAB (D65) computed from sRGB. Rule 5's chroma is the Lab chroma (`sqrt(a*^2 + b*^2)`),
not HSL saturation.

## Flags

- `--dir DIR` — folder to scan; repeatable, replaces the default set.
- `--max-colors N` — rule 1 cap.
- `--out PATH` — report path (default `tools/pixel-lint/report.md`).
- `--fail-on-fail` — exit 1 when any image FAILs. Without it the exit status is 0 whenever a report was written,
  because the report carries the verdict.

Failures are information for Pixel Sage and Ember: this tool does not choose art fixes, and nothing under
`public/assets/` or `art/custom/` is modified.
