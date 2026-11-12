// The three problems filed inside ticket 4471. Pages explain them; this file counts them.
import { causeOf, uniqueById, type Report, type Tenant } from './causes.ts';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

// A one-day move is listed by id in desk-notes. It was filed under the tenant's cause.
// Split it out first, so a report is not counted twice.
export function problemOf(
  report: Pick<Report, 'id' | 'channel'>,
  tenant: Tenant | undefined,
  oneDayIds: readonly string[],
): Problem {
  if (oneDayIds.includes(report.id)) return 'one-day';
  return causeOf(report, tenant) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: number;
  channels: Record<string, number>;
};

export function groupProblems(
  reports: Report[],
  tenantOf: (report: Report) => Tenant | undefined,
  oneDayIds: readonly string[],
): ProblemGroup[] {
  const byProblem = new Map<Problem, Report[]>();
  for (const report of uniqueById(reports)) {
    const problem = problemOf(report, tenantOf(report), oneDayIds);
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), report]);
  }
  const order: Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];
  return order
    .filter((problem) => byProblem.has(problem))
    .map((problem) => {
      const group = byProblem.get(problem) ?? [];
      return {
        problem,
        reports: group,
        tenants: new Set(group.map((report) => report.tenant)).size,
        channels: group.reduce<Record<string, number>>(
          (counts, report) => ({ ...counts, [report.channel]: (counts[report.channel] ?? 0) + 1 }),
          {},
        ),
      };
    });
}

// Intake guessed a tag from the browser. The cause comes from the tenant. Count the misses.
export function intakeDisagrees(
  reports: Report[],
  tenantOf: (report: Report) => Tenant | undefined,
): number {
  return uniqueById(reports).filter((report) => {
    const cause = causeOf(report, tenantOf(report));
    return cause !== null && report.meta.intakeTag !== cause;
  }).length;
}
