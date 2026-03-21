// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Helper: login with default student data.
 */
async function login(page) {
  await page.goto('/');
  await page.fill('#name', 'E2E Student');
  await page.fill('#age', '12');
  await page.selectOption('#grade', '6');
  await page.fill('#teacher', 'Dr. Smith');
  await page.selectOption('#period', '1');
  await page.click('#beginBtn');
  await expect(page.locator('#menuScreen')).toHaveClass(/active/);
}

test.describe('Attention Game E2E', () => {

  test('complete one round of attention game by clicking blue targets', async ({ page }) => {
    await login(page);

    // Start the Sustained Attention game
    await page.locator('.game-card', { hasText: 'Sustained Attention' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);

    // Click Start Round 1
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // Verify the target area and stats are visible
    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#hitsDisplay')).toBeVisible();
    await expect(page.locator('#accuracyDisplay')).toBeVisible();

    // Click blue targets as they appear (wait up to 20s for the round to finish)
    // At difficulty 1: 6 targets. We click any blue ones we see.
    const startTime = Date.now();
    const maxWaitMs = 25000;

    while (Date.now() - startTime < maxWaitMs) {
      const blueTargets = page.locator('.target.blue');
      const count = await blueTargets.count();

      if (count > 0) {
        await blueTargets.first().click();
        await page.waitForTimeout(100);
      } else {
        // Check if we've moved on (feedback toast or next round button)
        const feedback = page.locator('.feedback');
        const nextRound = page.locator('button.btn-success', { hasText: /Start Round/ });
        if (await feedback.count() > 0 || await nextRound.count() > 0) {
          break;
        }
        await page.waitForTimeout(200);
      }
    }

    // Verify a score was awarded — hits should be > 0
    const hitsText = await page.locator('#hitsDisplay').textContent();
    expect(parseInt(hitsText || '0')).toBeGreaterThan(0);
  });

  test('attention stats update live during gameplay', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Sustained Attention' }).click();
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();
    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });

    // Wait for a blue target and click it
    await expect(page.locator('.target.blue')).toBeVisible({ timeout: 10000 });
    await page.locator('.target.blue').first().click();

    // Hits counter should update
    await expect(page.locator('#hitsDisplay')).toHaveText('1', { timeout: 2000 });
  });
});
