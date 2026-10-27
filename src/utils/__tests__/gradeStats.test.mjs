import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregateGrades, instructorGrades } from '../gradeStats.js';

test('weights grade counts and excludes withdrawals from GPA', () => {
  const grades = aggregateGrades([{ a: 1, w: 3 }, { b: 3 }, null]);
  assert.equal(grades.total, 7);
  assert.equal(grades.gpa, 3.25);
});

test('reports zero GPA for failures and no GPA for withdrawals only', () => {
  assert.equal(aggregateGrades([{ f: 4 }]).gpa, 0);
  assert.equal(aggregateGrades([{ w: 4 }]).gpa, null);
});

test('filters instructor grades by instructor and semester', () => {
  const offerings = [
    { termId: 1, sections: [{ instructor: { id: 7 }, grades: { a: 1, w: 1 } }, { instructor: { id: 8 }, grades: { f: 100 } }] },
    { termId: 2, sections: [{ instructor: { id: 7 }, grades: { b: 3 } }] },
  ];
  assert.equal(instructorGrades(offerings, 7).gpa, 3.25);
  assert.equal(instructorGrades(offerings, 7, 1).gpa, 4);
  assert.equal(instructorGrades(offerings, 99), null);
  assert.equal(instructorGrades(offerings, 7, 99), null);
});
