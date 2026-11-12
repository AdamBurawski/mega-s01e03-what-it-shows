<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupProblems, intakeDisagrees, type ProblemGroup, type Report } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const merged = $derived(reports.filter((report) => report.mergedInto === ticket) as Report[]);
  const groups = $derived(groupProblems(merged, tenantOf, notes.oneDayMove));
  const missed = $derived(intakeDisagrees(merged, tenantOf));
  const total = $derived(groups.reduce((sum, group) => sum + group.reports.length, 0));
  const channels = (group: ProblemGroup) =>
    Object.entries(group.channels)
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => `${channel} ×${count}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{total}</strong> distinct reports in #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th></tr>
  </thead>
  <tbody>
    {#each groups as group (group.problem)}
      <tr>
        <td><code>{group.problem}</code></td>
        <td>{group.reports.length}</td>
        <td class="channels">{channels(group)}</td>
        <td>{group.tenants}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Intake's tag differs from the tenant's cause on {missed} reports. Those reports stay in the cause
  the tenant and the form give them.
</p>

<style>
  .sum { font-size: 1.1rem; }
  .channels { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>
