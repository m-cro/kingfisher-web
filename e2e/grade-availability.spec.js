import { expect, test } from '@playwright/test';

const course = { id: 42, title: 'Computer Architecture', subject: { id: 1, code: 'CS' }, number: 433, description: 'Architecture.' };
const historical = {
  termId: 20, yearTerm: '2025-fa', cumulative: { a: 1, b: 3, total: 4, gpa: 3.25 },
  sections: [{ instructor: { id: 7, name: 'Nishil Talati' }, grades: { a: 1, b: 3, total: 4, gpa: 3.25 } }],
};
const failed = {
  termId: 10, yearTerm: '2024-fa', cumulative: { f: 4, total: 4, gpa: 0 },
  sections: [{ instructor: { id: 8, name: 'Another Instructor' }, grades: { f: 4, total: 4, gpa: 0 } }],
};

async function mockGrades(page, grades) {
  await page.route('**/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith('/courses/42/grades') ? grades : path.endsWith('/courses/42') ? course : [] });
  });
}

for (const emptyGpa of [0, null]) {
  test(`empty semester shows N/A and real failure grades remain zero (API GPA ${emptyGpa})`, async ({ page }) => {
    await mockGrades(page, {
      cumulative: { a: 1, b: 3, f: 4, total: 8, gpa: 1.625 },
      courseOfferings: [{ termId: 30, yearTerm: '2026-fa', cumulative: { total: 0, gpa: emptyGpa }, sections: [] }, historical, failed],
    });
    await page.goto('/courses/42');
    const summary = page.locator('.grade-summary');
    await expect(summary).toContainText('Average GPA: 1.63');
    await page.getByText('Filter semesters...', { exact: true }).click();
    await page.getByText('2026-fa (no grades yet)', { exact: true }).click();
    await expect(summary).toContainText('Total Grades: 0');
    await expect(summary).toContainText('Average GPA: N/A');
    await expect(summary).not.toContainText('0.00');
    await expect(page.getByText('No grade data available for this semester yet.', { exact: true })).toBeVisible();
    await expect(page.locator('.CourseChartViewer .echarts-for-react')).toHaveCount(0);
    await expect(page.locator('.GpaTrendChart .echarts-for-react')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Scheduled Sections' })).toBeVisible();

    await page.getByText('2026-fa (no grades yet)', { exact: true }).click();
    await page.getByText('2025-fa', { exact: true }).click();
    await expect(summary).toContainText('Average GPA: 3.25');
    await expect(summary).toContainText('Total Grades: 4');
    await expect(page.locator('.CourseChartViewer .echarts-for-react')).toHaveCount(1);
    await page.getByText('2025-fa', { exact: true }).click();
    await page.getByText('2024-fa', { exact: true }).click();
    await expect(summary).toContainText('Average GPA: 0.00');
    await expect(summary).toContainText('Total Grades: 4');
    await expect(page.locator('.CourseChartViewer .echarts-for-react')).toHaveCount(1);
    await page.getByText('2024-fa', { exact: true }).click();
    await page.getByText('Filter semesters...', { exact: true }).click();
    await expect(summary).toContainText('Average GPA: 1.63');
    await expect(summary).toContainText('Total Grades: 8');
  });
}

test('schedule-only course has no fabricated grade charts or instructor results', async ({ page }) => {
  await mockGrades(page, {
    cumulative: { total: 0, gpa: 0 },
    courseOfferings: [{ termId: 30, yearTerm: '2026-fa', cumulative: { total: 0, gpa: 0 }, sections: [] }],
  });
  await page.goto('/courses/42');
  await expect(page.locator('.grade-summary')).toContainText('Average GPA: N/A');
  await expect(page.getByText('No grade data available for this course yet.', { exact: true })).toBeVisible();
  await expect(page.getByText('No GPA data available for this course yet.', { exact: true })).toBeVisible();
  await expect(page.getByText('No instructor grade data available yet.', { exact: true })).toBeVisible();
  await expect(page.locator('.CourseChartViewer .echarts-for-react')).toHaveCount(0);
  await expect(page.locator('.GpaTrendChart .echarts-for-react')).toHaveCount(0);
});

test('withdrawals-only instructor has grades counted without a fabricated GPA', async ({ page }) => {
  const withdrawals = { w: 3, total: 3, gpa: 0 };
  await mockGrades(page, {
    cumulative: withdrawals,
    courseOfferings: [{ termId: 30, yearTerm: '2026-fa', cumulative: withdrawals,
      sections: [{ instructor: { id: 7, name: 'Nishil Talati' }, grades: withdrawals }] }],
  });
  await page.goto('/courses/42');
  await page.getByText('Filter instructors...', { exact: true }).click();
  await page.getByText('Nishil Talati', { exact: true }).first().click();
  await expect(page.locator('.grade-summary')).toContainText('Total Grades: 3');
  await expect(page.locator('.grade-summary')).toContainText('Average GPA: N/A');
  await expect(page.locator('.grade-summary')).toContainText('Instructor GPA: N/A');
  await expect(page.getByText('No letter grades available for this selection.', { exact: true })).toBeVisible();
});
