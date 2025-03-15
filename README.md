# TUTORAI

A privacy-preserving AI tutor for LeetCode that provides hints, solutions, and interactive tutoring.

## Features

<img src="server/assets/plan.png" width="700" alt="Planning Interface">
<img src="server/assets/chat.png" width="300" alt="Chat Interface">
<img src="server/assets/edge-case.png" width="300" alt="Edge Case Detection">
<img src="server/assets/hints.png" width="300" alt="Hints System">
<img src="server/assets/complexity.png" width="300" alt="Complexity Analysis">
<img src="server/assets/solve-1.png" width="300" alt="Solution Steps">
<img src="server/assets/solve-2.png" width="300" alt="Detailed Solutions">
<img src="server/assets/options.png" width="300" alt="Options Configuration">

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
