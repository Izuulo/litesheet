import type { TrackerItem } from '../lib/ui/Tracker.svelte'

// Hand-written fake build for the design page: 64/16/1 stackers, some done, one over-collected.
export const mockBuild: { name: string; items: TrackerItem[] } = {
  name: 'Harbor Lighthouse',
  items: [
    { name: 'Stone Bricks', stackSize: 64, needed: 13824, collected: 8640 },
    { name: 'Deepslate Tiles', stackSize: 64, needed: 9216, collected: 4000 },
    { name: 'Spruce Planks', stackSize: 64, needed: 6912, collected: 1728 },
    { name: 'Oak Log', stackSize: 64, needed: 5184, collected: 5184 },
    { name: 'Glass', stackSize: 64, needed: 3456, collected: 0 },
    { name: 'Sea Lantern', stackSize: 64, needed: 2304, collected: 2560 },
    { name: 'Andesite', stackSize: 64, needed: 2000, collected: 575 },
    { name: 'Lantern', stackSize: 64, needed: 1152, collected: 320 },
    { name: 'Redstone Dust', stackSize: 64, needed: 512, collected: 192 },
    { name: 'Oak Sign', stackSize: 16, needed: 100, collected: 0 },
    { name: 'Ender Pearl', stackSize: 16, needed: 96, collected: 48 },
    { name: 'Hopper', stackSize: 64, needed: 48, collected: 48 },
    { name: 'Spruce Door', stackSize: 64, needed: 14, collected: 6 },
    { name: 'Water Bucket', stackSize: 1, needed: 30, collected: 4 },
    { name: 'Bell', stackSize: 64, needed: 2, collected: 0 },
  ],
}
