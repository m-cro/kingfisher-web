import { expect, test } from '@playwright/test';

test('instructor navigation searches, paginates, opens profiles and returns to courses', async ({ page }) => {
  await page.route('**/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/instructors/7')) {
      await route.fulfill({ json: { id: 7, name: 'Nishil Talati', courses: [{ id: 42, title: 'Computer Architecture', subject: { code: 'CS' }, number: 433 }] } });
    } else if (url.pathname.endsWith('/instructors')) {
      const second = url.searchParams.get('page') === '2';
      await route.fulfill({ json: { results: [{ id: second ? 8 : 7, name: second ? 'Talati, N' : 'Nishil Talati' }], totalCount: 26, totalPages: 2 } });
    } else await route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Instructors', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Instructors' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search instructors' }).fill('Talati, N');
  await page.getByRole('button', { name: 'Find instructors' }).click();
  await expect(page).toHaveURL(/\/instructors\?q=Talati%2C%20N/);
  await expect(page.getByText('26 instructors matching “Talati, N”')).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole('link', { name: /Talati, N.*View courses/ })).toBeVisible();
  await page.goBack();
  await page.getByRole('link', { name: /Nishil Talati.*View courses/ }).click();
  await expect(page.getByRole('heading', { name: 'Nishil Talati' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Computer Architecture/ })).toHaveAttribute('href', '/courses/42');
  await page.getByRole('link', { name: 'Courses', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Search courses' })).toBeVisible();
});

test('instructor directory handles errors, retry and empty search', async ({ page }) => {
  let fail = true;
  await page.route('**/v1/instructors**', route => fail
    ? route.fulfill({ status: 503, json: {} })
    : route.fulfill({ json: { results: [], totalCount: 0, totalPages: 0 } }));
  await page.goto('/instructors?q=Unknown');
  await expect(page.getByRole('alert')).toContainText('We couldn’t load instructors');
  fail = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'No instructors found' })).toBeVisible();
  await page.getByRole('link', { name: 'Clear search' }).click();
  await expect(page).toHaveURL(/\/instructors$/);
});

test('instructor navigation and search fit on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/v1/instructors**', route => route.fulfill({ json: { results: [{ id: 7, name: 'Nishil Talati' }], totalCount: 1, totalPages: 1 } }));
  await page.goto('/instructors');
  await expect(page.getByRole('link', { name: 'Instructors', exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search instructors' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('instructor GPA uses selected grade counts and follows semester selection', async ({ page }) => {
  const course = { id: 42, title: 'Computer Architecture', subject: { id: 1, code: 'CS' }, number: 433, description: 'Architecture.' };
  const grades = {
    cumulative: { a: 1, b: 3, f: 4, w: 1, total: 9, gpa: 1.625 },
    courseOfferings: [
      { termId: 1, yearTerm: '2024-fa', cumulative: { a: 1, f: 4, w: 1, total: 6, gpa: 0.8 }, sections: [
        { instructor: { id: 7, name: 'Nishil Talati' }, grades: { a: 1, w: 1, total: 2, gpa: 4 } },
        { instructor: { id: 8, name: 'Someone Else' }, grades: { f: 4, total: 4, gpa: 0 } },
      ] },
      { termId: 2, yearTerm: '2025-sp', cumulative: { b: 3, total: 3, gpa: 3 }, sections: [
        { instructor: { id: 7, name: 'Nishil Talati' }, grades: { b: 3, total: 3, gpa: 3 } },
      ] },
    ],
  };
  await page.route('**/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({ json: path.endsWith('/courses/42/grades') ? grades : path.endsWith('/courses/42') ? course : [] });
  });
  await page.goto('/courses/42');
  const summary = page.locator('.grade-summary');
  await expect(summary).not.toContainText('Instructor GPA');
  await page.getByText('Filter instructors...', { exact: true }).click();
  await page.getByText('Nishil Talati', { exact: true }).first().click();
  await expect(summary).toContainText('Instructor GPA: 3.25');
  await expect(page.getByRole('row').filter({ hasText: 'Nishil Talati' })).toContainText('3.25');
  await expect(summary).toContainText('Average GPA: 1.63');
  await expect(summary).toContainText('Total Grades: 5');
  await page.getByText('Filter semesters...', { exact: true }).click();
  await page.getByText('2024-fa', { exact: true }).click();
  await expect(summary).toContainText('Instructor GPA: 4.00');
  await expect(summary).toContainText('Average GPA: 0.80');
  await expect(summary).toContainText('Total Grades: 2');
  await page.getByText('Nishil Talati', { exact: true }).first().click();
  await page.getByText('Filter instructors...', { exact: true }).click();
  await expect(summary).not.toContainText('Instructor GPA');
});
