<script lang="ts">
  import { formatShulkers, formatStacks, type StackSize } from '../units'

  let {
    name,
    stackSize,
    needed,
    collected = $bindable(0),
  }: { name: string; stackSize: StackSize; needed: number; collected?: number } = $props()

  const count = new Intl.NumberFormat('en-US')
  const done = $derived(collected >= needed)
  let beforeTick = 0 // what Collected was before the box was ticked, restored on untick

  function toggle() {
    if (done) {
      collected = beforeTick < needed ? beforeTick : 0
    } else {
      beforeTick = collected
      collected = needed
    }
  }

  function typed(event: Event & { currentTarget: HTMLInputElement }) {
    collected = Math.max(0, Math.floor(Number(event.currentTarget.value) || 0))
  }
</script>

<li class:done>
  <!-- shortcut: letter tile stands in for the block icon, replace when the icon source is decided -->
  <span class="icon" aria-hidden="true">{name[0]}</span>
  <span class="name">{name}</span>
  <span class="num items">{count.format(needed)}</span>
  <span class="num stacks">{formatStacks(needed, stackSize)}</span>
  <span class="num sb">{formatShulkers(needed, stackSize)}</span>
  <label class="progress">
    <input
      type="number"
      min="0"
      step="1"
      inputmode="numeric"
      value={collected}
      oninput={typed}
      aria-label="{name}: collected"
    />
    <span>/ {count.format(needed)}</span>
  </label>
  <label class="tick">
    <input type="checkbox" checked={done} onchange={toggle} />
    <span>Done</span>
  </label>
</li>

<style>
  li {
    display: grid;
    grid-template-columns: var(--cols);
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 12px;
    background: var(--row);
    border-bottom: 1px solid var(--line);
  }
  .icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line);
    background: var(--bg);
    color: var(--muted);
    font-size: 13px;
    font-weight: 600;
  }
  .name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .progress,
  .tick {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .progress input {
    width: 6.5em;
    height: 30px;
    padding: 0 6px;
    border: 1px solid var(--line);
    background: var(--field);
    color: var(--text);
    font: inherit;
    text-align: right;
  }
  .tick input {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--text);
  }
  .done .name {
    text-decoration: line-through;
  }
  .done .name,
  .done .num,
  .done .progress span {
    color: var(--muted);
  }
  @media (max-width: 700px) {
    /* phone: name and tick on the first line, amounts and the collected field on the second */
    li {
      grid-template-columns: 28px auto 1fr auto;
      grid-template-areas:
        'icon name name tick'
        'icon items sb progress';
      gap: 0 12px;
      padding: 4px 12px 8px;
      font-size: 13px;
    }
    .icon {
      grid-area: icon;
    }
    .name {
      grid-area: name;
      font-size: 15px;
    }
    .items {
      grid-area: items;
    }
    .sb {
      grid-area: sb;
      text-align: left;
    }
    .stacks {
      display: none;
    }
    .progress {
      grid-area: progress;
    }
    .progress input {
      width: 4.5em;
    }
    .tick {
      grid-area: tick;
      justify-content: flex-end;
      min-width: 44px;
      min-height: 44px;
    }
    .tick span {
      display: none;
    }
    .tick input {
      width: 24px;
      height: 24px;
    }
  }
</style>
