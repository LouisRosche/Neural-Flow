// @ts-check
import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/');
  await page.fill('#name', 'Nav Student');
  await page.fill('#age', '10');
  await page.selectOption('#grade', '4');
  await page.fill('#teacher', 'Mr. Brown');
  await page.selectOption('#period', '2');
  await page.click('#beginBtn');
  await expect(page.locator('#menuScreen')).toHaveClass(/active/);
}

test.describe('Navigation & Settings E2E', () => {

  test('settings modal opens and closes', async ({ page }) => {
    await login(page);

    // Open settings
    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsModal')).toHaveClass(/active/);

    // Modal has a URL input
    await expect(page.locator('#sheetsUrl')).toBeVisible();

    // Close via Close button
    await page.locator('#closeSettingsBtn').click();
    await expect(page.locator('#settingsModal')).not.toHaveClass(/active/);
  });

  test('settings modal closes on backdrop click', async ({ page }) => {
    await login(page);

    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsModal')).toHaveClass(/active/);

    // Click the backdrop (modal-overlay itself, not the modal content)
    await page.locator('#settingsModal').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#settingsModal')).not.toHaveClass(/active/);
  });

  test('settings modal closes on Escape', async ({ page }) => {
    await login(page);

    await page.locator('#settingsBtn').click();
    await expect(page.locator('#settingsModal')).toHaveClass(/active/);

    await page.keyboard.press('Escape');
    await expect(page.locator('#settingsModal')).not.toHaveClass(/active/);
  });

  test('exit game button returns to menu via confirmation', async ({ page }) => {
    await login(page);

    // Start a game
    await page.locator('.game-card', { hasText: 'Working Memory' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);

    // Click exit
    await page.locator('#exitGameBtn').click();

    // Confirmation modal should appear
    await expect(page.locator('#confirmModal')).toHaveClass(/active/);

    // Click OK to confirm exit
    await page.locator('#confirmOk').click();

    // Should be back on menu
    await expect(page.locator('#menuScreen')).toHaveClass(/active/);
  });

  test('exit game cancel stays in game', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Working Memory' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);

    await page.locator('#exitGameBtn').click();
    await expect(page.locator('#confirmModal')).toHaveClass(/active/);

    // Cancel — should stay in game
    await page.locator('#confirmCancel').click();
    await expect(page.locator('#confirmModal')).not.toHaveClass(/active/);
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  });

  test('game cards show correct game names and descriptions', async ({ page }) => {
    await login(page);

    const games = ['Working Memory', 'Sustained Attention', 'Cognitive Flexibility', 'Processing Speed'];
    for (const name of games) {
      await expect(page.locator('.game-card', { hasText: name })).toBeVisible();
    }
  });

  test('progress bar is visible during gameplay', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Working Memory' }).click();
    await expect(page.locator('#progressBarContainer')).toBeVisible();
    await expect(page.locator('#progressBar')).toBeVisible();
  });

  test('game instructions panel shown before each round', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Cognitive Flexibility' }).click();

    // Instructions should be visible with "How to Play" heading
    await expect(page.locator('.game-instructions')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.game-instructions h4', { hasText: 'How to Play' })).toBeVisible();
  });

  test('difficulty indicator pips shown before each round', async ({ page }) => {
    await login(page);

    await page.locator('.game-card', { hasText: 'Processing Speed' }).click();

    // Difficulty label should be visible
    await expect(page.locator('text=Difficulty:')).toBeVisible({ timeout: 3000 });
  });
});
