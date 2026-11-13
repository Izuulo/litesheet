<script lang="ts">
  import type { StackSize } from '../units'
  import ItemRow from './ItemRow.svelte'
  import './theme.css'

  export type TrackerItem = {
    name: string
    stackSize: StackSize
    needed: number
    collected: number
  }

  let {
    name,
    items = $bindable(),
    onimport,
    onexport,
  }: {
    name: string
    items: TrackerItem[]
    onimport?: () => void
    onexport?: () => void
  } = $props()

  const doneCount = $derived(items.filter((item) => item.collected >= item.needed).length)
</script>

<header>
  <h1>{name}</h1>
  <p>{doneCount} of {items.length} done</p>
  <button type="button" onclick={onimport}>Import</button>
  <button type="button" onclick={onexport}>Export</button>
</header>

<main>
  <div class="head" aria-hidden="true">
    <span></span>
    <span>Block</span>
    <span class="r">Items</span>
    <span class="r stacks">Stacks</span>
    <span class="r">Shulker boxes</span>
    <span>Collected</span>
    <span>Done</span>
  </div>
  <ul>
    {#each items as item (item.name)}
      <ItemRow
        name={item.name}
        stackSize={item.stackSize}
        needed={item.needed}
        bind:collected={item.collected}
      />
    {/each}
  </ul>
</main>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
  }
  h1 {
    margin: 0;
    font-size: 20px;
  }
  p {
    margin: 0 auto 0 0;
    color: var(--muted);
  }
  button {
    height: 36px;
    padding: 0 16px;
    border: 1px solid var(--text);
    background: var(--row);
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover {
    background: var(--field);
  }
  main {
    --cols: 28px minmax(120px, 1fr) 80px 105px 150px 195px 70px; /* px, not em: the header row has a smaller font */
  }
  .head {
    display: grid;
    grid-template-columns: var(--cols);
    gap: 12px;
    padding: 8px 16px;
    background: var(--head);
    border-bottom: 1px solid var(--line);
    font-size: 13px;
    font-weight: 600;
  }
  .r {
    text-align: right;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 700px) {
    .stacks,
    .head {
      display: none;
    }
    p {
      display: none;
    }
    h1 {
      margin-right: auto;
    }
  }
</style>
