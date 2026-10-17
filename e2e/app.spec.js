import { expect, test } from '@playwright/test';

test('home page submits a course search', async ({ page }) => {
  await page.route('**/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/terms')) {
      await route.fulfill({ json: [] });
      return;
    }
    if (url.pathname.endsWith('/courses')) {
      await route.fulfill({ json: { results: [], totalCount: 0, availableCohorts: [] } });
      return;
    }
    await route.fulfill({ json: [] });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Kingfisher/ })).toBeVisible();
  await page.getByPlaceholder(/Search for a course/).fill('CS 225');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page).toHaveURL(/\/search\?q=CS%20225/);
  await expect(page.getByRole('heading', { name: 'Search Results' })).toBeVisible();
  await expect(page.getByText('No results found', { exact: true })).toBeVisible();
});

test('explore catalog shows subjects and switches tabs', async ({ page }) => {
  await page.route('**/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/explore/subjects')) {
      await route.fulfill({ json: {
        results: [{ subject: { code: 'CS' }, avgStudents: 120, totalStudents: 1200, gpa: 3.2 }],
        totalPages: 1,
        totalCount: 1,
      } });
      return;
    }
    await route.fulfill({ json: { results: [], totalPages: 1, totalCount: 0 } });
  });

  await page.goto('/explore');
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Computer Science/ })).toBeVisible();

  await page.getByRole('button', { name: 'Courses' }).click();
  await expect(page).toHaveURL(/tab=courses/);
  await expect(page.getByText('No results found.')).toBeVisible();
});

test('unknown routes show the not found page', async ({ page }) => {
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByText(/404|not found/i).first()).toBeVisible();
});
