// @ts-check
import { test, expect } from '@playwright/test';
import { login, startGame, clickStartRound } from './helpers.js';

test.describe('Attention Game E2E', () => {

  test('complete one round of attention game by clicking blue targets', async ({ page }) => {
    await login(page);
    await startGame(page, 'Sustained Attention');
    await clickStartRound(page, 1);

    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#hitsDisplay')).toBeVisible();
    await expect(page.locator('#accuracyDisplay')).toBeVisible();

    // Click blue targets as they spawn; poll until round ends or timeout
    const startTime = Date.now();
    while (Date.now() - startTime < 25000) {
      const blueTargets = page.locator('.target.blue');
      if (await blueTargets.count() > 0) {
        await blueTargets.first().click();
        await page.waitForTimeout(100);
      } else {
        if (await page.locator('.feedback, button.btn-success').first().count() > 0) break;
        await page.waitForTimeout(200);
      }
    }

    const hitsText = await page.locator('#hitsDisplay').textContent();
    expect(parseInt(hitsText || '0')).toBeGreaterThan(0);
  });

  test('attention stats update live during gameplay', async ({ page }) => {
    await login(page);
    await startGame(page, 'Sustained Attention');
    await clickStartRound(page, 1);
    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.target.blue')).toBeVisible({ timeout: 10000 });
    await page.locator('.target.blue').first().click();

    await expect(page.locator('#hitsDisplay')).toHaveText('1', { timeout: 2000 });
  });
});
