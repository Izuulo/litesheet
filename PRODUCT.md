# Product

<!-- impeccable:product-schema 1 -->

The full specification is `docs/PRD.md`. This file is the short product record for design work.

## Platform

web

## Users

Survival-mode Minecraft builders working on a large Litematica schematic, alone or with a few
friends. They gather materials over days or weeks, store them in chests and shulker boxes at the
build site, and need to know what is still missing. Many already keep a hand-made spreadsheet for
this, or would if setup were free.

## Product Purpose

Litesheet takes the material list file Litematica already exports (`.txt`, `.csv`, `.json`) and
turns it into a tracker: check items off, add collected counts in stacks or shulker boxes, and see
what is left. The same data can be exported as an Excel sheet with live formulas and imported back.
Success: from dropping a file to tracking in under ten seconds, and progress that survives a new
export of the same build.

## Positioning

The only web tool for tracking a Litematica list: no mod to install, independent of the Minecraft
version, a customizable Excel export, and update-in-place when the schematic changes.

## Operating Context

- The tracker sits on a **second monitor** while the game runs on the first (confirmed
  2026-11-13). It is glanced at and clicked with one hand on the mouse, in sessions that last hours.
- Secondary: a narrow window beside the game, and a phone or tablet next to the PC.
- Counts are thought of in game units: items, stacks (64 / 16 / 1 per stack by item), shulker boxes
  (27 stacks), double chests (54 slots).
- Lists run from a handful of item types to 500 or more.

## Capabilities and Constraints

- Client-side only: no backend, no accounts, no analytics, works offline after first load.
- Three screens: Home (drop zone, saved builds), Tracker, Export (toggles and sheet preview).
- "Needed" defaults to Litematica's Total (confirmed 2026-11-13).
- Ticking an item fills Collected to Needed; unticking restores the previous count (confirmed
  2026-11-13).
- Each row has a block icon slot. Where the icons come from is undecided (Mojang textures are
  ruled out by the PRD); a letter tile stands in for now.
- Light and dark mode. Desktop first; the tracker must also work on a phone.
- Item statuses: not started, in progress, done, over-collected, unresolved (stack size unknown).

## Brand Commitments

- Name: Litesheet. Not affiliated with Mojang, Microsoft, or Litematica, and must not look as if it
  were.
- No Mojang textures and no Minecraft logo. A subtle, original blocky accent is allowed.
- Plain and functional: grey background, rows, standard controls. It does not need to be pretty;
  it needs to convey information (owner's direction, 2026-11-13).

## Evidence on Hand

- No real export files yet (`fixtures/` is empty); design work uses hand-written mock data.
- No users, testimonials, or usage numbers. Do not invent any.

## Product Principles

1. The file the player already has is the only input. No setup.
2. Collected is the one number; everything else is derived from it.
3. Speak in the player's units: stacks and shulker boxes, not only raw counts.
4. Progress is never lost: not to a new export, a new device, or a cleared browser.
5. Fast with one hand: every common action is one click or one key.

## Accessibility & Inclusion

WCAG AA contrast in both themes. Status is never shown by color alone. Visible keyboard focus.
Tap targets of at least 44 px on phone layouts.
