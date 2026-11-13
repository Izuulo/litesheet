import { expect, test } from 'vitest'
import { formatShulkers, formatStacks, type StackSize } from './units'

// [count, stack size, stacks text, shulker text]
const cases: [number, StackSize, string, string][] = [
  [0, 64, '0', '0'],
  [1, 64, '1', '1'],
  [63, 64, '63', '63'],
  [64, 64, '1 st', '1 st'],
  [65, 64, '1 st + 1', '1 st + 1'],
  [1727, 64, '26 st + 63', '26 st + 63'],
  [1728, 64, '27 st', '1 SB'],
  [1729, 64, '27 st + 1', '1 SB + 1'],
  [2000, 64, '31 st + 16', '1 SB + 4 st + 16'],
  [3_000_000, 64, '46875 st', '1736 SB + 3 st'],
  [16, 16, '1 st', '1 st'],
  [100, 16, '6 st + 4', '6 st + 4'],
  [432, 16, '27 st', '1 SB'],
  [449, 16, '28 st + 1', '1 SB + 1 st + 1'],
  [14, 1, '14 st', '14 st'],
  [27, 1, '27 st', '1 SB'],
  [30, 1, '30 st', '1 SB + 3 st'],
]

test.each(cases)('%i items of stack size %i', (n, s, stacks, shulkers) => {
  expect(formatStacks(n, s)).toBe(stacks)
  expect(formatShulkers(n, s)).toBe(shulkers)
})
