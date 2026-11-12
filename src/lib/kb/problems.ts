// The causes filed inside ticket 4471, counted the way the desk's export counts them.
import { causeOf, uniqueById, type Report, type Tenant } from './causes.ts';

export type Problem = 'parser' | 'hint' | 'unplaced';

// A one-day move stays in the tenant's cause. The desk footnotes it; it is not its own cause.
export function problemOf(
  report: Pick<Report, 'id' | 'channel'>,
  tenant: Tenant | undefined,
  _oneDayIds: readonly string[],
): Problem {
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
  const order: Problem[] = ['parser', 'hint', 'unplaced'];
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
