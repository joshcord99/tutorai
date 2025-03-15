# TUTORAI

<img src="src/assets/full-logo.png" width="200" alt="TUTORAI Logo">

A privacy-preserving AI tutor for LeetCode that provides hints, solutions, and interactive tutoring.

## Disclaimer

TUTORAI is a browser extension that:

- Reads LeetCode problem descriptions from the webpage
- Provides AI-powered hints and guidance for learning
- Analyzes code complexity and suggests improvements
- Helps users understand problem-solving approaches
- Works only on LeetCode problem pages at this current time (not during contests)

## Features

### Example

<img src="src/assets/example.png" width="800" alt="Planning Interface">

### Interface

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

## Quick Setup

1. **Install & Build**

   ```bash
   npm install
   npm run build
   ```

2. **Load Extension**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → select `dist` folder

3. **Configure API Keys**
   - Click extension icon → "Options"
   - Add your API keys for OpenAI, Anthropic, or Google Gemini

4. **Start Learning**
   - Go to any LeetCode problem
   - Press `Ctrl+Shift+L` or click extension icon
   - Get AI-powered tutoring instantly

## Privacy First

All processing happens in your browser. Your API keys and data never leave your device.
