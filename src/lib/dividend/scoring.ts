/**
 * 배당 안전 등급 공용 모듈
 * dividend-data.ts, simulator.ts 모두에서 사용
 */

import type { DividendSafetyGrade } from "./dividend-types"

const GRADE_THRESHOLDS: readonly { readonly min: number; readonly grade: DividendSafetyGrade }[] = [
  { min: 85, grade: "A+" },
  { min: 75, grade: "A" },
  { min: 65, grade: "B+" },
  { min: 55, grade: "B" },
  { min: 40, grade: "C" },
  { min: 25, grade: "D" },
]

export function scoreToGrade(score: number): DividendSafetyGrade {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (score >= min) return grade
  }
  return "F"
}
