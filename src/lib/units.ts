export type StackSize = 1 | 16 | 64

const SHULKER_SLOTS = 27

const join = (parts: [number, string][]) =>
  parts
    .filter(([n]) => n > 0)
    .map(([n, unit]) => `${n}${unit}`)
    .join(' + ') || '0'

/** `31 st + 16`: whole stacks plus loose items. */
export function formatStacks(n: number, stackSize: StackSize): string {
  return join([
    [Math.floor(n / stackSize), ' st'],
    [n % stackSize, ''],
  ])
}

/** `1 SB + 4 st + 16`: full shulker boxes, then stacks, then loose items (PRD §6). */
export function formatShulkers(n: number, stackSize: StackSize): string {
  const perShulker = SHULKER_SLOTS * stackSize
  return join([
    [Math.floor(n / perShulker), ' SB'],
    [Math.floor((n % perShulker) / stackSize), ' st'],
    [n % stackSize, ''],
  ])
}
