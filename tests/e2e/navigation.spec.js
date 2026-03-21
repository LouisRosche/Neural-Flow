// @ts-check
import { test, expect } from '@playwright/test';
import { login, startGame } from './helpers.js';

test.describe('Navigation E2E', () => {

  test('exit game button returns to menu via confirmation', async ({ page }) => {
    await login(page);
    await startGame(page, 'Working Memory');

    await page.locator('#exitGameBtn').click();
    await expect(page.locator('#confirmModal')).toHaveClass(/active/);

    await page.locator('#confirmOk').click();
    await expect(page.locator('#menuScreen')).toHaveClass(/active/);
  });

  test('exit game cancel stays in game', async ({ page }) => {
    await login(page);
    await startGame(page, 'Working Memory');

    await page.locator('#exitGameBtn').click();
    await expect(page.locator('#confirmModal')).toHaveClass(/active/);

    await page.locator('#confirmCancel').click();
    await expect(page.locator('#confirmModal')).not.toHaveClass(/active/);
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  });

  test('game cards show correct game names', async ({ page }) => {
    await login(page);

    for (const name of ['Working Memory', 'Sustained Attention', 'Cognitive Flexibility', 'Processing Speed']) {
      await expect(page.locator('.game-card', { hasText: name })).toBeVisible();
    }
  });

  test('progress bar is visible during gameplay', async ({ page }) => {
    await login(page);
    await startGame(page, 'Working Memory');

    await expect(page.locator('#progressBarContainer')).toBeVisible();
    await expect(page.locator('#progressBar')).toBeVisible();
  });

  test('game instructions panel shown before each round', async ({ page }) => {
    await login(page);
    await startGame(page, 'Cognitive Flexibility');

    await expect(page.locator('.game-instructions')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.game-instructions h4', { hasText: 'How to Play' })).toBeVisible();
  });

  test('difficulty indicator pips shown before each round', async ({ page }) => {
    await login(page);
    await startGame(page, 'Processing Speed');

    await expect(page.locator('text=Difficulty:')).toBeVisible({ timeout: 3000 });
  });
});
