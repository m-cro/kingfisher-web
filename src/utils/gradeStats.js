export const GRADE_POINTS = {
  aPlus: 4, a: 4, aMinus: 3.67, bPlus: 3.33, b: 3, bMinus: 2.67,
  cPlus: 2.33, c: 2, cMinus: 1.67, dPlus: 1.33, d: 1, dMinus: 0.67, f: 0,
};

// Combine grade counts, not section GPAs; withdrawals count toward total, not GPA.
export function aggregateGrades(distributions) {
  const grades = { total: 0, w: 0 };
  Object.keys(GRADE_POINTS).forEach(key => { grades[key] = 0; });
  for (const distribution of distributions.filter(Boolean)) {
    Object.keys(GRADE_POINTS).forEach(key => { grades[key] += distribution[key] || 0; });
    grades.w += distribution.w || 0;
  }
  const graded = Object.keys(GRADE_POINTS).reduce((sum, key) => sum + grades[key], 0);
  const points = Object.entries(GRADE_POINTS).reduce((sum, [key, weight]) => sum + grades[key] * weight, 0);
  grades.total = graded + grades.w;
  grades.gpa = graded ? points / graded : null;
  return grades;
}

export function instructorGrades(offerings, instructorId, termId = 0) {
  const distributions = offerings
    .filter(offering => termId === 0 || offering.termId === termId)
    .flatMap(offering => offering.sections || [])
    .filter(section => section.instructor?.id === instructorId && section.grades)
    .map(section => section.grades);
  return distributions.length ? aggregateGrades(distributions) : null;
}
