// @ts-check
import { expect } from '@playwright/test';

/**
 * Login with student data. All fields are optional and have defaults.
 */
export async function login(page, opts = {}) {
  const {
    name = 'E2E Student',
    age = '12',
    grade = '6',
  } = opts;

  await page.goto('/');
  await page.fill('#name', name);
  await page.fill('#age', String(age));
  await page.selectOption('#grade', String(grade));
  await page.click('#beginBtn');
  await expect(page.locator('#menuScreen')).toHaveClass(/active/);
}

/**
 * Start a game by clicking its card on the menu.
 */
export async function startGame(page, gameName) {
  await page.locator('.game-card', { hasText: gameName }).click();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
}

/**
 * Click "Start Round N" button.
 */
export async function clickStartRound(page, round) {
  await page.locator('button.btn-success', { hasText: new RegExp(`Start Round ${round}`) }).click();
}

/**
 * Wait for either the next round button or the menu screen (game ended).
 */
export async function waitForRoundEnd(page, nextRound) {
  await expect(
    page.locator(`button.btn-success:has-text("Start Round ${nextRound}"), #menuScreen.active`).first()
  ).toBeVisible({ timeout: 8000 });
}
