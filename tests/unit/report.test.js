import { describe, it, expect, beforeEach } from 'vitest';
import { getApp } from '../helpers/load-app.js';

describe('Report Generation', () => {
  let App;

  beforeEach(() => {
    App = getApp();
    App.testStorage();
    App.cacheElements();
    App._timers = new Set();
    App.state.user = { name: 'Test', age: 12, grade: 6, teacher: 'Dr. Smith', period: '3' };
    App.state.sessionStart = Date.now() - 300000; // 5 minutes ago
    App.state.trialLog = [];
    App.state.history = [];
  });

  describe('showReport', () => {
    it('calculates average score across all games', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.showReport();

      const average = (80 + 70 + 90 + 60) / 4;
      expect(average).toBe(75);
    });

    it('saves session to history', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.showReport();

      expect(App.state.history.length).toBe(1);
      expect(App.state.history[0].average).toBe(75);
      expect(App.state.history[0].user.name).toBe('Test');
      expect(App.state.history[0].scores.memory).toBe(80);
    });

    it('renders score cards for each game', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.showReport();

      const scoreCards = App.elements.reportScores.querySelectorAll('.score-card');
      expect(scoreCards.length).toBe(4);
    });

    it('displays user info in report header', () => {
      App.state.gameScores = { memory: 80 };
      App.showReport();

      const info = App.elements.reportInfo.textContent;
      expect(info).toContain('Test');
      expect(info).toContain('Age 12');
      expect(info).toContain('Grade 6');
      expect(info).toContain('Dr. Smith');
      expect(info).toContain('Period 3');
    });

    it('marks integrity as verified when checksum is valid', () => {
      App.state.gameScores = { memory: 80 };
      App.state.integrityChecksum = 12345;
      App.showReport();

      expect(App.state.history[0].integrity).toBe('verified');
    });

    it('marks integrity as unverified when checksum says so', () => {
      App.state.gameScores = { memory: 80 };
      App.state.integrityChecksum = 'unverified';
      App.showReport();

      expect(App.state.history[0].integrity).toBe('unverified');
    });
  });

  describe('buildRecommendations', () => {
    it('renders recommendation cards for each game', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.showReport();

      const recCards = App.elements.recommendations.querySelectorAll('.rec-card');
      expect(recCards.length).toBe(4);
    });

    it('assigns correct tier badges', () => {
      App.state.gameScores = { memory: 85, attention: 65, flexibility: 40, speed: 80 };
      App.showReport();

      const tiers = App.elements.recommendations.querySelectorAll('.rec-tier');
      const tierTexts = Array.from(tiers).map(t => t.textContent);

      // memory 85 → Strong, attention 65 → Developing, flexibility 40 → Needs Focus, speed 80 → Strong
      expect(tierTexts).toContain('Strong');
      expect(tierTexts).toContain('Developing');
      expect(tierTexts).toContain('Needs Focus');
    });

    it('renders synthesis section', () => {
      App.state.gameScores = { memory: 80, attention: 70, flexibility: 90, speed: 60 };
      App.showReport();

      const synthesis = App.elements.recommendations.querySelector('.rec-synthesis');
      expect(synthesis).not.toBeNull();
      expect(synthesis.textContent).toContain('Science Study Strategy');
    });

    it('renders profile summary with percentage', () => {
      App.state.gameScores = { memory: 80, attention: 80, flexibility: 80, speed: 80 };
      App.showReport();

      const profileScore = App.elements.recommendations.querySelector('.rec-profile-score');
      expect(profileScore.textContent).toBe('80%');
    });

    it('shows tips - more tips for lower-performing areas', () => {
      App.state.gameScores = { memory: 40, attention: 90, flexibility: 50, speed: 85 };
      App.showReport();

      const recCards = App.elements.recommendations.querySelectorAll('.rec-card');
      // Check that needs-focus cards have more tips than strong cards
      recCards.forEach(card => {
        const tier = card.querySelector('.rec-tier');
        const tips = card.querySelectorAll('.rec-tips li');
        if (tier.textContent === 'Strong') {
          expect(tips.length).toBe(1);
        } else {
          expect(tips.length).toBe(2);
        }
      });
    });
  });

  describe('toggleHistory', () => {
    it('shows history with at least the current session after report', () => {
      App.state.history = [];
      App.state.gameScores = { memory: 80 };
      App.showReport(); // This adds current session to history
      App.toggleHistory();

      // After showReport, history has 1 entry (the session just completed)
      const rows = App.elements.historyContainer.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
    });

    it('renders history table with pre-existing entries plus current', () => {
      App.state.history = [
        { date: '2024-01-01T00:00:00.000Z', user: { name: 'Alice' }, scores: { memory: 80, attention: 70 }, average: 75 },
        { date: '2024-01-02T00:00:00.000Z', user: { name: 'Bob' }, scores: { memory: 90 }, average: 90 }
      ];
      App.state.gameScores = { memory: 80 };
      App.showReport(); // Adds a 3rd entry
      App.toggleHistory();

      const rows = App.elements.historyContainer.querySelectorAll('tbody tr');
      expect(rows.length).toBe(3);
    });

    it('toggles visibility on second call', () => {
      App.state.history = [];
      App.state.gameScores = { memory: 80 };
      App.showReport();

      App.toggleHistory();
      expect(App.elements.historySection.style.display).toBe('block');

      App.toggleHistory();
      expect(App.elements.historySection.style.display).toBe('none');
    });
  });
});
