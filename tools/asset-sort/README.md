# Downloads asset sort

Sorts the asset-pack zips sitting in `C:\Users\thomas\Downloads` into the three
category folders, strips the junk files, commits once per category folder and
checks the build.

It exists because the cloud chat cannot read a local disk: `C:\Users\thomas\Downloads`
is only reachable from the machine itself, so the run happens there.

```powershell
cd C:\path\to\lantern-night
git switch freebuff/asset-checker        # the branch that has tasks/ and this tool
git pull
node tools/asset-sort/sort-downloads.mjs --src "C:\Users\thomas\Downloads"          # dry run
node tools/asset-sort/sort-downloads.mjs --src "C:\Users\thomas\Downloads" --apply  # do it
```

Dry run is the default: it lists every zip, its size, the category it would go
to, how many files it would add and how many junk files would be dropped.
Nothing is written, moved or committed until `--apply`.

## Where packs land

`public/assets/<category>/<pack-slug>/…` — files keep their paths inside the zip,
minus the single top-level folder most packs ship with.

| Pack | Category | Why |
|---|---|---|
| Zeldisaac | `lantern-night-ready` | 2D Zelda-style tilesets, characters, UI |
| KabGames Zelda-Style | `lantern-night-ready` | 2D Zelda-style tiles and characters |
| 16 Pixel Adventure RPG | `lantern-night-ready` | 2D pixel RPG characters and tiles |
| Trees Mega Pack CC0 | `lantern-night-ready` | CC0 2D trees and foliage |
| Super Pixel Effects Gigapack | `lantern-night-ready` | 2D pixel FX |
| 400 Sounds Pack | `lantern-night-ready` | SE/BGM source |
| GandalfHardcore packs | `lantern-night-ready` | 2D pixel RPG characters, enemies, icons |
| Shikashi Fantasy Icons | `lantern-night-ready` | UI icons |
| Background sets | `lantern-night-ready` | 2D backgrounds — flagged REVIEW, they could also be liminal |
| KayKit Adventurers | `other-game` | 3D low-poly characters; the RPG renders 2D only |
| Fantasy Props MegaKit | `other-game` | 3D props (KayKit) for the 3D concept |
| anything named liminal / backrooms / sci-fi / voxel / awareness-shift | `other-game` | second concept |
| a recognised pack name forced elsewhere | `--map` | see below |
| everything else | skipped | pass `--all-zips` to send unmatched zips to `future-vault` |

The three 3D-vs-2D calls and the background REVIEW flag are judgement calls, not
facts about the files. Override any of them without editing the table:

```powershell
node tools/asset-sort/sort-downloads.mjs --src "C:\Users\thomas\Downloads" --map "kaykit=lantern-night-ready" --map "backgrounds=future-vault"
```

`--map` takes a substring of the zip name and one of `lantern-night-ready`,
`other-game`, `future-vault`, and applies to the first match in argument order.

## What counts as junk

Dropped, matched as whole name tokens so `donated_sword.png` survives:

- `donate`, `donation(s)`, `facebook`, `license` / `licence` / `licensing`,
  `preview(s)`, `readme` / `read_me` — the request's list, plus the spelling
  variants packs actually ship.
- `Thumbs.db`, `desktop.ini`, `.DS_Store`, `__MACOSX/`, `.git/`, `.url`, `.lnk`.

License files are dropped by instruction, so the pack names go into
`tasks/freebuff-results.md` instead — keep attribution there, or in `CREDITS.md`,
before anything ships. Check each pack's original terms before using its art.

## Flags

| Flag | Default | Effect |
|---|---|---|
| `--src <dir>` | `%USERPROFILE%\Downloads` | folder holding the zips (searched one level, `.zip` only) |
| `--dest <dir>` | `public/assets` | where the category folders go |
| `--apply` | off | extract, strip, copy, commit per category, build, log |
| `--all-zips` | off | unmatched zips go to `future-vault` instead of being skipped |
| `--map name=category` | — | force a pack's category; repeatable |
| `--max-file-mb <n>` | 95 | files over this are not copied (GitHub refuses >100 MB); they are listed |
| `--max-category-mb <n>` | 500 | budget per category folder; a pack that would cross it is skipped whole, never half-copied |
| `--measure` | off | dry run only: extract to a temp folder so the unpacked size of each pack is shown before applying |
| `--strict` | off | exit 1 if any zip was bad or any pack was left out by the cap (default is to survive and report) |
| `--no-build` | off | skip `npm run build` |
| `--move-zips` | off | move sorted zips into `<src>\_sorted-<date>\` |
| `--log <file>` | `tasks/freebuff-results.md` | append the run here, if the branch has it |
| `--keep-temp` | off | keep the extraction scratch folder for inspection |

## What it does on `--apply`, in order

1. Extract each matched zip to a temp folder; drop junk by name.
2. Copy the rest into `public/assets/<category>/<slug>/`, skipping files over
   `--max-file-mb` (listed, never silently dropped) and symlinks or paths that
   would land outside the pack folder.
3. Check the category budget: if adding the pack would cross
   `--max-category-mb`, skip the whole pack and say so. Nothing is copied to
   the point where a pack is half in the repo.
4. `git add` + one commit per category folder that received files. Empty
   categories are reported, not committed.
5. `npm run build`; a non-zero exit prints the tail and makes the script exit 1.
6. Append a dated entry to `tasks/freebuff-results.md` (packs, counts, commits,
   bad zips, cap skips, build status) and commit it.
7. Print the totals.

## Bad zips

A zip that is 0 bytes, not a zip at all (an HTML error page saved as `.zip` is
the usual case), truncated, or that fails to extract is **skipped, not fatal**:

- it is reported in the table and the run continues with the next zip;
- nothing from it is copied, and no half-extracted files reach the repo;
- it stays where it is, even with `--move-zips`, so you can re-download it;
- the run still exits 0 unless `--strict` is passed.

Extraction is tried with `tar`, `unzip`, Python's `zipfile` and (on Windows)
PowerShell, in that order, so one bad handler is not a failed pack.

## Category size

The cap is per category folder, default 500 MB (`--max-category-mb`), and it is
applied per pack: a pack either fits and is copied whole, or is skipped whole
and named in the output and in the results log. That keeps a category under the
cap without leaving a half-copied pack that nobody notices. The single-file
limit (95 MB, GitHub's 100 MB hard limit) still applies inside a pack that fits.
Raise the cap deliberately, not by default: a category of several GB is a git
problem regardless of the per-file limit.

Nothing is pushed and nothing is deployed. Review `git log`/`git show`, then push
yourself.

## Two things to decide before a big run

- **`public/assets/` is generated.** `npm run assets` deletes it and rebuilds from
  the Ninja Adventure pack (see `ASSETS.md`, "Traps"), which would remove anything
  this script puts there. It is also served to the browser, so packs land in
  `dist/`. If these are library packs rather than shipped art, pick a home that
  survives the rebuild, for example `--dest assets-incoming`.
- **Size.** A 200+ GB pack cannot be committed as-is; GitHub rejects any single
  file over 100 MB and a history that large is impractical. `--max-file-mb`
  catches the individual offenders, but a huge pack is better trimmed by hand
  first, or sent to `future-vault` with `--map`.

## Tests

```bash
node tools/asset-sort/sort-downloads.test.mjs
```

Builds a throwaway git repo and a throwaway downloads folder, then runs the real
sorter against four embedded zips (two good, two broken) and checks 11 things:

| fixture | what it proves |
|---|---|
| `Zeldisaac_noroot.zip` - files at the archive root next to a folder | no top folder to strip: the layout is kept as-is, no wrapper folder invented, root-level files not lost |
| `KayKit_Adventurers_top.zip` - everything under one folder | that folder is stripped, so the pack starts at its own content |
| `Broken_Zeldisaac.zip` - an HTML error page named `.zip` | caught before extraction, reported as "not a zip" |
| `Corrupt_KayKit.zip` - a real `PK` header followed by garbage | passes the signature check, then fails every extractor, and is still skipped rather than aborting the run |

The assertions are the point of the test: exit 0 with both broken zips present,
both named in the run summary and in `tasks/freebuff-results.md`, no files from
them in the repo, the good packs copied and committed one category at a time, a
clean working tree afterwards, junk still stripped, and `--strict` flipping the
same run to exit 1. The zips are base64 in the test file, so it needs no zip
writer and no network; everything it writes lives in a temp folder that is
removed afterwards.
