// @ts-check
import { test, expect } from '@playwright/test';
import { login, startGame, clickStartRound } from './helpers.js';

test.describe('Speed Game E2E', () => {

  test('complete one round of speed game by matching formulas', async ({ page }) => {
    await login(page);
    await startGame(page, 'Processing Speed');
    await clickStartRound(page, 1);

    // Click the correct button each trial. Break when no more appear.
    for (let i = 0; i < 8; i++) {
      try {
        await page.locator('.response-btn[data-correct="true"]').waitFor({ state: 'visible', timeout: 1000 });
      } catch {
        break;
      }
      await page.locator('.response-btn[data-correct="true"]').click();
      await page.waitForTimeout(500);
    }

    await expect(page.locator('.feedback, button.btn-success').first()).toBeVisible({ timeout: 5000 });
  });

  test('speed game shows formula stimulus and multiple options', async ({ page }) => {
    await login(page);
    await startGame(page, 'Processing Speed');
    await clickStartRound(page, 1);

    await expect(page.locator('h3', { hasText: /Match the formula/ })).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.stimulus')).toBeVisible();

    const buttons = page.locator('.response-btn');
    expect(await buttons.count()).toBeGreaterThanOrEqual(4);

    const correctBtn = page.locator('.response-btn[data-correct="true"]');
    expect(await correctBtn.count()).toBe(1);
  });
});
