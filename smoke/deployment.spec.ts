import { expect, test } from '@playwright/test';

test.describe('Vercel deployment smoke checks', () => {
  test('loads the dashboard and supports the core navigation flow', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Energy Breakdown/i);
    await expect(page.getByRole('heading', { name: 'Energy Breakdown' })).toBeVisible();
    await expect(page.getByText('Customer energy portal')).toBeVisible();

    const summary = page.getByLabel('Energy period summary');
    await expect(summary).toBeVisible();
    await expect(summary.getByText('Total usage')).toBeVisible();
    await expect(summary.getByText('Daily average')).toBeVisible();

    await expect(page.getByLabel('Weekly energy usage')).toBeVisible();
    await expect(page.getByLabel('Bottom calendar controls')).toBeVisible();

    await page.getByRole('button', { name: 'Next period' }).click();
    await expect(page.getByText('Mar 29 - Apr 4')).toBeVisible();

    await page.getByRole('button', { name: 'Month' }).click();
    await expect(page.getByLabel('Monthly energy usage')).toBeVisible();
    await expect(page.getByText('Mar 2026')).toBeVisible();
  });
});
