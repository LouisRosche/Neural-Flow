// @ts-check
import { test, expect } from '@playwright/test';

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

test.describe('Speed Game E2E', () => {

  test('complete one round of speed game by matching formulas', async ({ page }) => {
    await login(page);

    // Start the Processing Speed game
    await page.locator('.game-card', { hasText: 'Processing Speed' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);

    // Click Start Round 1
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // At difficulty 1: 6 trials (5 + 1). Each shows a stimulus formula and buttons.
    // Strategy: click the correct button (data-correct="true") for maximum score.
    const maxTrials = 8;
    for (let i = 0; i < maxTrials; i++) {
      // Wait for the correct button to appear
      const correctBtn = page.locator('.response-btn[data-correct="true"]');
      const visible = await correctBtn.isVisible().catch(() => false);

      if (!visible) {
        await page.waitForTimeout(500);
        const stillVisible = await correctBtn.isVisible().catch(() => false);
        if (!stillVisible) break;
      }

      // Read the stimulus to verify it's displayed
      const stimulus = page.locator('.stimulus');
      if (await stimulus.isVisible()) {
        const text = await stimulus.textContent();
        expect(text).toBeTruthy();
      }

      await page.locator('.response-btn[data-correct="true"]').click();

      // Wait for next trial (300ms delay + rendering)
      await page.waitForTimeout(500);
    }

    // Verify round completed — feedback or next round button
    const feedbackOrNext = page.locator('.feedback, button.btn-success');
    await expect(feedbackOrNext.first()).toBeVisible({ timeout: 5000 });
  });

  test('speed game shows formula stimulus and multiple options', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Processing Speed' }).click();
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // Should show "Match the formula quickly!" title
    await expect(page.locator('h3', { hasText: /Match the formula/ })).toBeVisible({ timeout: 3000 });

    // Should show a stimulus formula
    await expect(page.locator('.stimulus')).toBeVisible();

    // Should show multiple response buttons (4+ at difficulty 1)
    const buttons = page.locator('.response-btn');
    expect(await buttons.count()).toBeGreaterThanOrEqual(4);

    // One button should be the correct match
    const correctBtn = page.locator('.response-btn[data-correct="true"]');
    expect(await correctBtn.count()).toBe(1);
  });
});
