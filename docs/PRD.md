# PRD: Litesheet (working name)

**Turn Litematica material lists into trackable, customizable spreadsheets**

|             |                                                                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner       | Finn                                                                                                                                         |
| Builder     | Claude Code                                                                                                                                  |
| Status      | Draft v4. Phase A done, Phase B next                                                                                                         |
| Date        | 2026-11-13                                                                                                                                   |
| Form factor | Static web app (client-side only) with two outputs: an **in-browser tracker** and an **Excel (.xlsx) export**. Optional companion mod later. |

**v2 changes:** Added the in-browser tracker as a core feature (check items off, type collected counts, multiple saved builds), with two-way sync to the Excel export. This replaces the Litematica Material Viewer, which is no longer available.

**v3 changes:** Added two phases that come before any feature code: **Phase A: public repo setup** (§11.1) and **Phase B: design every screen on a design canvas and get approval** (§11.2).

**v4 changes (after Phase A):** Brought the document in line with what was built and settled its internal contradictions. Repo is `izuulo/litesheet`, published as Izuulo with a GitHub noreply commit email. Node 26 LTS; pnpm installed with npm, since Corepack no longer ships with Node. Scaffolded in place, not in a subfolder. v1 reads the plain `.json` export only (raw-material JSON is P2). The config URL is P1. Added the "This is me" setting behind the "Assigned to me" filter, and the Checkbox column the Printable preset uses. Row key is item ID, else display name + stack size. Dark mode and the phone layout are built with the components from Phase B on, not at M7.

---

## 0. Instructions for Claude Code (read first)

**Order of work: Phase A (repo setup) → Phase B (design canvas, approved by Finn) → M0 to M7.** No feature code (parsers, storage, Excel export) before Phase B is approved. Details in §11.

0. **Ask Finn before anything public or irreversible:** confirm the repo name and that he's logged in with `gh auth status` before running `gh repo create`, and before changing repo settings or enabling Pages.
1. **Before writing any parser code, ask Finn for real export files** and put them in `fixtures/`. (Ask for them during Phase A so they're ready by M0.) You need at least:
   - a `.txt` material list (plain "Write to file")
   - a `.csv` material list (Shift + "Write to file")
   - a `.json` material list (Alt + "Write to file")
   - one export with a multiplier above 1 (header becomes `Total (xN)`)
   - one large build (200+ item types) and one tiny build
   - if possible, one exported with a non-English game language
     Sections 2.1 and 5 describe what we know about these formats from Litematica's source code. **Fixtures win over this document** wherever they disagree. Write down any differences you find in `docs/FORMATS.md`.
2. Work test-first for the parsers and the unit math (section 6). Those are pure functions with exact expected outputs.
3. Work in the order in section 11. Don't start a phase or milestone until the previous one meets its acceptance criteria.
   3b. One branch + pull request per phase/milestone, merged only when CI is green. Use conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
4. Every generated `.xlsx` must open without repair prompts in **Excel, LibreOffice Calc, and Google Sheets (via File > Import)**. If a feature breaks in one of them, degrade it gracefully. Don't drop the target.
5. Keep it lightweight and minimal. No backend, no accounts, no analytics. Everything runs in the browser.

---

## 1. Problem

Litematica's material list shows Total / Missing / Available for a schematic. The **Available** column only counts what's in your **player inventory** at that moment. On a small build that's fine. On a large build:

- The materials don't fit in your inventory, or even in the shulkers you can carry.
- You stash them in chests at the build site, and Litematica can't see them, so it says everything is "missing" again.
- The in-game list stops being useful as a tracker right when you need it most.

What players do now is copy the list into a spreadsheet by hand and keep "collected" counts there. That's slow, error-prone, and has to be redone whenever the schematic changes.

**Litesheet** takes the file Litematica already exports and gives you two ways to track it, working on the same data:

1. **Track in the browser:** a fast checklist where you check items off, add collected counts in stacks or shulkers with one click, and see what's left. Saved locally, with multiple builds side by side.
2. **Export to Excel:** a ready-made tracking spreadsheet with formulas, progress, stack and shulker math, and a layout you can switch around with toggles. Good for sharing through Google Sheets or for people who live in spreadsheets.

You can move between them at any time. Export your browser progress to `.xlsx`, or load a filled-in `.xlsx` back into the browser.

---

## 2. Research summary

### 2.1 What Litematica exports (from source)

From `GuiMaterialList.java` in the maintained Litematica fork (sakura-ryoko, 1.21.11 branch):

- **"Write to file"** writes into `<minecraft>/config/litematica/`.
  - No modifier: ASCII table `.txt`
  - **Shift**: `.csv`
  - **Alt**: `.json` (`material_list_<timestamp>.json`, written by `MaterialListJsonExporter`)
- The `.txt` and `.csv` have **4 columns**: `Item`, `Total` (or `Total (xN)` when the multiplier is above 1), `Missing`, `Available`. There is also a header line with the list title (e.g. `Material List for placement 'Name'`).
- **The Item column is the display name** (`stack.getHoverName().getString()`), **not** a registry ID. That means:
  - names are **localized** to the player's game language;
  - renamed or special items show their display name;
  - to get stack sizes we need a **display name → item ID** lookup.
- When the multiplier is above 1, `Missing` is written as `Total × multiplier` (Litematica stops subtracting placed blocks).
- There is a separate **"Write to JSON"** export mode that writes three `raw_material_list_*` files (simplified, recipe steps, optional recipe details) for crafting breakdowns. Shift = missing only, Alt = crafting only.
- Example of the `.txt` layout seen in the wild:

```
+-------------------------------+-------+---------+-----------+
| Material List for placement 'Unnamed'                       |
+-------------------------------+-------+---------+-----------+
| Item                          | Total | Missing | Available |
+-------------------------------+-------+---------+-----------+
| Andesite                      |   575 |     575 |         0 |
| Acacia Door                   |     4 |       4 |         0 |
+-------------------------------+-------+---------+-----------+
| Item                          | Total | Missing | Available |
+-------------------------------+-------+---------+-----------+
```

> ⚠️ Not yet verified: the exact JSON schema (does it include registry IDs? If so, it's the best input), CSV quoting rules, and whether the file name includes a timestamp for `.txt`/`.csv`. **Check against the fixtures.**

### 2.2 Existing tools (competitive landscape)

| Tool                                                                                                                | Type                       | What it does                                                                                                                                                                         | Gap Litesheet fills                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Litematica Material HUD & Chest Finder**                                                                          | Fabric mod (26.x, 1.21.11) | In-game HUD, highlights chests holding materials, **exports to Excel and Google Sheets** with Collecting/Collected marks and a "who collected what" chart, plus CSV/JSON/PNG/Discord | Closest competitor. Requires a specific mod + MC version + Java 25, layout is fixed. Litesheet needs no mod, works with any Litematica version's export, and lets you customize the sheet.                                                          |
| **Litematica Material Viewer** (StroepWafel)                                                                        | Web app (React)            | Uploaded `.txt` or raw JSON, checked items off in the browser, saved to localStorage, had nested recipe-step views                                                                   | **Gone.** The site now says "service suspended by its owner". Even when it worked, progress lived in one browser, a new upload reset all checkmarks, and there was no spreadsheet export. Litesheet's tracker replaces it and fixes those problems. |
| **S2RM**                                                                                                            | Desktop app                | `.litematic` / material list → raw materials using recipes from the game jar; progress tracking                                                                                      | Raw-material math, not a spreadsheet.                                                                                                                                                                                                               |
| **Litematica RawMaterials**                                                                                         | Fabric addon (26.2)        | Expands the list into raw materials in-game, plain-text export                                                                                                                       | In-game only.                                                                                                                                                                                                                                       |
| **Better Litematica Materials List**, **Better Material Lists**, **Material Boxes**, **Better List for Litematica** | Fabric mods                | In-game checklists and storage-box tracking, some with team features                                                                                                                 | In-game, version-locked.                                                                                                                                                                                                                            |
| **litematica_command_gen**                                                                                          | Python CLI                 | CSV → `/give` commands for shulkers of items                                                                                                                                         | Creative-mode only.                                                                                                                                                                                                                                 |
| **litemapy**                                                                                                        | Python lib                 | Read/write `.litematic` files                                                                                                                                                        | Useful reference for a future direct `.litematic` import.                                                                                                                                                                                           |

**Takeaways:**

1. "Material list → Excel/Sheets" already exists **inside a mod**. The one web-based checklist (Material Viewer) has shut down, so there's currently **no web tool** for tracking a Litematica list. Our value: **no install, version-independent, check things off in the browser, customizable Excel export, and progress that survives a new export** (update instead of reset).
2. A website is a better fit than a mod for v1. Minecraft is on a fast version cadence (26.1 → 26.3 this year), and every Fabric mod in this space has to be republished each version. A website that reads Litematica's file doesn't care.
3. The display-name-only `.txt`/`.csv` is the main technical risk. Plan for it early (section 5).

---

## 3. Goals and non-goals

### Goals (v1)

- G1. Drop in a Litematica `.txt`, `.csv`, or `.json` material list → tracking in the browser **or** a downloaded `.xlsx` within 10 seconds.
- G2. **In-browser tracker:** check items off, add collected amounts fast (+1 stack, +1 shulker, type a number), search, filter, hide done, see overall progress. Saved automatically.
- G3. **Multiple builds** saved in the browser at once, each with its own progress.
- G4. Good default Excel sheet that works for tracking right away (formulas, progress, stack/shulker math).
- G5. Toggles to add, remove, and restyle columns, shared by the tracker view and the Excel export, with a **live preview**.
- G6. Correct stack-size math (64 / 16 / 1 stackers) for all vanilla items.
- G7. **Two-way sync with Excel:** export browser progress to `.xlsx`; import a filled-in `.xlsx` back into the browser.
- G8. **Update mode:** apply a newer Litematica export to a build you're already tracking (in the browser or in a sheet) without losing your Collected/Notes/Assigned values.
- G9. **Backup and move between devices:** export/import a build as a small `.litesheet.json` file.
- G10. Works fully offline after first load. No server.

### Non-goals (v1)

- Not a Minecraft mod (see section 12 for a possible later companion mod).
- No raw-material / crafting-recipe breakdown (S2RM and RawMaterials already do this; maybe P2 via Litematica's raw JSON export).
- No accounts, cloud sync, or multiplayer live editing. Google Sheets sharing and `.litesheet.json` files cover teams and multiple devices for now.
- No item icons/textures (Mojang assets, licensing). Text only.
- No direct `.litematic` parsing in v1 (see P2).

---

## 4. Users and core flows

**Primary user:** a survival builder working on a large Litematica project, alone or with a few friends, who already uses spreadsheets or would if setup were free.

### Flow A: Track in the browser (default path)

1. In game: open the material list, click **Write to file** (or Shift/Alt for CSV/JSON).
2. Open Litesheet → drag the file in (or click "Browse"; the page tells you the default folder `.minecraft/config/litematica/`).
3. Name the build (pre-filled from the schematic name) → it opens in the **tracker**.
4. While gathering: check items off, hit "+1 stack" / "+1 shulker" or type an amount, filter to what's left. Progress saves automatically.
5. Come back days later: the build is still in "My builds" on the home screen.

### Flow B: Export to Excel

1. From the tracker (or straight after dropping a file), click **Export → Excel**.
2. The export screen shows a live preview of the sheet with the default preset. Flip toggles (columns, units, grouping, theme).
3. Download `.xlsx` (or CSV / copy-as-TSV for pasting into Google Sheets). **Collected values from the browser are included.**
4. Keep tracking in Excel/Sheets if you want: type Collected numbers, watch Remaining and progress update.

### Flow C: Import a sheet back into the browser

1. Drop a Litesheet `.xlsx` (one you've been filling in) onto the home screen.
2. Litesheet reads the hidden `_litesheet` sheet + the user columns and opens it as a build in the tracker.
3. If that build already exists in the browser, ask: **replace** browser progress, **keep the higher Collected value per item**, or **import as a new build**.

### Flow D: Update with a newer export

1. The build changed, or you placed a lot of it and want fresh Missing counts.
2. Export a new material list from Litematica.
3. In the tracker click **Update from new export** and drop the file (or on the home screen choose **Update existing sheet** and drop the old `.xlsx` + the new export).
4. Litesheet matches rows by item ID (or name), keeps user-entered values, updates counts, and flags **new items** and **removed items** (removed ones move to a "Removed from build" section instead of being deleted).
5. Show a short diff summary ("+4 new items, 2 removed, 31 counts changed").

### Flow E: Team build

Use the **Team** preset: adds "Assigned to" (names you enter) and a per-person summary, in both the tracker and the Excel export. For live team tracking, export to Google Sheets and share. Or send teammates the `.litesheet.json`.

---

## 5. Input parsing

### 5.1 Format detection

Detect by content, not just extension:

- Starts with `+---` and has `|` delimited rows → ASCII `.txt`
- First data line parses as CSV with an `Item` header → `.csv`
- Parses as JSON → `.json` (detect which variant: plain `material_list_*`, or `raw_material_list_simplified` / `_recipe_steps` / `_recipe_details`). v1 supports the plain one only; the `raw_material_list_*` variants show "not supported yet" (raw-material view is P2, §10).

### 5.2 Normalized model

```ts
type MaterialList = {
  title: string // "Material List for placement 'X'" or similar
  schematicName?: string // parsed out of the title if possible
  multiplier: number // from "Total (xN)", default 1
  source: 'txt' | 'csv' | 'json'
  language: 'en' | 'unknown'
  entries: MaterialEntry[]
}

type MaterialEntry = {
  displayName: string // exactly as exported
  itemId?: string // "minecraft:oak_planks" when resolved
  stackSize: 1 | 16 | 64 // resolved or user-overridden
  total: number
  missing: number
  available: number
  resolved: 'id' | 'name' | 'override' | 'unknown'
}

// A tracked build: what the browser saves, and what the Excel export and .litesheet.json carry.
type Build = {
  id: string // uuid
  name: string // user-editable, defaults to schematicName
  createdAt: string
  updatedAt: string
  list: MaterialList // latest applied export
  progress: Record<RowKey, ItemProgress> // keyed by itemId, else displayName + stackSize (§13)
  removed: MaterialEntry[] // items dropped by a later export (kept with their progress)
  settings: ViewSettings // toggles from §8, shared by tracker + export
  team: string[]
  schemaVersion: number
}

type ItemProgress = {
  collected: number // the one number everything else is derived from
  manuallyDone?: boolean // "check off" without typing an exact count
  location?: string
  assignedTo?: string
  notes?: string
}
```

Rules:

- **`collected` is the source of truth.** Remaining, SB/st, progress, and Done all derive from it, in the browser (TypeScript, §6) and in Excel (formulas).
- Checking an item off sets `manuallyDone = true` and fills `collected` up to `needed` (the user can undo it). Unchecking restores the previous `collected`.
- Excel export writes `collected` into the Collected column. Excel import reads it back. Same model both ways.

### 5.3 ASCII `.txt` parser rules

- Skip border lines (`^\+[-+]+\+$`).
- First `|`-row that isn't the column header is the **title** row.
- The header row contains `Item` and `Total`. Read the multiplier from `Total (xN)`.
- Data rows: split on `|`, trim. Item is column 1. Numbers are columns 2–4 (strip spaces and thousands separators).
- **Ignore the repeated footer header.**
- Don't split on `|` naively if an item name could contain one. Treat the **last three** cells as numbers and join the rest back as the name.
- Handle CRLF and LF, and a UTF-8 BOM.

### 5.4 CSV parser

Use a real CSV parser (Papa Parse), not `split(',')`. Item names can contain commas (e.g. custom names). Same header and multiplier handling as `.txt`.

### 5.5 Name → item resolution (main risk)

- Build-time script `scripts/build-item-db.ts` generates `src/data/items.en.json` from **PrismarineJS minecraft-data** (`items.json` has `name`, `displayName`, `stackSize`) for the latest Java version it covers. If minecraft-data lags behind the current MC version (26.x), add a small `src/data/items.patch.json` for newer items.
- Lookup order: exact display name → case-insensitive → normalized (strip punctuation/extra spaces) → unresolved.
- **Unresolved items:** stackSize defaults to 64, row shows a ⚠ badge in the preview, and the user can set 64/16/1 from a dropdown. Overrides are saved in localStorage keyed by name.
- If the JSON export includes registry IDs, prefer them and skip name matching entirely.
- **Non-English exports:** v1 detects them (many unresolved names) and shows: "Looks like your game isn't in English. Stack sizes may be off. Switch the game to English before exporting, or fix them below." P2: ship more languages from Minecraft's lang files.

### 5.6 Validation and errors

- Empty file, wrong file, or zero entries → clear message with a screenshot-style hint ("Open the material list in Litematica and press Write to file").
- Negative or non-numeric counts → reject that row, show a count of skipped rows.
- Max file size 5 MB.

---

## 6. Unit math (must be exact)

Constants:

- Shulker box = 27 slots
- Single chest = 27 slots, double chest = 54 slots
- Items per shulker = `27 × stackSize` (1,728 for 64-stackers, 432 for 16, 27 for 1)
- A double chest full of full shulkers = `54 × 27 × stackSize` items

Breakdown of a count `n` with stack size `s`:

- `shulkers = floor(n / (27s))`
- `stacks = floor((n mod 27s) / s)`
- `items = n mod s`
- Display: `2 SB + 5 st + 12` (omit zero parts; `0` if n = 0)

Also compute **storage needed** for the whole remaining list:

- Total slots = Σ ceil(remaining_i / s_i)
- Shulkers needed = ceil(total slots / 27) (assumes mixed shulkers, which is how people actually pack)
- Double chests needed (loose) = ceil(total slots / 54)

The same math has to exist in **two places**: in TypeScript for the preview, and as **spreadsheet formulas** in the output so it updates when the user types. Write unit tests that check both agree on a table of cases (0, 1, 63, 64, 65, 1727, 1728, 1729, big numbers, and 16- and 1-stackers).

**Amount input parser** (tracker quick-add field): accepts `n` (items), `n st` / `nst` (stacks), `n sb` / `nsb` (shulkers), and sums joined with `+` (e.g. `1sb+5st+3`), case-insensitive, spaces optional. Convert using the row's stack size. Reject anything else with an inline error. Table-driven tests, same as above.

Spreadsheet formulas must avoid `LET`, `LAMBDA`, and dynamic arrays (compatibility). Use `INT`, `MOD`, `MAX`, `IF`, `SUMIF`, `SUMPRODUCT`, `TEXT`, `&`.

---

## 7. Output: the default spreadsheet

### 7.1 Sheet: `Materials` (main tracker)

| #   | Column                      | Default | Source / formula                                        | Notes                                                                  |
| --- | --------------------------- | ------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| A   | Done                        | on      | `=IF(F2=0,"✓","")`                                      | Auto. Conditional format turns the whole row green.                    |
| B   | Item                        | on      | export                                                  | Frozen column.                                                         |
| C   | Needed                      | on      | export `Total` (or `Missing`, see toggle)               | Bold.                                                                  |
| D   | Collected                   | on      | **user input**, starts at 0                             | Light yellow fill = "type here". Data validation: whole number ≥ 0.    |
| E   | Stack size                  | hidden  | resolved                                                | Used by formulas. Hidden, not deleted.                                 |
| F   | Remaining                   | on      | `=MAX(0,C2-D2)`                                         |                                                                        |
| G   | Remaining (SB / st / items) | on      | INT/MOD formula from §6, using E                        | E.g. `1 SB + 3 st + 4`                                                 |
| H   | Progress                    | on      | `=IF(C2=0,1,MIN(1,D2/C2))`                              | Percent format, data bar (Excel) with color-scale fallback             |
| I   | Status                      | off     | `=IF(F2=0,"Done",IF(D2>0,"In progress","Not started"))` |                                                                        |
| J   | Storage location            | off     | user input                                              | e.g. "Chest 4", "Shulker #2"                                           |
| K   | Assigned to                 | off     | user input, dropdown from `Team` list                   | Team preset turns this on                                              |
| L   | Notes                       | off     | user input                                              |                                                                        |
| M   | Litematica Missing          | off     | export                                                  | Snapshot at export time                                                |
| N   | Litematica Available        | off     | export                                                  | Snapshot at export time (inventory only)                               |
| O   | Checkbox                    | off     | empty box, no formula                                   | Printable checklist preset only: a box to tick with a pen. Excel-only. |

Behavior:

- Header row frozen, autofilter on, column widths sized to content.
- Sort default: **Needed, descending** (biggest gathering jobs first).
- A totals row at the bottom: Σ Needed, Σ Collected, Σ Remaining, overall progress.
- Data rows stored as an Excel **Table** (structured, banded) if it survives Google Sheets import. If not, plain range with banding via conditional format. (Test it.)

### 7.2 Sheet: `Summary`

- Build name, export date, source file name, multiplier
- Item types: total / done / remaining
- Items: needed / collected / remaining, overall % (big number)
- Storage needed for the remaining list: slots, shulkers, double chests (§6)
- Top 10 remaining items by count (`LARGE` + `INDEX/MATCH`, no dynamic arrays)
- Team preset: per-person table, `SUMIF` of Collected by Assigned to

### 7.3 Sheet: `_litesheet` (hidden, required)

- Schema version, app version, build id + name, export timestamp, all toggle settings as JSON, team list, and the row key (item ID or name) for every row.
- This is what makes **Excel import** (Flow C) and **Update mode** (Flow D) possible. Never drop it.
- Protect it (sheet protection, no password) so people don't edit it by accident.

---

## 8. Customization toggles

All toggles live in a side panel next to the live preview. **The same settings drive the browser tracker and the Excel export**, so what you see in the tracker is what you get in the file (Excel-only options like output format, theme, and print layout are marked as such). Settings save per build. Sharing them as a URL (`?cfg=<base64 JSON>`) is P1 (§10).

**Presets** (one click, then tweak):

- **Solo survival** (default): Done, Item, Needed, Collected, Remaining, SB/st, Progress
- **Team build**: + Assigned to, Status, per-person summary; asks for team names and which one is you ("This is me", saved per browser, not in the build; it drives the "Assigned to me" filter)
- **Printable checklist**: Checkbox (column O, in place of Done), Item, Needed, SB/st; portrait, fit to page width, no formulas, gridlines on
- **Minimal**: Item, Needed, Collected, Remaining

**Columns:** on/off for every column in §7.1, plus drag to reorder.

**Counts:**

- "Needed" is based on: Total / Missing (default Total; Missing is useful when part of the build is already placed)
- Units shown: items only / stacks + items / shulkers + stacks + items (default) / also double chests
- Hide items with 0 needed (default on)
- Hide items already fully available in the export (off)

**Organization:**

- Sort: needed ↓, name A–Z, remaining ↓, stack size
- Group: none (default) / by stack size / by simple category (P1, see §10)
- Split into multiple sheets by category (P1)

**Look:**

- Theme: Clean (default, neutral grays), Dark-ish header, Minecraft (stone-gray header, green progress), High contrast
- Font size: small / normal / large
- Zebra striping on/off
- Done rows: green fill / strikethrough / both / none
- Number format: `1,234` / `1234`

**Output format:**

- `.xlsx` (default, everything)
- `.csv` (data only, no formulas or styling; tell the user that)
- **Copy as TSV** (paste straight into an open Google Sheet; formulas included as text so they work after paste)
- `.ods` (P2, if ExcelJS → LibreOffice is good enough, skip)

---

## 9. Web app UI

Client-side routing with three screens: **Home**, **Tracker**, **Export**.

### 9.1 Home

- Big drop zone that takes a Litematica export (`.txt`/`.csv`/`.json`), a Litesheet `.xlsx`, or a `.litesheet.json`, detected automatically.
- "Where's my file?" helper (default path per OS: Windows `%APPDATA%\.minecraft\config\litematica`, macOS `~/Library/Application Support/minecraft/config/litematica`, Linux `~/.minecraft/config/litematica`; launchers like Prism/Modrinth use their own instance folder).
- "Try a sample" button with a bundled demo list.
- **My builds:** cards for every saved build: name, progress bar, items left, shulkers left, last edited. Actions: open, rename, duplicate, export `.litesheet.json`, delete (with confirm).
- Unresolved items (stack size unknown) show as a banner on the build until they're fixed.

### 9.2 Tracker (the in-browser view)

The main screen. It has to feel fast with 500+ rows and be usable with one hand on the mouse while the other is on the game.

**Top bar:** build name, overall progress bar and %, items remaining, storage needed for what's left (slots / shulkers / double chests), buttons: **Update from new export**, **Export**, **Settings**.

**List (one row per item):**

- Checkbox (check off / undo)
- Item name (with ⚠ badge if the stack size is a guess)
- Needed · Collected · Remaining, plus the SB/st breakdown (e.g. `1 SB + 3 st + 4`)
- Thin per-row progress bar
- Quick-add buttons: **+1 stack**, **+1 shulker**, and a small number field (accepts `64`, `3st`, `2sb`, `1sb+5`; parsing tested in §6). A minus button or right-click to subtract.
- Optional columns from §8 (Location, Assigned to, Notes) shown inline when enabled.
- Done rows go green and drop to the bottom (toggle), or hide entirely with **Hide done**.

**Controls:** search box (focus with `/`), filter chips (All / Remaining / In progress / Done / Unresolved / Assigned to me, shown only when the team list is not empty and "This is me" is set), sort (same options as §8), grouping (when categories exist).

**Keyboard:** `/` search, `↑/↓` move, `Space` toggle done, `S` +1 stack, `B` +1 shulker, `Ctrl+Z` undo (keep an undo stack of the last 50 changes, since a misclick on a big build is annoying).

**Saving:** auto-save to IndexedDB on every change (debounced ~300 ms), with a tiny "Saved" indicator. Ask for persistent storage (`navigator.storage.persist()`) so the browser doesn't clear it. Remind the user to export a backup if they haven't in 7 days and the build is over 25% done.

**Rendering:** virtualize the list (only render visible rows) so 1,000 rows stay smooth.

### 9.3 Export

- Left: toggle panel (§8). Right: live preview of the spreadsheet (first ~50 rows as an HTML table that mirrors the sheet styling, plus a mini Summary card).
- Primary: **Download .xlsx**. Secondary: CSV, Copy TSV, **Download .litesheet.json** (backup / send to a friend).
- Short tip: "Open in Google Sheets: File → Import → Upload".

### 9.4 Design

Every screen and state above gets designed on the design canvas (§11.2) and approved before it's built. Clean, minimal, fast. Light and dark mode. Desktop first. The tracker should also work on a phone or tablet held next to the PC (big tap targets for +stack/+shulker, collapsible columns). The Export screen only has to not break on mobile.

---

## 10. Priorities

**P0 (v1):**

- Parse `.txt`, `.csv`, plain `.json`
- Name → ID → stack size with manual override
- **In-browser tracker** (§9.2): check off, quick-add, search/filter/sort, hide done, auto-save, undo
- **My builds** with multiple saved builds (IndexedDB)
- Default `Materials` + `Summary` + hidden meta sheet with formulas
- Presets + column/units/sort/theme toggles + live preview, shared by tracker and export
- `.xlsx`, `.csv`, Copy TSV, `.litesheet.json` backup
- Excel import back into the browser (Flow C)
- Update mode for both browser builds and sheets (Flow D)
- Works offline (static build, no network calls after load)

**P1:**

- PWA install (it's a tool people will keep open while playing)
- Read-only share link for small builds (build compressed into the URL fragment, e.g. with lz-string; falls back to "send the .litesheet.json" when too long)
- Tracker keyboard shortcut cheat sheet + compact "HUD" layout for a narrow window next to the game
- Simple categories (building blocks / redstone / decoration / plants / other) from a small hand-made map + item tags, used for grouping and per-category sheets
- Merge multiple exports into one build (multi-schematic projects), with a per-schematic breakdown
- Shareable config URL

**P2:**

- Optional cloud sync / live team tracking (would need a backend and accounts, so only if people ask for it)
- Direct `.litematic` upload (parse NBT in the browser). **Warning:** block → item counting is non-trivial (doors/beds = 1 item per 2 blocks, double slabs = 2 slabs, wall torch → torch, redstone wire → redstone dust, water/lava → buckets, candles/sea pickles/snow layers by property, crops → seeds, waterlogging, etc.). Litematica already does this logic. Only do it if users really want to skip the game step. Use litemapy as a format reference.
- Raw-material view from Litematica's `raw_material_list_simplified` JSON
- Non-English item names
- Direct "Create in Google Sheets" via Google OAuth (Drive API upload with conversion). Adds a privacy policy and OAuth review, so only if there's demand.

---

## 11. Build plan: phases, milestones, and acceptance criteria

```
Phase A: Repo setup ──► Phase B: Design canvas ──► Finn approves ──► M0 ► M1 ► … ► M7
```

### 11.1 Phase A: Public repo setup

Goal: an empty but fully wired public repo. CI runs, the site deploys, and the project rules are written down, before any real code.

**A1. Pick and check the name** (ask Finn to confirm)

- `gh search repos litesheet --limit 20` and check Modrinth/GitHub for clashes.
- Don't put "Minecraft" in the name or logo (Mojang's brand guidelines). "Litesheet" is fine as long as it's clear we're not affiliated with Litematica.

**A2. Tooling check**

- `gh auth status` (Finn logs in if needed: `gh auth login`)
- Node: current LTS (26), pinned in `.nvmrc` and used by CI. pnpm installed with `npm i -g pnpm` (Corepack no longer ships with Node), pinned in `package.json` → `"packageManager"`.

**A3. Scaffold locally**

```bash
# in the existing litesheet/ folder (scaffold in a temp folder and copy in, since the folder is not empty)
pnpm create vite@latest <temp> --template svelte-ts
git init -b main
pnpm install
```

- TypeScript `strict: true`.
- Add dev tools: Vitest, Playwright (e2e + design screenshots), ESLint (flat config) + `eslint-plugin-svelte`, Prettier + `prettier-plugin-svelte`, `svelte-check`.
- `package.json` scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `format`, `check` (svelte-check + tsc), `design:shots` (a stub that fails until Phase B adds the real script).
- Placeholder page that just says "Litesheet, coming soon".

**A4. Repo files**

| File                                                                       | Contents                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                                | One-line pitch, status ("in development"), screenshot placeholder, how to run locally, **"Not affiliated with Mojang, Microsoft, or Litematica"** disclaimer                                                                                            |
| `LICENSE`                                                                  | MIT, copyright Izuulo (we read Litematica's output files, we don't copy its code). minecraft-data is MIT, so bundling the generated item table is fine; credit it in the README when it is added (M1).                                                  |
| `CLAUDE.md`                                                                | Rules for Claude Code: read `docs/PRD.md` first; work order (§11); commands (`pnpm test`, `pnpm check`, `pnpm lint`); test-first for parsers/math; never bundle Mojang textures; keep it client-side only; update the design canvas whenever UI changes |
| `docs/PRD.md`                                                              | This file                                                                                                                                                                                                                                               |
| `docs/FORMATS.md`                                                          | Stub, filled in at M0                                                                                                                                                                                                                                   |
| `CONTRIBUTING.md`                                                          | Short: setup, scripts, conventional commits, "attach your export file to bug reports"                                                                                                                                                                   |
| `SECURITY.md`                                                              | Short: how to report a problem privately (GitHub private vulnerability reporting)                                                                                                                                                                       |
| `.gitignore`, `.editorconfig`, `.nvmrc`, `.prettierrc`, `eslint.config.js` | Standard                                                                                                                                                                                                                                                |
| `.github/ISSUE_TEMPLATE/bug.yml`                                           | Asks for: browser, Litematica + MC version, game language, **the export file**                                                                                                                                                                          |
| `.github/ISSUE_TEMPLATE/feature.yml`                                       | Problem / proposed solution                                                                                                                                                                                                                             |
| `.github/pull_request_template.md`                                         | What changed, screenshots (required for UI changes), checklist: tests, `pnpm check`, design canvas updated                                                                                                                                              |
| `.github/dependabot.yml`                                                   | npm + github-actions, weekly, grouped minor/patch updates                                                                                                                                                                                               |

**A5. CI** (`.github/workflows/ci.yml`, on push to `main` and on every PR)

- checkout → pnpm setup → Node from `.nvmrc` → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm check` → `pnpm test` → `pnpm build`
- Add a Playwright job once there's UI (Phase B adds the design-canvas smoke test).
- Cache the pnpm store.

**A6. Deploy** (`.github/workflows/deploy.yml`, on push to `main`)

- Build with Vite `base: '/litesheet/'` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- Turn on Pages with GitHub Actions as the source (Settings → Pages, or `gh api -X POST repos/izuulo/litesheet/pages -f build_type=workflow`).
- Site URL: `https://izuulo.github.io/litesheet/` (custom domain later if wanted).

**A7. Create and push the public repo** (after Finn confirms the name)

Public identity: commits use `Izuulo` and the account's GitHub noreply email (set in the repo-local git config before the first commit), and the LICENSE copyright holder is Izuulo. No real name or personal email in the repo.

```bash
git add -A && git commit -m "chore: scaffold project"
gh repo create izuulo/litesheet --public --source=. --remote=origin --push \
  --description "Turn Litematica material lists into a browser tracker and Excel sheets"
gh repo edit --add-topic minecraft,litematica,spreadsheet,excel,svelte,typescript \
  --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false \
  --delete-branch-on-merge --homepage "https://izuulo.github.io/litesheet/"
```

**A8. Repo settings**

- Ruleset on `main`: require a pull request and passing CI checks, block force pushes and deletion. Allow Finn to bypass (solo project), but default to PRs.
- Turn on secret scanning, push protection, Dependabot alerts, and private vulnerability reporting (all free on public repos).
- Issues on. Discussions off for now. Wiki off (docs live in the repo).

**A9. Track the work on GitHub**

- Create GitHub milestones: `Phase B: Design`, `M0`…`M7`.
- Open one issue per milestone with its acceptance criteria from this section as a checklist.
- Labels: `parser`, `tracker`, `export`, `design`, `bug`, `good first issue`.
- Releases: tag `v0.1.0` at M7 with auto-generated release notes.

**✅ Phase A is done when:**

- The repo is public, with README, LICENSE, CLAUDE.md, and templates in place
- CI is green on `main`
- The placeholder page is live on GitHub Pages
- A test PR shows CI running and merge blocked until it passes
- Finn has been asked for the fixture files

### 11.2 Phase B: Design canvas (before building any screen)

Goal: every screen and every state from §9 laid out side by side on one zoomable canvas, reviewed and approved by Finn **before** any feature is implemented. That way layout and style decisions get made once, up front, rather than by trial and error in the real app.

**Where it lives**

- A design-only route at `/design` (a second Vite entry, `design.html`). It's also deployed to Pages at `/litesheet/design/` so Finn can review it from any device.
- Built from **real Svelte components** in `src/lib/ui/` with **mock data** from `src/design/mock.ts` (a hand-written fake build: ~60 items with a mix of 64/16/1 stackers, some done, some in progress, one over-collected, two unresolved). No parsers, no storage, no ExcelJS yet.
- The approved components become the real UI. The canvas stays in the repo as a living style guide and gets updated whenever the UI changes (PR checklist item).

**Canvas behavior**

- One big surface: drag to pan, Ctrl/⌘ + scroll to zoom, "Fit all" and "Zoom to frame" buttons.
- Each screen is a **frame** at a real device size with a label above it, like `Tracker · filtered · dark · 1440`.
- Frame sizes: desktop 1440×900, laptop 1280×800, narrow "next to the game" 480×900, phone 390×844.
- Global switches: light/dark for all frames, and show/hide frame labels.
- Frames don't share state, so each one shows exactly one state.

**What goes on the canvas (rows, top to bottom)**

| Row                 | Frames                                                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Tokens           | Color palette (light + dark), status colors (not started / in progress / done / over-collected / unresolved), type scale, spacing, radii, shadows                                                                                                                                                                                 |
| 1. Components       | Buttons (primary / secondary / ghost / danger, each with hover/focus/disabled), drop zone (idle / hover / drag-over / error), item row (each status, with and without optional columns), quick-add field (idle / typing / invalid), progress bar, filter chips, search, build card, toast, modal, settings controls, empty states |
| 2. Home             | First visit (empty), 3 saved builds, drag-over, unsupported-file error, "storage won't persist" warning, phone                                                                                                                                                                                                                    |
| 3. Tracker          | Default (1440), search + "Remaining" filter, hide done, everything done, unresolved-items banner, Team preset with Assigned column, narrow 480 layout, phone, dark                                                                                                                                                                |
| 4. Dialogs          | Update from new export (diff summary), Excel import conflict (replace / keep higher / new build), delete build confirm, settings drawer                                                                                                                                                                                           |
| 5. Export           | One frame per preset (Solo, Team, Printable, Minimal) with the toggle panel + live preview, plus the download/copied states                                                                                                                                                                                                       |
| 6. Spreadsheet look | HTML mock of the `Materials` and `Summary` sheets for each theme in §8, so the Excel styling gets designed and approved too                                                                                                                                                                                                       |

**Process**

1. Build rows 0 and 1 (tokens + components) first. Screenshot them and show Finn. Agree on the look before building full screens.
2. Build rows 2 to 6.
3. `pnpm design:shots`: a Playwright script that saves a PNG of every frame to `design/screenshots/` (committed, and shown in the PR).
4. Finn reviews the deployed `/design` page or the screenshots. Every decision and change request goes in `design/DECISIONS.md` (date, what, why).
5. Iterate until Finn approves the Phase B pull request.

**Quality bar for the designs**

- Text and status colors meet WCAG AA contrast in both themes (checked with axe in Playwright).
- Status is never shown by color alone (each status also gets an icon or label).
- Visible keyboard focus on everything interactive.
- Tap targets of at least 44 px on the phone frames.
- No Mojang textures or Minecraft logo. A subtle, original "blocky" accent is fine.

**✅ Phase B is done when:**

- Every screen and state listed in §9 and the table above has a frame on the canvas
- Screenshots are committed, and CI runs a Playwright smoke test that the `/design` page loads with no console errors
- `design/DECISIONS.md` is up to date
- **Finn has approved the Phase B PR.** Only then start M0.

### 11.3 Build milestones

**M0: Fixtures and formats**

- `fixtures/` filled with Finn's real exports; `docs/FORMATS.md` written from them
- ✅ Fixtures are committed and documented; a placeholder test loads each one

**M1: Parsers + model**

- `.txt`, `.csv`, `.json` → `MaterialList`
- Item DB build script + resolver + overrides
- ✅ Every fixture parses with the exact entry count and totals that match the in-game list
- ✅ Multiplier fixture reads `N` correctly
- ✅ 100% of items in English fixtures resolve (or the gaps are added to the patch file)

**M2: Unit math**

- TS functions + formula string generators from §6
- ✅ Table-driven tests pass for 64/16/1 stackers and edge values
- ✅ A generated test workbook, recalculated in LibreOffice headless (`soffice --headless --convert-to`), gives the same numbers as the TS functions

**M3: XLSX generation (default preset only)**

- ExcelJS: Materials, Summary, hidden `_litesheet`; styles, conditional formatting, data validation, frozen panes, autofilter, totals row
- ✅ Opens with no repair prompt in Excel, LibreOffice, and Google Sheets import
- ✅ Typing a Collected value updates Remaining, SB/st, Progress, Done, and Summary in all three
- ✅ A 500-item list generates in under 1 second

**M4: Builds storage + browser tracker**

- `Build` model (§5.2), IndexedDB persistence (use `idb-keyval` or Dexie), Home with My builds, Tracker screen (§9.2), built from the approved Phase B components and matching the canvas frames
- ✅ Real Home and Tracker screens match their approved canvas frames (side-by-side screenshots in the PR)
- ✅ Drop a fixture → build appears → check-offs, quick-adds, and typed amounts survive a page reload and a browser restart
- ✅ Two builds tracked at once don't affect each other
- ✅ Amount parser handles `64`, `3st`, `2sb`, `1sb+5`, and rejects junk (tests)
- ✅ Undo reverts the last 50 changes in order
- ✅ 1,000-row fixture scrolls smoothly and search filters in under 50 ms

**M5: Export screen + toggles + preview**

- Toggle panel, live preview, presets; export uses the build's current progress
- ✅ Every toggle in §8 visibly changes the tracker (where it applies), the preview, and the downloaded file
- ✅ Preview and file agree (snapshot test of the generated column layout per preset)
- ✅ Collected values from the tracker appear in the exported `.xlsx`

**M6: Round-trip + update mode**

- Excel import (Flow C), `.litesheet.json` export/import, Update from new export (Flow D) for builds and sheets
- ✅ Tracker → `.xlsx` → edit Collected in Excel/LibreOffice/Google Sheets → import → tracker shows the edited values
- ✅ Import conflict options (replace / keep higher / new build) behave as described
- ✅ Update mode keeps Collected/Location/Assigned/Notes; adds and highlights new items; moves removed items to "Removed from build" with their progress
- ✅ A sheet without `_litesheet` gives a clear error, not a crash
- ✅ `.litesheet.json` round-trips byte-for-byte equal data (except `updatedAt`)

**M7: Ship**

- CSV + Copy TSV outputs, sample file, "where's my file" helper, error states, final pass on dark mode and the phone layout (both are built with the components in Phase B and M4)
- Deploy pipeline from Phase A goes live with the real app
- README with real screenshots and a GIF; tag `v0.1.0` release
- ✅ Lighthouse performance ≥ 90; works offline after first load
- ✅ Every shipped screen still matches the design canvas (or the canvas was updated and Finn approved the change)

---

## 12. Possible later: companion mod

Only after the website has users. A tiny client-side Fabric mod that adds one button to Litematica's material list screen: **"Open in Litesheet"**. It would write the JSON export (with registry IDs) and open the website with the file loaded. That fixes the localization problem and saves the "find the file" step. It has to be republished for each MC version, so keep it as small as possible and let the website do all the real work.

Don't compete with Material HUD on in-game features.

---

## 13. Edge cases checklist

- Multiplier above 1 (Missing = Total × N)
- Items with 0 total (filtered materials) → hidden by default
- Renamed items / custom names in the export
- Same display name for different items (rare; key by ID when available, else name + stack size)
- Huge counts (millions) → no float issues, no scientific notation in cells
- Item names with commas, quotes, pipes, or non-ASCII characters
- CRLF line endings, BOM, trailing blank lines
- Non-English game language
- Old or new Litematica versions with slightly different headers (match headers by keyword, not by exact string)
- Google Sheets import: check conditional formatting, data bars, data validation, hidden sheet, and protection each survive or degrade gracefully
- Google Sheets re-download: a sheet that went `.xlsx` → Google Sheets → Download `.xlsx` must still import back into the browser (check the hidden `_litesheet` sheet survives the trip; if not, fall back to matching rows by Item name and say so)
- User typed text or a formula into the Collected column in Excel → import treats non-numbers as 0 and lists those rows
- Collected higher than Needed (over-gathered) → allowed, Remaining shows 0, row shows "+N extra"
- Browser storage cleared or private browsing → warn on Home that builds won't persist, push the `.litesheet.json` export
- Same build open in two tabs → last write wins, but show "Updated in another tab, reload?" (BroadcastChannel)

---

## 14. Open questions for Finn

1. Name: "Litesheet" is a placeholder. Check that it's free on GitHub/Modrinth before committing.
2. Default "Needed" basis: Total (whole build) or Missing (what's left to place)? Proposed: Total, since Collected tracks gathering, not placing.
3. Svelte or React? (Proposed: Svelte. You'll be the only maintainer, and it's lighter.) Decide before Phase A, since the scaffold and design canvas depend on it.
4. When you check an item off without typing a number, should it count as "collected all of it" (proposed), or just mark it done and leave Collected alone?
5. Should the free text "Storage location" turn into a structured storage planner later (assign each item to "Shulker #N" automatically, packed to minimize shulkers)? Could be a strong differentiator for exactly the "too big for my inventory" problem.

---

## 15. Sources

- Litematica source, material list export: https://raw.githubusercontent.com/sakura-ryoko/litematica/1.21.11/src/main/java/fi/dy/masa/litematica/gui/GuiMaterialList.java
- Example `.txt` export layout: https://www.scribd.com/document/817022222/message
- CSV export via Shift + Write to file, default folder: https://github.com/appcreatorguy/litematica_command_gen
- Litematica Material HUD & Chest Finder (Excel/Sheets export): https://modrinth.com/mod/JmqA4Alf
- Litematica Material Viewer (web, now suspended): https://stroep.onrender.com/projects/litematica-material-viewer
- S2RM: https://github.com/ncolyer11/S2RM
- Litematica RawMaterials: https://modrinth.com/project/OWsxlyPe
- Better Litematica Materials List: https://www.curseforge.com/minecraft/mc-mods/better-litematica-materials-list
- Material Boxes: https://www.curseforge.com/minecraft/mc-mods/material-boxes
- litemapy: https://github.com/SmylerMC/litemapy
- PrismarineJS minecraft-data: https://github.com/PrismarineJS/minecraft-data
- ExcelJS: https://www.npmjs.com/exceljs
