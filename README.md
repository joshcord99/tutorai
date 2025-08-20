# TutorAI

<img src="src/assets/full-logo.png" width="200" alt="TutorAI Logo">

A privacy-preserving AI tutor for LeetCode that provides hints, solutions, and interactive tutoring.

## What is TutorAI?

TutorAI is a browser extension that:

- Reads LeetCode problem descriptions from the webpage
- Provides AI-powered hints and guidance for learning
- Analyzes code complexity and suggests improvements
- Helps users understand problem-solving approaches
- Works only on LeetCode problem pages (not during contests)

## Features

### Interface Overview

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px;">
  <img src="src/assets/chat.png" width="350" alt="Chat Interface">
  <img src="src/assets/plan.png" width="350" alt="Planning Interface">
  <img src="src/assets/edge-case.png" width="350" alt="Edge Case Detection">
  <img src="src/assets/hints.png" width="350" alt="Hints System">
  <img src="src/assets/complexity.png" width="350" alt="Complexity Analysis">
  <img src="src/assets/solve-1.png" width="350" alt="Solution Steps">
</div>

### Solution Analysis

<div style="display: flex; gap: 20px; flex-wrap: wrap;">
  <img src="src/assets/solve-2.png" width="350" alt="Detailed Solutions">
</div>

### Configuration

<img src="src/assets/options.png" width="400" alt="Options Configuration">

## Installation & Setup

### 1. Install & Build

```bash
npm install
npm run build
```

### 2. Load Extension

- Open Chrome → `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked" → select `tutorai` folder

### 3. Configure API Keys

- Click extension icon → "Options"
- Add your API keys for OpenAI, Anthropic, or Google Gemini

### 4. Start Learning

- Go to any LeetCode problem
- Press `Ctrl+Shift+L` or click extension icon
- Get AI-powered tutoring instantly

## API Usage

**API Calls per Problem:**

- **Initial Load**: 4 API calls (hints, plan, edge cases, complexity analysis)
- **Chat Messages**: 1 API call per message
- **Solution Generation**: 1 API call per request
- **Refresh Button**: 4 API calls (regenerates hints, plan, edge cases, complexity analysis)

**Note:** API costs vary by provider and usage. Check your chosen provider's pricing page for current rates.

## Privacy & Security

All processing happens in your browser. Your API keys and data never leave your device.

### Privacy Policy

For detailed information about how TutorAI handles your data, please see our [Privacy Policy](privacy-policy.md).

**Key Points:**

- We only collect LeetCode problem content to provide tutoring
- API keys are stored locally on your device
- No personal information is collected or stored
- All data processing happens in your browser
- We do not sell, share, or monetize your data

## Contributing

### Open Source

TutorAI is open source software. You can review the code and contribute improvements.

### Bug Reports

**Found a bug?** Please report it as an issue on GitHub with details about:

- What you were doing when the bug occurred
- Steps to reproduce the issue
- Any error messages you see
- Screenshots

### Feature Requests

Have ideas for new features or improvements? We'd love to hear them! Please create an issue on GitHub with:

- **Feature Request** label
- Clear description of the proposed feature
- Why it would be helpful for learning
- Any examples or mockups if applicable

## Contact

For questions, bug reports, or privacy concerns:

- **Email:** joshcord99@gmail.com
- **GitHub:** [github.com/joshcord99](https://github.com/joshcord99)
