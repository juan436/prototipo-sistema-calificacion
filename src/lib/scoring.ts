import type { FormVersion, Question } from '../mock/types';

/** Example scale: grades go from 0 to 10. The real scale is defined by the client. */
export const MAX_GRADE = 10;

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Normalized score (0..1) of one scored question.
 * Points may be negative (an answer can subtract points); the lowest option is 0 and the highest is 1.
 */
export function questionScore(question: Question, answer: number | string | undefined): number | null {
  if (question.type !== 'scored' || !question.options?.length) return null;
  if (typeof answer !== 'number' || !question.options[answer]) return null;
  const points = question.options.map((o) => o.points);
  const min = Math.min(...points);
  const max = Math.max(...points);
  if (max === min) return 1;
  return (question.options[answer].points - min) / (max - min);
}

export interface AreaScore {
  area: string;
  grade: number;
}

export interface ScoreResult {
  /** Final grade 0..10, or null when no scored question was answered. */
  grade: number | null;
  areas: AreaScore[];
  /** Sum of the raw points of the chosen options. */
  rawPoints: number;
}

export function computeScore(
  version: FormVersion,
  answers: Record<string, number | string | undefined>,
): ScoreResult {
  let weighted = 0;
  let totalWeight = 0;
  let rawPoints = 0;
  const areaAcc = new Map<string, { weighted: number; weight: number }>();

  for (const q of version.questions) {
    const score = questionScore(q, answers[q.id]);
    if (score === null) continue;
    const weight = q.weight ?? 1;
    weighted += score * weight;
    totalWeight += weight;
    rawPoints += q.options![answers[q.id] as number].points;
    const area = q.area || 'General';
    const acc = areaAcc.get(area) ?? { weighted: 0, weight: 0 };
    acc.weighted += score * weight;
    acc.weight += weight;
    areaAcc.set(area, acc);
  }

  return {
    grade: totalWeight > 0 ? round1((weighted / totalWeight) * MAX_GRADE) : null,
    areas: [...areaAcc.entries()].map(([area, acc]) => ({
      area,
      grade: round1((acc.weighted / acc.weight) * MAX_GRADE),
    })),
    rawPoints,
  };
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return round1(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Average of several score results grouped by area. */
export function averageAreas(results: ScoreResult[]): AreaScore[] {
  const acc = new Map<string, number[]>();
  for (const r of results) {
    for (const a of r.areas) {
      acc.set(a.area, [...(acc.get(a.area) ?? []), a.grade]);
    }
  }
  return [...acc.entries()].map(([area, grades]) => ({ area, grade: average(grades)! }));
}
