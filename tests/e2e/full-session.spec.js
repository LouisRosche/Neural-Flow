// @ts-check
import { test, expect } from '@playwright/test';
import { login, startGame, clickStartRound } from './helpers.js';

/**
 * Complete all 3 rounds of the memory game.
 * Enters arbitrary digits — we only need the scoring flow to complete, not correct answers.
 */
async function playMemoryGame(page) {
  for (let round = 1; round <= 3; round++) {
    await clickStartRound(page, round);
    await expect(page.locator('.number-pad')).toBeVisible({ timeout: 15000 });

    const slotCount = await page.locator('.input-slot').count();
    for (let i = 0; i < slotCount; i++) {
      await page.locator('.number-btn', { hasText: new RegExp(`^${i % 10}$`) }).first().click();
      await page.waitForTimeout(150);
    }

    if (round < 3) {
      await expect(page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round + 1}`) }))
        .toBeVisible({ timeout: 8000 });
    }
  }
}

/**
 * Complete all 3 rounds of the flexibility game.
 */
async function playFlexibilityGame(page) {
  for (let round = 1; round <= 3; round++) {
    await clickStartRound(page, round);

    for (let t = 0; t < 12; t++) {
      try {
        await page.locator('.response-btn').first().waitFor({ state: 'visible', timeout: 1200 });
      } catch {
        break;
      }
      await page.locator('.response-btn').first().click();
      await page.waitForTimeout(700);
    }

    if (round < 3) {
      await expect(page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round + 1}`) }))
        .toBeVisible({ timeout: 8000 });
    }
  }
}

/**
 * Complete all 3 rounds of the speed game (clicks correct answer each trial).
 */
async function playSpeedGame(page) {
  for (let round = 1; round <= 3; round++) {
    await clickStartRound(page, round);

    for (let t = 0; t < 10; t++) {
      try {
        await page.locator('.response-btn[data-correct="true"]').waitFor({ state: 'visible', timeout: 1000 });
      } catch {
        break;
      }
      await page.locator('.response-btn[data-correct="true"]').click();
      await page.waitForTimeout(500);
    }

    if (round < 3) {
      await expect(page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round + 1}`) }))
        .toBeVisible({ timeout: 8000 });
    }
  }
}

/**
 * Complete all 3 rounds of the attention game (clicks blue targets as they appear).
 */
async function playAttentionGame(page) {
  for (let round = 1; round <= 3; round++) {
    await clickStartRound(page, round);
    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });

    const startTime = Date.now();
    while (Date.now() - startTime < 25000) {
      const blueTargets = page.locator('.target.blue');
      if (await blueTargets.count() > 0) {
        await blueTargets.first().click();
        await page.waitForTimeout(100);
      } else {
        const exitIndicator = page.locator('button.btn-success, #reportScreen.active, #menuScreen.active');
        if (await exitIndicator.first().count() > 0) break;
        await page.waitForTimeout(200);
      }
    }

    if (round < 3) {
      const nextOrMenu = page.locator('button.btn-success, #menuScreen.active');
      await expect(nextOrMenu.first()).toBeVisible({ timeout: 8000 });
      if (await page.locator('#menuScreen.active').count() > 0) break;
    }
  }
}

test.describe('Full Session E2E', () => {
  test.setTimeout(180000);

  test('complete all 4 games and verify report screen', async ({ page }) => {
    await login(page, { name: 'Full Session Student', age: 14, grade: 9, teacher: 'Ms. Johnson', period: '3' });

    expect(await page.locator('.game-card').count()).toBe(4);

    // Game 1: Working Memory
    await startGame(page, 'Working Memory');
    await playMemoryGame(page);
    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.game-card.completed')).toHaveCount(1);

    // Game 2: Cognitive Flexibility
    await startGame(page, 'Cognitive Flexibility');
    await playFlexibilityGame(page);
    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.game-card.completed')).toHaveCount(2);

    // Game 3: Processing Speed
    await startGame(page, 'Processing Speed');
    await playSpeedGame(page);
    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.game-card.completed')).toHaveCount(3);

    // Game 4: Sustained Attention (last — triggers report)
    await startGame(page, 'Sustained Attention');
    await playAttentionGame(page);
    await expect(page.locator('#reportScreen')).toHaveClass(/active/, { timeout: 15000 });

    // Verify report content
    const reportInfo = page.locator('#reportInfo');
    await expect(reportInfo).toContainText('Full Session Student');
    await expect(reportInfo).toContainText('Age 14');
    await expect(reportInfo).toContainText('Grade 9');

    const scoreCards = page.locator('.score-card');
    expect(await scoreCards.count()).toBe(4);
    for (let i = 0; i < 4; i++) {
      const scoreText = await scoreCards.nth(i).locator('.score-value').textContent();
      expect(scoreText).toMatch(/\d+%/);
    }

    await expect(page.locator('#recommendations')).toBeVisible();
    expect(await page.locator('.rec-card').count()).toBe(4);
    expect(await page.locator('.rec-tier').count()).toBe(4);
    await expect(page.locator('#exportBtn')).toBeVisible();
    await expect(page.locator('#historyBtn')).toBeVisible();
  });
});
