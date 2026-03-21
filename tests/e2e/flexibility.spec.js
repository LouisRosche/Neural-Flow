// @ts-check
import { test, expect } from '@playwright/test';
import { login, startGame, clickStartRound } from './helpers.js';

test.describe('Flexibility Game E2E', () => {

  test('complete one round of flexibility by clicking response buttons', async ({ page }) => {
    await login(page);
    await startGame(page, 'Cognitive Flexibility');
    await clickStartRound(page, 1);

    // Click through all trials (7 at difficulty 1). Break when no more buttons appear.
    for (let i = 0; i < 10; i++) {
      try {
        await page.locator('.response-btn').first().waitFor({ state: 'visible', timeout: 1200 });
      } catch {
        break;
      }
      await page.locator('.response-btn').first().click();
      await page.waitForTimeout(700);
    }

    await expect(page.locator('.feedback, button.btn-success').first()).toBeVisible({ timeout: 5000 });
  });

  test('flexibility shows trial counter and rule question', async ({ page }) => {
    await login(page);
    await startGame(page, 'Cognitive Flexibility');
    await clickStartRound(page, 1);

    await expect(page.locator('h3', { hasText: /Trial 1 of/ })).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.stimulus')).toBeVisible();

    const buttons = page.locator('.response-btn');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);
  });

  test('flexibility disables buttons after response', async ({ page }) => {
    await login(page);
    await startGame(page, 'Cognitive Flexibility');
    await clickStartRound(page, 1);

    await expect(page.locator('.response-btn').first()).toBeVisible({ timeout: 3000 });
    await page.locator('.response-btn').first().click();

    const buttons = page.locator('.response-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
  });
});
