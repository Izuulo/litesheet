# Litesheet

Turn Litematica material lists into a browser tracker and Excel sheets.

**Status: in development.** Nothing usable yet. The plan is in [docs/PRD.md](docs/PRD.md).

_Screenshot coming once there is something to show._

## What it will do

Drop in the material list file Litematica already exports (`.txt`, `.csv` or `.json`) and either:

- **track it in the browser:** check items off, add collected counts in stacks or shulker boxes, see what is left; or
- **export it to Excel:** a tracking spreadsheet with formulas, progress and stack/shulker math.

Everything runs in your browser. No account, no server, no analytics.

## Run locally

Needs Node (version in `.nvmrc`) and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Other scripts: `pnpm test`, `pnpm test:e2e`, `pnpm check`, `pnpm lint`, `pnpm format`, `pnpm build`.

## Disclaimer

Not affiliated with Mojang, Microsoft, or Litematica. Litesheet only reads the files Litematica
writes; it contains no Litematica code and no Mojang assets.

## License

[MIT](LICENSE)
