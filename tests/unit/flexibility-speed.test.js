import { describe, it, expect, beforeEach } from 'vitest';
import { setupFull } from '../helpers/setup.js';

describe('Flexibility Game', () => {
  let App, win;

  beforeEach(() => {
    ({ App, window: win } = setupFull({ gameId: 'flexibility', user: { teacher: '', period: '' } }));
  });

  describe('runFlexibilityTask', () => {
    it('creates flex state with correct trial count', () => {
      App.runFlexibilityTask(App.elements.gameArea);

      expect(App.flexState).toBeDefined();
      expect(App.flexState.trials).toBe(7); // 6 + difficulty(1)
      expect(App.flexState.current).toBe(1);
      expect(App.flexState.correct).toBe(0);
      expect(App.flexState.reactionTimes).toEqual([]);
    });

    it('scales trials with difficulty', () => {
      App.state.currentDifficulty = 4;
      App.runFlexibilityTask(App.elements.gameArea);
      expect(App.flexState.trials).toBe(10); // 6 + 4
    });

    it('renders response buttons in the game area', () => {
      App.runFlexibilityTask(App.elements.gameArea);

      const buttons = App.elements.gameArea.querySelectorAll('.response-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('renders the classification rule as a question', () => {
      App.runFlexibilityTask(App.elements.gameArea);

      const rule = App.flexState.rule;
      const ruleText = App.elements.gameArea.textContent;
      expect(ruleText).toContain(rule.question);
    });
  });

  describe('flexibility response handling via handleGameClick', () => {
    it('increments correct count for correct response', () => {
      App.runFlexibilityTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const correctBtn = App.elements.gameArea.querySelector('.response-btn[data-correct="true"]');
      expect(correctBtn).not.toBeNull();

      // Simulate click through delegation
      App.handleGameClick({ target: correctBtn });

      expect(App.flexState.correct).toBe(1);
    });

    it('does not increment correct for wrong response', () => {
      App.runFlexibilityTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const wrongBtn = App.elements.gameArea.querySelector('.response-btn[data-correct="false"]');
      // Flexibility rules always have 2 options, so a wrong button must exist
      expect(wrongBtn).not.toBeNull();
      App.handleGameClick({ target: wrongBtn });
      expect(App.flexState.correct).toBe(0);
    });

    it('records reaction time', () => {
      App.runFlexibilityTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const btn = App.elements.gameArea.querySelector('.response-btn');
      App.handleGameClick({ target: btn });

      expect(App.flexState.reactionTimes.length).toBe(1);
      expect(App.flexState.reactionTimes[0]).toBeGreaterThanOrEqual(0);
    });

    it('logs a trial with correct metadata', () => {
      App.runFlexibilityTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const btn = App.elements.gameArea.querySelector('.response-btn');
      App.handleGameClick({ target: btn });

      expect(App.state.trialLog.length).toBe(1);
      expect(App.state.trialLog[0].trialType).toBe('flexibility_classification');
      expect(App.state.trialLog[0].rule).toBeDefined();
    });
  });

  describe('grade-appropriate content selection', () => {
    it('uses grade 6 content for grade 6 students', () => {
      App.state.user.grade = 6;
      App.runFlexibilityTask(App.elements.gameArea);

      const ruleKeys = ['metal/nonmetal', 'physical/chemical', 'conductor/insulator', 'element/compound', 'renewable/nonrenewable'];
      expect(ruleKeys).toContain(App.flexState.rule.key);
    });

    it('uses K-2 content for kindergarten students', () => {
      App.state.user.grade = 'K';
      App.runFlexibilityTask(App.elements.gameArea);

      const ruleKeys = ['living/nonliving', 'solid/liquid', 'hot/cold'];
      expect(ruleKeys).toContain(App.flexState.rule.key);
    });
  });
});

describe('Speed Game', () => {
  let App, win;

  beforeEach(() => {
    ({ App, window: win } = setupFull({ gameId: 'speed', user: { teacher: '', period: '' } }));
  });

  describe('runSpeedTask', () => {
    it('creates speed state with correct trial count', () => {
      App.runSpeedTask(App.elements.gameArea);

      expect(App.speedState).toBeDefined();
      expect(App.speedState.trials).toBe(6); // 5 + difficulty(1)
      expect(App.speedState.current).toBe(1);
      expect(App.speedState.correct).toBe(0);
    });

    it('scales trials with difficulty', () => {
      App.state.currentDifficulty = 5;
      App.runSpeedTask(App.elements.gameArea);
      expect(App.speedState.trials).toBe(10); // 5 + 5
    });

    it('renders chemical formula stimulus', () => {
      App.runSpeedTask(App.elements.gameArea);
      const stimulus = App.elements.gameArea.querySelector('.stimulus');
      expect(stimulus).not.toBeNull();
      expect(stimulus.textContent.length).toBeGreaterThan(0);
    });

    it('renders response buttons with formula options', () => {
      App.runSpeedTask(App.elements.gameArea);
      const buttons = App.elements.gameArea.querySelectorAll('.response-btn');
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it('exactly one response button is marked correct', () => {
      App.runSpeedTask(App.elements.gameArea);
      const buttons = App.elements.gameArea.querySelectorAll('.response-btn');
      const correctButtons = Array.from(buttons).filter(b => b.dataset.correct === 'true');
      expect(correctButtons.length).toBe(1);
    });
  });

  describe('speed response handling via handleGameClick', () => {
    it('increments correct count for correct answer', () => {
      App.runSpeedTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const correctBtn = App.elements.gameArea.querySelector('.response-btn[data-correct="true"]');
      App.handleGameClick({ target: correctBtn });

      expect(App.speedState.correct).toBe(1);
    });

    it('records reaction time', () => {
      App.runSpeedTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const btn = App.elements.gameArea.querySelector('.response-btn');
      App.handleGameClick({ target: btn });

      expect(App.speedState.reactionTimes.length).toBe(1);
    });

    it('logs a trial entry', () => {
      App.runSpeedTask(App.elements.gameArea);
      App.gameTimeout = () => {};

      const btn = App.elements.gameArea.querySelector('.response-btn');
      App.handleGameClick({ target: btn });

      expect(App.state.trialLog.length).toBe(1);
      expect(App.state.trialLog[0].trialType).toBe('speed_match');
    });
  });
});
