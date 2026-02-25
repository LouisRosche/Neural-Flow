Neural Flow - Executive Function Training

Neural Flow is a single-file, web-based application designed to assess and train students' executive function skills. It uses gamified cognitive tasks integrated with science curricula to evaluate working memory, sustained attention, cognitive flexibility, and processing speed.

✨ Key Features

Zero-Setup Deployment: Entirely contained within a single HTML file (HTML/CSS/Vanilla JS). No server or database required.

Adaptive Difficulty: Automatically scales task difficulty (Levels 1-5) based on real-time user performance.

Curriculum Integrated: Utilizes science concepts (e.g., element classification, chemical formulas) within the cognitive tasks.

Comprehensive Reporting: Generates end-of-session reports with tier-based profiling (Strong, Developing, Needs Focus) and actionable study strategies.

Data Management: * Local storage for session history.

Direct export to JSON.

Native Google Sheets syncing via Apps Script (for teachers/researchers).

Integrity Checks: Basic anti-cheat mechanisms that detect developer console usage.

🧠 Training Modules

Working Memory: Users memorize and reproduce adaptive sequences of numbers.

Sustained Attention: A continuous performance task (CPT) requiring users to quickly identify target stimuli (blue circles) while inhibiting responses to distractors (red circles).

Cognitive Flexibility: Users rapidly classify scientific concepts (e.g., metals vs. nonmetals, physical vs. chemical changes) as rules change dynamically.

Processing Speed: A rapid pattern-recognition task matching complex chemical formulas under time pressure.

🚀 Quick Start

Download or copy the index.html file.

Double-click the file to open it in any modern web browser.

Enter student details on the launch screen to begin training.

📊 Google Sheets Integration (Optional)

To automatically collect student data centrally:

Open the Settings (⚙) menu in the app.

Create a new Google Sheet with the headers: Timestamp, Student, Age, Grade, Teacher, Period, Game, Score, Difficulty, Duration, Integrity.

Go to Extensions → Apps Script, paste the provided code from the app's setup guide, and deploy it as a Web App (accessible to "Anyone").

Paste the resulting Web App URL into the Neural Flow settings. Data will now seamlessly sync after every completed game.

🛠 Tech Stack

Frontend: HTML5, CSS3 (CSS Variables, Flexbox/Grid), Vanilla JavaScript (ES6+).

Storage: localStorage, JSON Export, Google Apps Script doPost integration.
