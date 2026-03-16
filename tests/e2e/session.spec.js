// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Neural Flow E2E Session', () => {

  test('load page, fill login, start game, verify game area, complete memory sequence, verify score', async ({ page }) => {
    // 1. Load the page
    await page.goto('/');
    await expect(page).toHaveTitle(/Neural Flow/);

    // 2. Fill login form
    await page.fill('#name', 'Test Student');
    await page.fill('#age', '12');
    await page.selectOption('#grade', '6');
    await page.fill('#teacher', 'Dr. Smith');
    await page.selectOption('#period', '1');

    // 3. Click Begin Training
    await page.click('#beginBtn');

    // Verify we're on the menu screen
    await expect(page.locator('#menuScreen')).toHaveClass(/active/);

    // 4. Start the Working Memory game
    await page.locator('.game-card', { hasText: 'Working Memory' }).click();

    // 5. Verify game area appears
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
    await expect(page.locator('#gameArea')).toBeVisible();

    // 6. Click the "Start Round 1" ready button
    await page.locator('button.btn-success', { hasText: /Start Round 1/ }).click();

    // 7. Wait for the memory sequence to finish showing and input interface to appear
    // The sequence length at difficulty 1, task 0 = 3 + 1 + 0 = 4 digits
    // Each digit shown for 1000ms, so we wait up to ~6s for the number pad
    await expect(page.locator('.number-pad')).toBeVisible({ timeout: 10000 });

    // 8. Complete the memory sequence by entering digits
    // We need to read what sequence was shown. Since we can't observe the sequence
    // directly in E2E (it's in JS state), we enter 4 digits — the test validates
    // that the scoring flow works, not that we get them right.
    // Enter four digits (0-3) to complete the input
    for (let i = 0; i < 4; i++) {
      await page.locator(`.number-btn`, { hasText: new RegExp(`^${i}$`) }).first().click();
      // Small delay to let the UI update
      await page.waitForTimeout(200);
    }

    // 9. Verify score is shown — after entering all digits, a score display appears
    // The score display shows a percentage like "45%" or "100%"
    await expect(page.locator('.stimulus')).toBeVisible({ timeout: 5000 });
    const scoreText = await page.locator('.stimulus').textContent();
    expect(scoreText).toMatch(/\d+%/);
  });

  test('login validation rejects empty name', async ({ page }) => {
    await page.goto('/');

    // Try to start without filling the form
    await page.click('#beginBtn');

    // Should still be on login screen (not navigated to menu)
    await expect(page.locator('#loginScreen')).toHaveClass(/active/);
    await expect(page.locator('#menuScreen')).not.toHaveClass(/active/);
  });

  test('login validation rejects invalid age', async ({ page }) => {
    await page.goto('/');

    await page.fill('#name', 'Test Student');
    await page.fill('#age', '3'); // Too young (min is 6)
    await page.selectOption('#grade', '6');

    await page.click('#beginBtn');

    // Should still be on login screen
    await expect(page.locator('#loginScreen')).toHaveClass(/active/);
  });
});
