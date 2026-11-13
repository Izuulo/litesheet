# Design decisions

Date, what, why. Newest first.

## 2026-11-13

- **The list is a full-width table.** It spans the whole screen edge to edge, with a header band, and
  no centered column or outer margins.
- **Plain and simple look.** Grey background, Import and Export buttons at the top, one row per
  block. It does not need to be pretty; it needs to convey information. The owner turned down four
  more designed directions in favor of this.
- **Row contents:** block icon, block name, the needed amount three ways (raw items, stacks, shulker
  boxes), a Collected field shown as `___ / needed`, and a Done checkbox.
- **Design preview replaces the big canvas.** PRD §11.2 describes a pan-and-zoom canvas with dozens
  of frames. With a look this plain, one preview page (`design.html`, mock data) and three
  screenshots (`pnpm design:shots`) are enough. More states get added there as they are built.
- **"Needed" uses Litematica's Total** by default (PRD §14 question 2).
- **Ticking Done fills Collected to Needed; unticking restores the previous number** (PRD §14
  question 4).
- **The tracker is used on a second monitor** while the game runs on the first.
- **Open: block icons.** The owner wants an icon of each block. The PRD rules out Mojang textures
  (they are Mojang's copyrighted art). Until this is decided, rows show a letter tile in the icon
  slot.
