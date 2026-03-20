# Neural Flow - Executive Function Training

Neural Flow is a web-based application that assesses and trains students' executive function skills through gamified cognitive tasks integrated with K-12 science curricula. It evaluates working memory, sustained attention, cognitive flexibility, and processing speed.

## Key Features

- **Zero-Setup Deployment** - Self-contained `index.html` (HTML/CSS/Vanilla JS). No server or database required.
- **Adaptive Difficulty** - Scales task difficulty (Levels 1-5) based on real-time performance using configurable thresholds.
- **K-12 Curriculum Integration** - Grade-appropriate science content (K-2 observable properties through 9-12 advanced chemistry) with automatic inheritance chains.
- **Comprehensive Reporting** - End-of-session reports with tier-based profiling (Strong, Developing, Needs Focus) and actionable study strategies tied to science learning.
- **Data Export** - JSON summary, trial-level CSV, and trial-level JSON for research use. Privacy-filtered to current student.
- **Google Sheets Sync** - Optional real-time sync via Apps Script for teachers and researchers.
- **Integrity Checks** - Developer console detection flags sessions as unverified.

## Training Modules

| Module | Skill | Task |
|--------|-------|------|
| Working Memory | Sequence recall | Memorize and reproduce adaptive number sequences |
| Sustained Attention | Target detection | Click blue circles, avoid red circles (d-prime scored) |
| Cognitive Flexibility | Rule switching | Classify science concepts as rules change dynamically |
| Processing Speed | Pattern matching | Match chemical formulas under time pressure |

## Quick Start

1. Open `index.html` in any modern web browser.
2. Enter student details on the launch screen.
3. Complete all four training modules.
4. Review the report and export data.

## Google Sheets Integration (Optional)

1. Open the Settings menu in the app.
2. Create a Google Sheet with headers: `Timestamp, Student, Age, Grade, Teacher, Period, Game, Score, Difficulty, Duration, Integrity`.
3. Go to **Extensions > Apps Script**, paste the code from the app's setup guide, and deploy as a Web App (access: "Anyone").
4. Paste the deployment URL into Neural Flow settings.

## Development

The `src/` directory contains a modular ES module extraction of the application for development and testing. The canonical deployment artifact remains `index.html`.

```bash
npm install            # Install dev dependencies
npm test               # Run unit tests (Vitest)
npm run test:e2e       # Run E2E tests (Playwright)
npm run test:all       # Run all tests
```

## Tech Stack

- **Frontend**: HTML5, CSS3 (custom properties, Flexbox/Grid), Vanilla JavaScript (ES6+)
- **Testing**: Vitest (unit, jsdom), Playwright (E2E)
- **Storage**: localStorage, JSON/CSV export, Google Apps Script `doPost`
