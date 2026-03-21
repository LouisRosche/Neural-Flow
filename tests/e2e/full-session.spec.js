// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Helper: login with default student data.
 */
async function login(page) {
  await page.goto('/');
  await page.fill('#name', 'Full Session Student');
  await page.fill('#age', '14');
  await page.selectOption('#grade', '9');
  await page.fill('#teacher', 'Ms. Johnson');
  await page.selectOption('#period', '3');
  await page.click('#beginBtn');
  await expect(page.locator('#menuScreen')).toHaveClass(/active/);
}

/**
 * Complete all 3 rounds of the memory game.
 * Enters arbitrary digits — we just need the scoring flow to complete.
 */
async function playMemoryGame(page) {
  for (let round = 1; round <= 3; round++) {
    await page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round}`) }).click();

    // Wait for number pad to appear (sequence display finishes)
    await expect(page.locator('.number-pad')).toBeVisible({ timeout: 15000 });

    // Enter digits to fill all input slots
    const slots = page.locator('.input-slot');
    const slotCount = await slots.count();
    for (let i = 0; i < slotCount; i++) {
      await page.locator('.number-btn', { hasText: new RegExp(`^${i % 10}$`) }).first().click();
      await page.waitForTimeout(150);
    }

    // Wait for feedback + next round (1500ms feedback + 100ms + rendering)
    if (round < 3) {
      await expect(page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round + 1}`) }))
        .toBeVisible({ timeout: 8000 });
    }
  }
}

/**
 * Complete all 3 rounds of the flexibility game.
 * Clicks the first response button each trial (may or may not be correct).
 */
async function playFlexibilityGame(page) {
  for (let round = 1; round <= 3; round++) {
    await page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round}`) }).click();

    // Each round: 6 + difficulty trials. Click through them all.
    for (let t = 0; t < 12; t++) {
      const btn = page.locator('.response-btn').first();
      const visible = await btn.isVisible().catch(() => false);
      if (!visible) {
        await page.waitForTimeout(700);
        if (!(await page.locator('.response-btn').first().isVisible().catch(() => false))) break;
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
 * Complete all 3 rounds of the speed game.
 * Clicks the correct button each trial for a good score.
 */
async function playSpeedGame(page) {
  for (let round = 1; round <= 3; round++) {
    await page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round}`) }).click();

    for (let t = 0; t < 10; t++) {
      const correctBtn = page.locator('.response-btn[data-correct="true"]');
      const visible = await correctBtn.isVisible().catch(() => false);
      if (!visible) {
        await page.waitForTimeout(500);
        if (!(await page.locator('.response-btn[data-correct="true"]').isVisible().catch(() => false))) break;
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
 * Complete all 3 rounds of the attention game.
 * Clicks blue targets as they appear.
 */
async function playAttentionGame(page) {
  for (let round = 1; round <= 3; round++) {
    await page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round}`) }).click();
    await expect(page.locator('#targetArea')).toBeVisible({ timeout: 5000 });

    const startTime = Date.now();
    const maxWaitMs = 25000;

    while (Date.now() - startTime < maxWaitMs) {
      const blueTargets = page.locator('.target.blue');
      if (await blueTargets.count() > 0) {
        await blueTargets.first().click();
        await page.waitForTimeout(100);
      } else {
        // Check if round ended
        const nextRound = page.locator('button.btn-success', { hasText: /Start Round/ });
        const feedback = page.locator('.feedback');
        const reportScreen = page.locator('#reportScreen.active');
        if (await nextRound.count() > 0 || await reportScreen.count() > 0) break;
        // Also check if we're back on menu (game ended)
        const menuScreen = page.locator('#menuScreen.active');
        if (await menuScreen.count() > 0) break;
        await page.waitForTimeout(200);
      }
    }

    if (round < 3) {
      // Wait for next round button or menu (game may have ended)
      const nextOrMenu = page.locator('button.btn-success, #menuScreen.active');
      await expect(nextOrMenu.first()).toBeVisible({ timeout: 8000 });
      if (await page.locator('#menuScreen.active').count() > 0) break;
    }
  }
}

test.describe('Full Session E2E', () => {
  // Increase timeout for full session (all 4 games × 3 rounds each)
  test.setTimeout(180000);

  test('complete all 4 games and verify report screen', async ({ page }) => {
    await login(page);

    // Verify 4 game cards on menu
    const gameCards = page.locator('.game-card');
    expect(await gameCards.count()).toBe(4);

    // --- Game 1: Working Memory ---
    await page.locator('.game-card', { hasText: 'Working Memory' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
    await playMemoryGame(page);

    // Should return to menu after game ends
    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    // Memory card should be marked completed
    await expect(page.locator('.game-card.completed')).toHaveCount(1);

    // --- Game 2: Cognitive Flexibility ---
    await page.locator('.game-card', { hasText: 'Cognitive Flexibility' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
    await playFlexibilityGame(page);

    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.game-card.completed')).toHaveCount(2);

    // --- Game 3: Processing Speed ---
    await page.locator('.game-card', { hasText: 'Processing Speed' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
    await playSpeedGame(page);

    await expect(page.locator('#menuScreen')).toHaveClass(/active/, { timeout: 10000 });
    await expect(page.locator('.game-card.completed')).toHaveCount(3);

    // --- Game 4: Sustained Attention (last — triggers report) ---
    await page.locator('.game-card', { hasText: 'Sustained Attention' }).click();
    await expect(page.locator('#gameScreen')).toHaveClass(/active/);
    await playAttentionGame(page);

    // After all 4 games, report screen should auto-show
    await expect(page.locator('#reportScreen')).toHaveClass(/active/, { timeout: 15000 });

    // --- Verify Report Content ---

    // Report header with student info
    const reportInfo = page.locator('#reportInfo');
    await expect(reportInfo).toContainText('Full Session Student');
    await expect(reportInfo).toContainText('Age 14');
    await expect(reportInfo).toContainText('Grade 9');

    // 4 score cards
    const scoreCards = page.locator('.score-card');
    expect(await scoreCards.count()).toBe(4);

    // Each score card should show a percentage
    for (let i = 0; i < 4; i++) {
      const scoreText = await scoreCards.nth(i).locator('.score-value').textContent();
      expect(scoreText).toMatch(/\d+%/);
    }

    // Recommendations should be visible
    await expect(page.locator('#recommendations')).toBeVisible();

    // Should have recommendation cards for each game
    const recCards = page.locator('.rec-card');
    expect(await recCards.count()).toBe(4);

    // Each rec card should have a tier badge
    const tiers = page.locator('.rec-tier');
    expect(await tiers.count()).toBe(4);

    // Export button should be present
    await expect(page.locator('#exportBtn')).toBeVisible();

    // History button should be present
    await expect(page.locator('#historyBtn')).toBeVisible();
  });
});
