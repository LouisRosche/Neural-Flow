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

test.describe('Flexibility Game E2E', () => {

  test('complete one round of flexibility by clicking response buttons', async ({ page }) => {
    await login(page);

    // Start the Cognitive Flexibility game
    await page.locator('.game-card', { hasText: 'Cognitive Flexibility' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);

    // Click Start Round 1
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // At difficulty 1: 7 trials (6 + 1). Each trial shows response buttons.
    // We click the first available button each time.
    const maxTrials = 10; // safety margin above 7
    for (let i = 0; i < maxTrials; i++) {
      // Wait for response buttons to appear
      const btn = page.locator('.response-btn').first();
      const visible = await btn.isVisible().catch(() => false);

      if (!visible) {
        // May have finished the round or transitioning
        await page.waitForTimeout(600);
        const stillVisible = await page.locator('.response-btn').first().isVisible().catch(() => false);
        if (!stillVisible) break;
      }

      await page.locator('.response-btn').first().click();

      // Wait for next trial (500ms delay + rendering)
      await page.waitForTimeout(700);
    }

    // After completing trials, either a feedback toast appears or the next round button
    // Wait for either feedback or next round button
    const feedbackOrNext = page.locator('.feedback, button.btn-success');
    await expect(feedbackOrNext.first()).toBeVisible({ timeout: 5000 });
  });

  test('flexibility shows trial counter and rule question', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Cognitive Flexibility' }).click();
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // Should show "Trial 1 of N" and a rule question
    await expect(page.locator('h3', { hasText: /Trial 1 of/ })).toBeVisible({ timeout: 3000 });

    // Should show a stimulus
    await expect(page.locator('.stimulus')).toBeVisible();

    // Should show response buttons
    const buttons = page.locator('.response-btn');
    expect(await buttons.count()).toBeGreaterThanOrEqual(2);
  });

  test('flexibility disables buttons after response', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Cognitive Flexibility' }).click();
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    await expect(page.locator('.response-btn').first()).toBeVisible({ timeout: 3000 });

    // Click a response button
    await page.locator('.response-btn').first().click();

    // All response buttons should now be disabled
    const buttons = page.locator('.response-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
  });
});
