import { describe, it, expect, beforeEach } from 'vitest';
import { setupFull } from '../helpers/setup.js';

/**
 * Tests for UI rendering, screen transitions, and game card behavior.
 */
describe('UI Rendering', () => {
  let App, win;

  beforeEach(() => {
    ({ App, window: win } = setupFull({ user: true }));
  });

  // ============================================================
  // SCREEN TRANSITIONS
  // ============================================================

  describe('showScreen', () => {
    it('activates the target screen', () => {
      App.showScreen('menu');
      const menu = win.document.getElementById('menuScreen');
      expect(menu.classList.contains('active')).toBe(true);
    });

    it('deactivates all other screens', () => {
      App.showScreen('login');
      App.showScreen('menu');

      const login = win.document.getElementById('loginScreen');
      const menu = win.document.getElementById('menuScreen');
      expect(login.classList.contains('active')).toBe(false);
      expect(menu.classList.contains('active')).toBe(true);
    });

    it('is idempotent (same screen twice)', () => {
      App.showScreen('menu');
      App.showScreen('menu');
      const menu = win.document.getElementById('menuScreen');
      expect(menu.classList.contains('active')).toBe(true);
    });

    it('cycles through all screens', () => {
      const screens = ['login', 'menu', 'game', 'report'];
      for (const screen of screens) {
        App.showScreen(screen);
        // Only the current screen should be active
        for (const other of screens) {
          const el = win.document.getElementById(`${other}Screen`);
          if (other === screen) {
            expect(el.classList.contains('active')).toBe(true);
          } else {
            expect(el.classList.contains('active')).toBe(false);
          }
        }
      }
    });
  });

  // ============================================================
  // RENDER GAMES (Game Card Grid)
  // ============================================================

  describe('renderGames', () => {
    it('renders 4 game cards', () => {
      App.renderGames();
      const cards = App.elements.gamesGrid.querySelectorAll('.game-card');
      expect(cards.length).toBe(4);
    });

    it('marks completed games with score badges', () => {
      App.state.gameScores = { memory: 85, attention: 70 };
      App.renderGames();

      const completedCards = App.elements.gamesGrid.querySelectorAll('.game-card.completed');
      expect(completedCards.length).toBe(2);

      const scoreBadges = App.elements.gamesGrid.querySelectorAll('.game-score');
      expect(scoreBadges.length).toBe(2);
    });

    it('incomplete game cards have role=button', () => {
      App.state.gameScores = {};
      App.renderGames();

      const cards = App.elements.gamesGrid.querySelectorAll('.game-card[role="button"]');
      expect(cards.length).toBe(4);
    });

    it('completed game cards do not have role=button', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.renderGames();

      const buttonCards = App.elements.gamesGrid.querySelectorAll('.game-card[role="button"]');
      expect(buttonCards.length).toBe(0);
    });

    it('game cards have accessible aria-labels', () => {
      App.renderGames();
      const cards = App.elements.gamesGrid.querySelectorAll('.game-card');
      cards.forEach(card => {
        expect(card.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('re-render clears previous cards', () => {
      App.renderGames();
      App.renderGames();
      const cards = App.elements.gamesGrid.querySelectorAll('.game-card');
      expect(cards.length).toBe(4);
    });
  });

  // ============================================================
  // CLEAR GAME AREA
  // ============================================================

  describe('clearGameArea', () => {
    it('removes all children from game area', () => {
      const area = App.elements.gameArea;
      area.innerHTML = '<div>child1</div><div>child2</div>';
      App.clearGameArea();
      expect(area.children.length).toBe(0);
    });

    it('preserves .game-instructions if present', () => {
      const area = App.elements.gameArea;
      const instructions = win.document.createElement('div');
      instructions.className = 'game-instructions';
      instructions.textContent = 'Instructions here';
      area.appendChild(instructions);
      area.appendChild(win.document.createElement('div'));

      App.clearGameArea();
      expect(area.children.length).toBe(1);
      expect(area.querySelector('.game-instructions')).not.toBeNull();
    });

    it('handles empty game area', () => {
      App.elements.gameArea.innerHTML = '';
      expect(() => App.clearGameArea()).not.toThrow();
    });
  });

  // ============================================================
  // MEMORY GAME INPUT UI
  // ============================================================

  describe('memory input UI', () => {
    beforeEach(() => {
      App.state.currentGame = 'memory';
      App.state.currentDifficulty = 1;
      App.state.currentTask = 0;
      App.state.taskScores = [];
    });

    it('renders 10 number pad buttons (0-9)', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();

      const numBtns = App.elements.gameArea.querySelectorAll('.number-btn');
      expect(numBtns.length).toBe(10);
    });

    it('number pad buttons have data-num attributes 0-9', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();

      const numBtns = App.elements.gameArea.querySelectorAll('.number-btn');
      const nums = Array.from(numBtns).map(b => parseInt(b.dataset.num)).sort();
      expect(nums).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('renders correct number of input slots', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();

      const slots = App.elements.gameArea.querySelectorAll('.input-slot');
      expect(slots.length).toBe(App.memoryState.length);
    });

    it('renders a clear button', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.showMemoryInput();

      const clearBtn = App.elements.gameArea.querySelector('#clearBtn');
      expect(clearBtn).not.toBeNull();
    });

    it('sets inputStartTime on first render', () => {
      App.runMemoryTask(App.elements.gameArea);
      App.memoryState.showIndex = App.memoryState.sequence.length;
      App.memoryState.inputStartTime = null;
      App.showMemoryInput();

      expect(App.memoryState.inputStartTime).not.toBeNull();
      expect(App.memoryState.inputStartTime).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // FEEDBACK DISPLAY
  // ============================================================

  describe('showFeedback', () => {
    it('renders a feedback element in the DOM', () => {
      App.showFeedback('Test message', 'success');
      const feedback = win.document.querySelector('.feedback');
      expect(feedback).not.toBeNull();
      expect(feedback.textContent).toBe('Test message');
    });

    it('applies the correct CSS class for type', () => {
      App.showFeedback('Error!', 'error');
      const feedback = win.document.querySelector('.feedback');
      expect(feedback.classList.contains('error')).toBe(true);
    });

    it('has role=alert for accessibility', () => {
      App.showFeedback('Alert!', 'warning');
      const feedback = win.document.querySelector('.feedback');
      expect(feedback.getAttribute('role')).toBe('alert');
    });

    it('replaces previous feedback', () => {
      App.showFeedback('First', 'info');
      App.showFeedback('Second', 'info');
      const feedbacks = win.document.querySelectorAll('.feedback');
      expect(feedbacks.length).toBe(1);
      expect(feedbacks[0].textContent).toBe('Second');
    });
  });

  // ============================================================
  // GAME LIFECYCLE INTEGRATION
  // ============================================================

  describe('game lifecycle edge cases', () => {
    it('startGame sets correct state', () => {
      App.startGame('memory');
      expect(App.state.currentGame).toBe('memory');
      expect(App.state.currentTask).toBe(0);
      expect(App.state.currentDifficulty).toBe(1);
      expect(App.state.taskScores).toEqual([]);
      expect(App.state.gameStart).toBeGreaterThan(0);
    });

    it('exitGame during first task does not require confirm', async () => {
      App.startGame('memory');
      App.state.currentTask = 0;
      // Should exit without confirmation dialog
      await App.exitGame();
      expect(App.state.currentGame).toBeNull();
    });

    it('endGame with mixed scores averages correctly', () => {
      App.state.currentGame = 'attention';
      App.state.taskScores = [60, 80, 100];
      App.endGame();
      expect(App.state.gameScores.attention).toBe(80);
    });
  });
});
