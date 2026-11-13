<script lang="ts">
  import Tracker from '../lib/ui/Tracker.svelte'
  import { mockBuild } from './mock'

  let items = $state(mockBuild.items)
</script>

<Tracker name={mockBuild.name} bind:items />
